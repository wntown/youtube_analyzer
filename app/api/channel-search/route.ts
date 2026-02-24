import { NextRequest, NextResponse } from 'next/server';
import { searchChannels } from '@/lib/youtube';

// GET /api/channel-search?q=키워드&order=relevance&limit=20
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const query = params.get('q');
    const apiKey = request.headers.get('x-youtube-api-key') || undefined;

    if (!query) {
      return NextResponse.json({ error: '검색어를 입력해주세요.' }, { status: 400 });
    }

    const result = await searchChannels({
      query,
      order: (params.get('order') as 'relevance' | 'viewCount' | 'date') || 'relevance',
      maxResults: parseInt(params.get('limit') || '20'),
      pageToken: params.get('pageToken') || undefined,
    }, apiKey);

    return NextResponse.json(result);
  } catch (error) {
    console.error('채널 검색 API 오류:', error);
    const message = error instanceof Error ? error.message : '검색 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
