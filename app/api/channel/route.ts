import { NextRequest, NextResponse } from 'next/server';
import { getChannel, getChannelVideos } from '@/lib/youtube';

// GET /api/channel?id=UCxxxxxx
export async function GET(request: NextRequest) {
  try {
    const channelId = request.nextUrl.searchParams.get('id');
    const apiKey = request.headers.get('x-youtube-api-key') || undefined;

    if (!channelId) {
      return NextResponse.json({ error: '채널 ID가 필요합니다.' }, { status: 400 });
    }

    // 채널 정보 + 영상 목록 병렬 요청
    const [channel, videos] = await Promise.all([
      getChannel(channelId, apiKey),
      getChannelVideos(channelId, 30, apiKey),
    ]);

    // 영상 통계 계산
    const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0);
    const avgViews = videos.length > 0 ? Math.round(totalViews / videos.length) : 0;
    const topVideo = videos.length > 0
      ? videos.reduce((top, v) => (v.viewCount > top.viewCount ? v : top), videos[0])
      : null;

    // 참여율 계산 (좋아요+댓글 / 조회수)
    const videosWithEngagement = videos.map((v) => ({
      ...v,
      engagementRate: v.viewCount > 0
        ? ((v.likeCount + v.commentCount) / v.viewCount) * 100
        : 0,
    }));

    return NextResponse.json({
      channel,
      videos: videosWithEngagement,
      stats: {
        totalViews,
        avgViews,
        topVideo,
        videoCount: videos.length,
      },
    });
  } catch (error) {
    console.error('채널 API 오류:', error);
    const message = error instanceof Error ? error.message : '채널 조회 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
