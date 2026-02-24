// YouTube Data API v3 클라이언트

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// === 타입 정의 ===

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;         // ISO 8601 (PT4M13S)
  durationSeconds: number;  // 초 단위 변환
}

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  bannerUrl: string | null;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  publishedAt: string;
  country: string | null;
}

export interface SearchFilters {
  query: string;
  order: 'relevance' | 'viewCount' | 'date' | 'rating';
  publishedAfter?: string;   // ISO 날짜
  publishedBefore?: string;
  videoDuration?: 'any' | 'short' | 'medium' | 'long';
  maxResults?: number;
  pageToken?: string;
}

export interface SearchResponse {
  videos: YouTubeVideo[];
  nextPageToken: string | null;
  totalResults: number;
}

// 채널 정보가 포함된 영상 타입 (테이블 뷰에서 사용)
export interface VideoWithChannel extends YouTubeVideo {
  subscriberCount: number;
  channelVideoCount: number;
  channelThumbnailUrl: string;
}

export interface SearchWithChannelResponse {
  videos: VideoWithChannel[];
  nextPageToken: string | null;
  totalResults: number;
}

// === 숏츠/롱폼 분류 ===

// 영상 유형 타입 (전체 / 롱폼 / 숏츠)
export type VideoType = 'all' | 'long' | 'shorts';

// 숏츠 판별: 60초 이하면 숏츠
export function isShorts(durationSeconds: number): boolean {
  return durationSeconds > 0 && durationSeconds <= 60;
}

// 영상 유형별 필터링
export function filterByVideoType<T extends { durationSeconds: number }>(
  videos: T[],
  type: VideoType,
): T[] {
  if (type === 'all') return videos;
  if (type === 'shorts') return videos.filter((v) => isShorts(v.durationSeconds));
  return videos.filter((v) => !isShorts(v.durationSeconds)); // 'long'
}

// === API 호출 함수들 ===

// 공통 fetch 래퍼
async function ytFetch<T>(endpoint: string, params: Record<string, string>, apiKey?: string): Promise<T> {
  const key = apiKey || process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('YOUTUBE_API_KEY가 설정되지 않았습니다. 설정에서 API Key를 입력해주세요.');

  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set('key', key);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { next: { revalidate: 300 } }); // 5분 캐시
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`YouTube API 오류: ${error.error?.message || res.statusText}`);
  }
  return res.json();
}

// 영상 ID로 해당 영상의 채널 ID를 가져오기
export async function getVideoChannelId(videoId: string, apiKey?: string): Promise<string | null> {
  try {
    const data = await ytFetch<{
      items: Array<{ snippet: { channelId: string } }>;
    }>('videos', {
      part: 'snippet',
      id: videoId,
    }, apiKey);
    return data.items[0]?.snippet.channelId ?? null;
  } catch {
    return null;
  }
}

// ISO 8601 duration → 초 변환 (PT4M13S → 253)
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  return hours * 3600 + minutes * 60 + seconds;
}

// 초 → 사람이 읽을 수 있는 형태 (4:13, 1:02:30)
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// 숫자 포맷 (1234567 → 123만)
export function formatCount(count: number): string {
  if (count >= 100_000_000) return `${(count / 100_000_000).toFixed(1)}억`;
  if (count >= 10_000) return `${(count / 10_000).toFixed(1)}만`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}천`;
  return count.toLocaleString();
}

// 1. 영상 검색
export async function searchVideos(filters: SearchFilters, apiKey?: string): Promise<SearchResponse> {
  // Step 1: search.list로 videoId 목록 가져오기
  const searchParams: Record<string, string> = {
    part: 'snippet',
    type: 'video',
    q: filters.query,
    order: filters.order,
    maxResults: (filters.maxResults || 20).toString(),
    regionCode: 'KR',
  };

  if (filters.publishedAfter) searchParams.publishedAfter = filters.publishedAfter;
  if (filters.publishedBefore) searchParams.publishedBefore = filters.publishedBefore;
  if (filters.videoDuration && filters.videoDuration !== 'any') {
    searchParams.videoDuration = filters.videoDuration;
  }
  if (filters.pageToken) searchParams.pageToken = filters.pageToken;

  const searchData = await ytFetch<{
    items: Array<{
      id: { videoId: string };
      snippet: {
        title: string;
        description: string;
        channelId: string;
        channelTitle: string;
        publishedAt: string;
        thumbnails: { high: { url: string } };
      };
    }>;
    nextPageToken?: string;
    pageInfo: { totalResults: number };
  }>('search', searchParams, apiKey);

  if (!searchData.items || searchData.items.length === 0) {
    return { videos: [], nextPageToken: null, totalResults: 0 };
  }

  // Step 2: videos.list로 상세 통계 가져오기 (조회수, 좋아요, 댓글, 길이)
  const videoIds = searchData.items.map((item) => item.id.videoId).join(',');
  const statsData = await ytFetch<{
    items: Array<{
      id: string;
      statistics: {
        viewCount: string;
        likeCount: string;
        commentCount: string;
      };
      contentDetails: { duration: string };
    }>;
  }>('videos', {
    part: 'statistics,contentDetails',
    id: videoIds,
  }, apiKey);

  // 통계 맵 생성
  const statsMap = new Map(
    statsData.items.map((item) => [
      item.id,
      {
        viewCount: parseInt(item.statistics.viewCount || '0'),
        likeCount: parseInt(item.statistics.likeCount || '0'),
        commentCount: parseInt(item.statistics.commentCount || '0'),
        duration: item.contentDetails.duration,
        durationSeconds: parseDuration(item.contentDetails.duration),
      },
    ])
  );

  // 결합
  const videos: YouTubeVideo[] = searchData.items.map((item) => {
    const stats = statsMap.get(item.id.videoId);
    return {
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnailUrl: item.snippet.thumbnails.high.url,
      viewCount: stats?.viewCount || 0,
      likeCount: stats?.likeCount || 0,
      commentCount: stats?.commentCount || 0,
      duration: stats?.duration || 'PT0S',
      durationSeconds: stats?.durationSeconds || 0,
    };
  });

  return {
    videos,
    nextPageToken: searchData.nextPageToken || null,
    totalResults: searchData.pageInfo.totalResults,
  };
}

// 2. 채널 정보 가져오기
export async function getChannel(channelId: string, apiKey?: string): Promise<YouTubeChannel> {
  const data = await ytFetch<{
    items: Array<{
      id: string;
      snippet: {
        title: string;
        description: string;
        thumbnails: { high: { url: string } };
        publishedAt: string;
        country?: string;
      };
      statistics: {
        subscriberCount: string;
        videoCount: string;
        viewCount: string;
      };
      brandingSettings?: {
        image?: { bannerExternalUrl?: string };
      };
    }>;
  }>('channels', {
    part: 'snippet,statistics,brandingSettings',
    id: channelId,
  }, apiKey);

  const ch = data.items[0];
  if (!ch) throw new Error('채널을 찾을 수 없습니다.');

  return {
    id: ch.id,
    title: ch.snippet.title,
    description: ch.snippet.description,
    thumbnailUrl: ch.snippet.thumbnails.high.url,
    bannerUrl: ch.brandingSettings?.image?.bannerExternalUrl || null,
    subscriberCount: parseInt(ch.statistics.subscriberCount || '0'),
    videoCount: parseInt(ch.statistics.videoCount || '0'),
    viewCount: parseInt(ch.statistics.viewCount || '0'),
    publishedAt: ch.snippet.publishedAt,
    country: ch.snippet.country || null,
  };
}

// 3. 여러 채널 정보 한번에 가져오기 (배치)
export async function getChannelsBatch(
  channelIds: string[],
  apiKey?: string
): Promise<Map<string, { subscriberCount: number; videoCount: number; thumbnailUrl: string }>> {
  if (channelIds.length === 0) return new Map();

  // 중복 제거
  const uniqueIds = [...new Set(channelIds)];

  const data = await ytFetch<{
    items: Array<{
      id: string;
      snippet: { thumbnails: { default: { url: string } } };
      statistics: { subscriberCount: string; videoCount: string };
    }>;
  }>('channels', {
    part: 'snippet,statistics',
    id: uniqueIds.join(','),
  }, apiKey);

  const map = new Map<string, { subscriberCount: number; videoCount: number; thumbnailUrl: string }>();
  for (const ch of data.items) {
    map.set(ch.id, {
      subscriberCount: parseInt(ch.statistics.subscriberCount || '0'),
      videoCount: parseInt(ch.statistics.videoCount || '0'),
      thumbnailUrl: ch.snippet.thumbnails.default.url,
    });
  }
  return map;
}

// 4. 영상 검색 + 채널 정보 포함 (테이블 뷰용)
export async function searchVideosWithChannels(
  filters: SearchFilters,
  apiKey?: string
): Promise<SearchWithChannelResponse> {
  // 먼저 영상 검색
  const result = await searchVideos(filters, apiKey);

  if (result.videos.length === 0) {
    return { videos: [], nextPageToken: null, totalResults: 0 };
  }

  // 영상의 채널 ID 목록 추출 후 배치 조회
  const channelIds = result.videos.map((v) => v.channelId);
  const channelMap = await getChannelsBatch(channelIds, apiKey);

  // 영상 + 채널 정보 결합
  const videosWithChannel: VideoWithChannel[] = result.videos.map((video) => {
    const channelInfo = channelMap.get(video.channelId);
    return {
      ...video,
      subscriberCount: channelInfo?.subscriberCount || 0,
      channelVideoCount: channelInfo?.videoCount || 0,
      channelThumbnailUrl: channelInfo?.thumbnailUrl || '',
    };
  });

  return {
    videos: videosWithChannel,
    nextPageToken: result.nextPageToken,
    totalResults: result.totalResults,
  };
}

// 5. 채널 키워드 검색 (search.list type=channel → channels.list 배치)
export interface ChannelSearchResult {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  publishedAt: string;
  country: string | null;
}

export interface ChannelSearchResponse {
  channels: ChannelSearchResult[];
  nextPageToken: string | null;
  totalResults: number;
}

export async function searchChannels(params: {
  query: string;
  maxResults?: number;
  pageToken?: string;
  order?: 'relevance' | 'viewCount' | 'date';
}, apiKey?: string): Promise<ChannelSearchResponse> {
  const { query, maxResults = 20, pageToken, order = 'relevance' } = params;

  // Step 1: search.list로 채널 ID 목록 가져오기
  const searchParams: Record<string, string> = {
    part: 'snippet',
    type: 'channel',
    q: query,
    order,
    maxResults: maxResults.toString(),
    regionCode: 'KR',
  };
  if (pageToken) searchParams.pageToken = pageToken;

  const searchData = await ytFetch<{
    items: Array<{
      id: { channelId: string };
      snippet: {
        title: string;
        description: string;
        thumbnails: { high: { url: string } };
        publishedAt: string;
      };
    }>;
    nextPageToken?: string;
    pageInfo: { totalResults: number };
  }>('search', searchParams, apiKey);

  if (!searchData.items || searchData.items.length === 0) {
    return { channels: [], nextPageToken: null, totalResults: 0 };
  }

  // Step 2: channels.list로 상세 통계 가져오기
  const channelIds = searchData.items.map((item) => item.id.channelId).join(',');
  const channelData = await ytFetch<{
    items: Array<{
      id: string;
      snippet: {
        title: string;
        description: string;
        thumbnails: { high: { url: string } };
        publishedAt: string;
        country?: string;
      };
      statistics: {
        subscriberCount: string;
        videoCount: string;
        viewCount: string;
      };
    }>;
  }>('channels', {
    part: 'snippet,statistics',
    id: channelIds,
  }, apiKey);

  // 채널 상세 정보 맵 생성
  const detailMap = new Map(
    channelData.items.map((ch) => [ch.id, ch])
  );

  // 검색 순서 유지하면서 상세 정보 결합
  const channels: ChannelSearchResult[] = searchData.items
    .map((item) => {
      const detail = detailMap.get(item.id.channelId);
      if (!detail) return null;
      return {
        id: detail.id,
        title: detail.snippet.title,
        description: detail.snippet.description,
        thumbnailUrl: detail.snippet.thumbnails.high.url,
        subscriberCount: parseInt(detail.statistics.subscriberCount || '0'),
        videoCount: parseInt(detail.statistics.videoCount || '0'),
        viewCount: parseInt(detail.statistics.viewCount || '0'),
        publishedAt: detail.snippet.publishedAt,
        country: detail.snippet.country || null,
      };
    })
    .filter((ch): ch is ChannelSearchResult => ch !== null);

  return {
    channels,
    nextPageToken: searchData.nextPageToken || null,
    totalResults: searchData.pageInfo.totalResults,
  };
}

// 6. 채널의 영상 목록 가져오기 (최근 영상 기준, search.list 사용 - 최대 50개)
export async function getChannelVideos(
  channelId: string,
  maxResults: number = 30,
  apiKey?: string
): Promise<YouTubeVideo[]> {
  const searchData = await ytFetch<{
    items: Array<{
      id: { videoId: string };
      snippet: {
        title: string;
        description: string;
        channelId: string;
        channelTitle: string;
        publishedAt: string;
        thumbnails: { high: { url: string } };
      };
    }>;
  }>('search', {
    part: 'snippet',
    channelId,
    type: 'video',
    order: 'date',
    maxResults: maxResults.toString(),
  }, apiKey);

  if (!searchData.items || searchData.items.length === 0) return [];

  const videoIds = searchData.items.map((item) => item.id.videoId).join(',');
  const statsData = await ytFetch<{
    items: Array<{
      id: string;
      statistics: { viewCount: string; likeCount: string; commentCount: string };
      contentDetails: { duration: string };
    }>;
  }>('videos', { part: 'statistics,contentDetails', id: videoIds }, apiKey);

  const statsMap = new Map(
    statsData.items.map((item) => [item.id, {
      viewCount: parseInt(item.statistics.viewCount || '0'),
      likeCount: parseInt(item.statistics.likeCount || '0'),
      commentCount: parseInt(item.statistics.commentCount || '0'),
      duration: item.contentDetails.duration,
      durationSeconds: parseDuration(item.contentDetails.duration),
    }])
  );

  return searchData.items.map((item) => {
    const stats = statsMap.get(item.id.videoId);
    return {
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnailUrl: item.snippet.thumbnails.high.url,
      viewCount: stats?.viewCount || 0,
      likeCount: stats?.likeCount || 0,
      commentCount: stats?.commentCount || 0,
      duration: stats?.duration || 'PT0S',
      durationSeconds: stats?.durationSeconds || 0,
    };
  });
}

// 7. 채널의 전체 영상 가져오기 (playlistItems.list 사용 - 페이지네이션으로 전부)
// 채널 ID의 "UC"를 "UU"로 바꾸면 업로드 재생목록 ID가 됨
// 최대 maxTotal개까지 가져옴 (기본 500개)
export async function getAllChannelVideos(
  channelId: string,
  maxTotal: number = 500,
  apiKey?: string
): Promise<YouTubeVideo[]> {
  // UC → UU로 변환하여 업로드 재생목록 ID 생성
  const uploadsPlaylistId = channelId.replace(/^UC/, 'UU');

  // 1단계: playlistItems.list로 영상 ID + 기본 정보를 페이지네이션으로 수집
  interface PlaylistItem {
    contentDetails: { videoId: string };
    snippet: {
      title: string;
      description: string;
      channelId: string;
      channelTitle: string;
      publishedAt: string;
      thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
    };
  }

  const allItems: PlaylistItem[] = [];
  let pageToken: string | undefined;

  while (allItems.length < maxTotal) {
    const params: Record<string, string> = {
      part: 'snippet,contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults: '50', // API 최대값
    };
    if (pageToken) params.pageToken = pageToken;

    const data = await ytFetch<{
      items: PlaylistItem[];
      nextPageToken?: string;
    }>('playlistItems', params, apiKey);

    if (!data.items || data.items.length === 0) break;

    allItems.push(...data.items);
    pageToken = data.nextPageToken;

    // 다음 페이지가 없으면 종료
    if (!pageToken) break;
  }

  // maxTotal 초과분 자르기
  const items = allItems.slice(0, maxTotal);
  if (items.length === 0) return [];

  // 2단계: videos.list로 상세 통계 가져오기 (50개씩 배치)
  const statsMap = new Map<string, {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    duration: string;
    durationSeconds: number;
  }>();

  for (let i = 0; i < items.length; i += 50) {
    const batch = items.slice(i, i + 50);
    const videoIds = batch.map((item) => item.contentDetails.videoId).join(',');

    const statsData = await ytFetch<{
      items: Array<{
        id: string;
        statistics: { viewCount: string; likeCount: string; commentCount: string };
        contentDetails: { duration: string };
      }>;
    }>('videos', { part: 'statistics,contentDetails', id: videoIds }, apiKey);

    for (const stat of statsData.items) {
      statsMap.set(stat.id, {
        viewCount: parseInt(stat.statistics.viewCount || '0'),
        likeCount: parseInt(stat.statistics.likeCount || '0'),
        commentCount: parseInt(stat.statistics.commentCount || '0'),
        duration: stat.contentDetails.duration,
        durationSeconds: parseDuration(stat.contentDetails.duration),
      });
    }
  }

  // 3단계: 결합
  return items
    .map((item) => {
      const videoId = item.contentDetails.videoId;
      const stats = statsMap.get(videoId);
      // 비공개/삭제 영상은 통계가 없으므로 건너뜀
      if (!stats) return null;
      const thumb = item.snippet.thumbnails.high?.url
        || item.snippet.thumbnails.medium?.url
        || item.snippet.thumbnails.default?.url
        || '';
      return {
        id: videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        thumbnailUrl: thumb,
        viewCount: stats.viewCount,
        likeCount: stats.likeCount,
        commentCount: stats.commentCount,
        duration: stats.duration,
        durationSeconds: stats.durationSeconds,
      };
    })
    .filter((v): v is YouTubeVideo => v !== null);
}
