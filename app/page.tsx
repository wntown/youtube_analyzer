'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Search, Flame } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { SearchFilters } from '@/components/search/search-filters';
import { VideoCard } from '@/components/search/video-card';
import { VideoTable, type SortCriterion } from '@/components/search/video-table';
import { ActionToolbar, type ViewMode } from '@/components/search/action-toolbar';
import { KeywordBanner } from '@/components/search/keyword-banner';
import { filterByVideoType, type VideoType, type VideoWithChannel } from '@/lib/youtube';
import { addCollectedVideos } from '@/lib/collection';
import { isHotVideo } from '@/lib/metrics';
import { getApiKey } from '@/lib/api-key';

// sessionStorage 키
const SESSION_KEY = 'cl_search_state';

// 저장할 검색 상태 타입
interface SearchState {
  query: string;
  videos: VideoWithChannel[];
  totalResults: number;
  nextPageToken: string | null;
  hasSearched: boolean;
  order: string;
  duration: string;
  dateRange: string;
  viewMode: ViewMode;
  hotVideoMode: boolean;
  videoType: VideoType;
  sortCriteria: SortCriterion[];
}

// sessionStorage에서 상태 복원
function loadSearchState(): SearchState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// sessionStorage에 상태 저장
function saveSearchState(state: SearchState): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch { /* 용량 초과 등 무시 */ }
}

// 핫비디오 키워드 (인기 검색어)
const hotKeywords = ['먹방', 'ASMR', '여행 브이로그', '게임 리뷰', '코딩', '운동 루틴', '주식 투자', 'AI 기술'];

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState<VideoWithChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [order, setOrder] = useState<string>('relevance');
  const [duration, setDuration] = useState<string>('any');
  const [dateRange, setDateRange] = useState<string>('all');
  const [hotVideoMode, setHotVideoMode] = useState(false);
  const [videoType, setVideoType] = useState<VideoType>('all');
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([]);

  // 무한 스크롤 감지용 ref
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 초기 마운트 시 sessionStorage에서 복원
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;

    const saved = loadSearchState();
    if (saved) {
      setQuery(saved.query);
      setVideos(saved.videos);
      setTotalResults(saved.totalResults);
      setNextPageToken(saved.nextPageToken);
      setHasSearched(saved.hasSearched);
      setOrder(saved.order);
      setDuration(saved.duration);
      setDateRange(saved.dateRange);
      setViewMode(saved.viewMode);
      if (saved.hotVideoMode !== undefined) setHotVideoMode(saved.hotVideoMode);
      if (saved.videoType) setVideoType(saved.videoType);
      if (saved.sortCriteria) setSortCriteria(saved.sortCriteria);
    }
  }, []);

  // 상태가 변경될 때마다 sessionStorage에 저장
  useEffect(() => {
    if (!restored.current) return;
    saveSearchState({
      query, videos, totalResults, nextPageToken,
      hasSearched, order, duration, dateRange, viewMode, hotVideoMode, videoType, sortCriteria,
    });
  }, [query, videos, totalResults, nextPageToken, hasSearched, order, duration, dateRange, viewMode, hotVideoMode, videoType, sortCriteria]);

  // 검색 실행
  const handleSearch = useCallback(async (searchQuery?: string, pageToken?: string) => {
    const q = searchQuery ?? query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    if (!pageToken) {
      setHasSearched(true);
      setSelectedIds(new Set());
    }

    try {
      const isHot = hotVideoMode;
      const params = new URLSearchParams({
        q,
        order: isHot ? 'viewCount' : order,
        duration,
        limit: isHot ? '50' : '20',
      });

      // 날짜 필터
      if (dateRange !== 'all') {
        const now = new Date();
        const after = new Date();
        if (dateRange === '1h') after.setHours(now.getHours() - 1);
        else if (dateRange === '1d') after.setDate(now.getDate() - 1);
        else if (dateRange === '7d') after.setDate(now.getDate() - 7);
        else if (dateRange === '30d') after.setDate(now.getDate() - 30);
        else if (dateRange === '1y') after.setFullYear(now.getFullYear() - 1);
        params.set('after', after.toISOString());
      }

      if (pageToken) params.set('pageToken', pageToken);

      const res = await fetch(`/api/search?${params.toString()}`, {
        headers: { 'x-youtube-api-key': getApiKey() },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      let resultVideos: VideoWithChannel[] = data.videos;

      // 핫비디오 필터링
      if (isHot) {
        resultVideos = resultVideos.filter((v: VideoWithChannel) =>
          isHotVideo({
            viewCount: v.viewCount,
            likeCount: v.likeCount,
            commentCount: v.commentCount,
            subscriberCount: v.subscriberCount,
            publishedAt: v.publishedAt,
            channelVideoCount: v.channelVideoCount,
            title: v.title,
            query: q,
          })
        );
      }

      if (pageToken) {
        setVideos((prev) => {
          const existingIds = new Set(prev.map((v) => v.id));
          const newVideos = resultVideos.filter((v: VideoWithChannel) => !existingIds.has(v.id));
          return [...prev, ...newVideos];
        });
      } else {
        setVideos(resultVideos);
      }
      setNextPageToken(isHot ? null : data.nextPageToken);
      setTotalResults(isHot ? resultVideos.length : data.totalResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [query, order, duration, dateRange, hotVideoMode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleHotKeyword = (keyword: string) => {
    setQuery(keyword);
    handleSearch(keyword);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === videos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(videos.map((v) => v.id)));
    }
  };

  const handleCollect = () => {
    const selected = videos.filter((v) => selectedIds.has(v.id));
    if (selected.length === 0) return;

    const count = addCollectedVideos(selected);
    if (count > 0) {
      alert(`${count}개 영상이 수집되었습니다.`);
    } else {
      alert('이미 수집된 영상입니다.');
    }
    setSelectedIds(new Set());
  };

  const handleRemoveFromResults = () => {
    setVideos((prev) => prev.filter((v) => !selectedIds.has(v.id)));
    setSelectedIds(new Set());
  };

  // 무한 스크롤: 화면 하단 감지 시 자동으로 다음 페이지 로드
  const nextPageTokenRef = useRef(nextPageToken);
  nextPageTokenRef.current = nextPageToken;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 감지 영역이 화면에 보이고, 다음 페이지가 있고, 로딩 중이 아닐 때
        if (entries[0].isIntersecting && nextPageTokenRef.current && !loadingRef.current) {
          handleSearch(undefined, nextPageTokenRef.current);
        }
      },
      { rootMargin: '200px' } // 하단 200px 전에 미리 로드 시작
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleSearch]);

  // 롱폼/숏츠 필터: API 결과에서 즉시 필터링 (정렬보다 우선)
  const displayVideos = useMemo(
    () => filterByVideoType(videos, videoType),
    [videos, videoType],
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />

      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {/* 검색바 */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="YouTube 키워드를 입력하세요..."
              className="w-full pl-12 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cl-500 focus:ring-1 focus:ring-cl-500 transition-colors"
            />
          </div>
          {/* 핫비디오 토글 버튼 */}
          <button
            onClick={() => setHotVideoMode((prev) => !prev)}
            className={`flex items-center gap-1.5 px-4 py-3 rounded-lg text-sm font-medium transition-colors border whitespace-nowrap ${
              hotVideoMode
                ? 'bg-orange-50 border-orange-700 text-orange-600'
                : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-orange-600 hover:border-orange-700'
            }`}
            title="터지고 있는 영상 + 진입 가능한 영상만 필터링"
          >
            <Flame className="w-4 h-4" />
            핫비디오
          </button>
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="cl-search-btn"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </div>

        {/* 핫비디오 태그 */}
        {!hasSearched && (
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="text-xs text-gray-400 py-1">핫비디오</span>
            {hotKeywords.map((keyword) => (
              <button
                key={keyword}
                onClick={() => handleHotKeyword(keyword)}
                className="hot-tag"
              >
                {keyword}
              </button>
            ))}
          </div>
        )}

        {/* 필터 */}
        <SearchFilters
          order={order}
          setOrder={setOrder}
          duration={duration}
          setDuration={setDuration}
          dateRange={dateRange}
          setDateRange={setDateRange}
          videoType={videoType}
          setVideoType={setVideoType}
          onFilterChange={() => { if (hasSearched) handleSearch(); }}
        />

        {/* 에러 */}
        {error && (
          <div className="mb-6 p-4 bg-red-950 border border-red-800 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* 검색 결과 (로딩 중에도 테이블 유지 → 정렬 상태 보존) */}
        {hasSearched && displayVideos.length > 0 && (
          <>
            {/* 핫비디오 모드 안내 */}
            {hotVideoMode && (
              <div className="mb-4 px-4 py-2.5 bg-orange-50 border border-orange-800 rounded-lg flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span className="text-sm text-orange-300">
                  핫비디오 모드: 현재 터지고 있으면서 진입 가능한 영상만 표시합니다
                </span>
              </div>
            )}

            <ActionToolbar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              selectedCount={selectedIds.size}
              totalCount={displayVideos.length}
              onCollect={handleCollect}
              onRemove={handleRemoveFromResults}
            />

            <KeywordBanner query={query} onKeywordClick={handleHotKeyword} />

            {/* 테이블 뷰 */}
            {viewMode === 'table' ? (
              <div className="bg-gray-950 border border-[var(--border)] rounded-lg overflow-hidden shadow-sm">
                <VideoTable
                  videos={displayVideos}
                  query={query}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onToggleSelectAll={handleToggleSelectAll}
                  sortCriteria={sortCriteria}
                  onSortChange={setSortCriteria}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {displayVideos.map((video, idx) => (
                  <VideoCard key={`${video.id}-${idx}`} video={video} highlight={query} />
                ))}
              </div>
            )}
          </>
        )}

        {/* 무한 스크롤 감지 영역 + 로딩 표시 */}
        <div ref={sentinelRef} className="h-1" />
        {loading && displayVideos.length > 0 && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-cl-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* 결과 없음 */}
        {hasSearched && !loading && displayVideos.length === 0 && !error && (
          <div className="text-center py-20 text-gray-400">
            {hotVideoMode ? (
              <>
                <Flame className="w-16 h-16 mx-auto mb-4 text-orange-800" />
                <p className="text-lg text-gray-400">핫비디오를 찾지 못했습니다.</p>
                <p className="text-sm mt-2">이 키워드에서는 터지면서 진입 가능한 영상이 없습니다.</p>
                <p className="text-xs mt-1 text-gray-400">핫비디오 필터를 끄고 일반 검색을 해보세요.</p>
              </>
            ) : (
              <>
                <p className="text-lg text-gray-400">검색 결과가 없습니다.</p>
                <p className="text-sm mt-2">다른 키워드를 입력해보세요.</p>
              </>
            )}
          </div>
        )}

        {/* 초기 상태 */}
        {!hasSearched && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-lg text-gray-400">YouTube 키워드를 검색하세요</p>
            <p className="text-sm mt-2">조회수, 구독자, 기여도, 성과도를 한눈에 비교할 수 있습니다.</p>
          </div>
        )}

        {/* 로딩 스켈레톤 */}
        {loading && displayVideos.length === 0 && (
          <div className="bg-gray-950 border border-[var(--border)] rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 space-y-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-800 animate-pulse">
                  <div className="w-4 h-4 bg-gray-700 rounded" />
                  <div className="w-[120px] h-[68px] bg-gray-700 rounded flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-700 rounded w-1/3" />
                  </div>
                  <div className="h-4 bg-gray-700 rounded w-16" />
                  <div className="h-4 bg-gray-700 rounded w-16" />
                  <div className="h-5 bg-gray-700 rounded w-16" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
