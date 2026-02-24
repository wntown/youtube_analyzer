import { NextRequest, NextResponse } from 'next/server';
import { getChannel, getAllChannelVideos, searchChannels, getVideoChannelId } from '@/lib/youtube';

// GET /api/channel-analysis?q=채널명또는URL
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q');
    const apiKey = request.headers.get('x-youtube-api-key') || undefined;

    if (!query) {
      return NextResponse.json({ error: '채널명 또는 URL을 입력해주세요.' }, { status: 400 });
    }

    let channelId: string | null = null;

    // 0) 영상 URL (watch?v=xxx 또는 shorts/xxx 또는 youtu.be/xxx) → 영상에서 채널 ID 추출
    const videoIdMatch = query.match(
      /(?:youtube\.com\/watch\?.*v=|youtube\.com\/shorts\/|youtu\.be\/)([\w-]{11})/
    );
    if (videoIdMatch) {
      channelId = await getVideoChannelId(videoIdMatch[1], apiKey);
    }

    // 1) youtube.com/channel/UCxxxx 형태 (채널 ID 직접 포함)
    const channelUrlMatch = query.match(/youtube\.com\/channel\/(UC[\w-]+)/);
    if (!channelId && channelUrlMatch) {
      channelId = channelUrlMatch[1];
    }

    // 2) @핸들 또는 youtube.com/@handle 형태
    const handleMatch = query.match(/(?:youtube\.com\/@|^@)([\w.-]+)/);
    if (!channelId && handleMatch) {
      const result = await searchChannels({ query: handleMatch[1], maxResults: 1 }, apiKey);
      if (result.channels.length > 0) {
        channelId = result.channels[0].id;
      }
    }

    // 3) youtube.com/c/이름 또는 youtube.com/user/이름 형태 (커스텀 URL)
    const customUrlMatch = query.match(/youtube\.com\/(?:c|user)\/([\w.-]+)/);
    if (!channelId && customUrlMatch) {
      const result = await searchChannels({ query: customUrlMatch[1], maxResults: 1 }, apiKey);
      if (result.channels.length > 0) {
        channelId = result.channels[0].id;
      }
    }

    // 4) youtube.com/이름 형태 (슬래시 뒤에 바로 채널명이 오는 경우)
    const shortUrlMatch = query.match(/youtube\.com\/([\w.-]+)\/?$/);
    if (!channelId && shortUrlMatch && !['watch', 'shorts', 'playlist', 'feed', 'results', 'channel', 'c', 'user'].includes(shortUrlMatch[1])) {
      const result = await searchChannels({ query: shortUrlMatch[1], maxResults: 1 }, apiKey);
      if (result.channels.length > 0) {
        channelId = result.channels[0].id;
      }
    }

    // 5) UC로 시작하면 직접 채널 ID로 간주
    if (!channelId && query.startsWith('UC') && query.length > 20) {
      channelId = query;
    }

    // 6) 그 외에는 채널명으로 검색
    if (!channelId) {
      const result = await searchChannels({ query, maxResults: 1 }, apiKey);
      if (result.channels.length > 0) {
        channelId = result.channels[0].id;
      }
    }

    if (!channelId) {
      return NextResponse.json({ error: '채널을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 채널 정보 + 전체 영상 목록 병렬 요청
    // getAllChannelVideos: playlistItems.list로 페이지네이션하여 최대 500개
    const [channel, videos] = await Promise.all([
      getChannel(channelId, apiKey),
      getAllChannelVideos(channelId, 500, apiKey),
    ]);

    // 영상 통계 계산
    const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0);
    const totalLikes = videos.reduce((sum, v) => sum + v.likeCount, 0);
    const avgViews = videos.length > 0 ? Math.round(totalViews / videos.length) : 0;
    const avgLikes = videos.length > 0 ? Math.round(totalLikes / videos.length) : 0;

    // 채널 운영 일수
    const daysSinceCreation = Math.max(
      1,
      Math.floor((Date.now() - new Date(channel.publishedAt).getTime()) / (1000 * 60 * 60 * 24))
    );

    // 참여율 계산
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
        avgLikes,
        videoCount: videos.length,
        daysSinceCreation,
      },
    });
  } catch (error) {
    console.error('채널 분석 API 오류:', error);
    const message = error instanceof Error ? error.message : '채널 분석 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
