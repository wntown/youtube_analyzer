import { NextRequest, NextResponse } from 'next/server';
import { searchVideosWithChannels } from '@/lib/youtube';

// GET /api/search?q=키워드&order=viewCount&duration=medium&after=2024-01-01
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const query = params.get('q');
    const apiKey = request.headers.get('x-youtube-api-key') || undefined;

    if (!query) {
      return NextResponse.json({ error: '검색어를 입력해주세요.' }, { status: 400 });
    }

    // 채널 정보가 포함된 검색 결과 반환
    const result = await searchVideosWithChannels({
      query,
      order: (params.get('order') as 'relevance' | 'viewCount' | 'date' | 'rating') || 'relevance',
      publishedAfter: params.get('after') || undefined,
      publishedBefore: params.get('before') || undefined,
      videoDuration: (params.get('duration') as 'any' | 'short' | 'medium' | 'long') || 'any',
      maxResults: parseInt(params.get('limit') || '20'),
      pageToken: params.get('pageToken') || undefined,
    }, apiKey);

    return NextResponse.json(result);
  } catch (error) {
    console.error('검색 API 오류:', error);
    const message = error instanceof Error ? error.message : '검색 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
