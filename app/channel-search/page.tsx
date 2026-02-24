'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Flame, Trash2, SlidersHorizontal } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { ChannelSearchTable, type SortCriterion } from '@/components/channel/channel-search-table';
import type { ChannelSearchResult } from '@/lib/youtube';
import { getApiKey } from '@/lib/api-key';

// sessionStorage 키
const SESSION_KEY = 'cl_channel_search_state';

// 저장할 상태 타입
interface ChannelSearchState {
  query: string;
  channels: ChannelSearchResult[];
  totalResults: number;
  nextPageToken: string | null;
  hasSearched: boolean;
  order: string;
  sortCriteria: SortCriterion[];
}

// sessionStorage에서 상태 복원
function loadState(): ChannelSearchState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// sessionStorage에 상태 저장
function saveState(state: ChannelSearchState): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch { /* 용량 초과 등 무시 */ }
}

// 핫 채널 키워드
const hotChannelKeywords = ['먹방', '코딩', '브이로그', '게임', '음악', '요리', '운동', '투자'];

export default function ChannelSearchPage() {
  const [query, setQuery] = useState('');
  const [channels, setChannels] = useState<ChannelSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [order, setOrder] = useState<string>('relevance');
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([
    { key: 'subscriberCount', dir: 'desc' },
  ]);

  // 무한 스크롤 감지용 ref
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 초기 마운트 시 sessionStorage에서 복원
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;

    const saved = loadState();
    if (saved) {
      setQuery(saved.query);
      setChannels(saved.channels);
      setTotalResults(saved.totalResults);
      setNextPageToken(saved.nextPageToken);
      setHasSearched(saved.hasSearched);
      setOrder(saved.order);
      if (saved.sortCriteria) setSortCriteria(saved.sortCriteria);
    }
  }, []);

  // 상태가 변경될 때마다 sessionStorage에 저장
  useEffect(() => {
    if (!restored.current) return;
    saveState({ query, channels, totalResults, nextPageToken, hasSearched, order, sortCriteria });
  }, [query, channels, totalResults, nextPageToken, hasSearched, order, sortCriteria]);

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
      const params = new URLSearchParams({
        q,
        order,
        limit: '20',
      });
      if (pageToken) params.set('pageToken', pageToken);

      const res = await fetch(`/api/channel-search?${params.toString()}`, {
        headers: { 'x-youtube-api-key': getApiKey() },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      if (pageToken) {
        setChannels((prev) => [...prev, ...data.channels]);
      } else {
        setChannels(data.channels);
      }
      setNextPageToken(data.nextPageToken);
      setTotalResults(data.totalResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [query, order]);

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
    if (selectedIds.size === channels.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(channels.map((c) => c.id)));
    }
  };

  // 선택한 채널 결과에서 제거
  const handleRemoveChannels = () => {
    setChannels((prev) => prev.filter((c) => !selectedIds.has(c.id)));
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
        if (entries[0].isIntersecting && nextPageTokenRef.current && !loadingRef.current) {
          handleSearch(undefined, nextPageTokenRef.current);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleSearch]);

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
              placeholder="채널 관련 키워드 입력"
              className="w-full pl-12 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cl-500 focus:ring-1 focus:ring-cl-500 transition-colors"
            />
          </div>

          {/* 정렬 필터 */}
          <div className="flex items-center gap-1 px-3 py-3 bg-gray-950 border border-gray-800 rounded-lg">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="text-sm text-gray-400 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="relevance">관련성</option>
              <option value="viewCount">조회수순</option>
              <option value="date">최신순</option>
            </select>
          </div>

          {/* 핫 채널 토글 */}
          <button
            onClick={() => handleHotKeyword('인기 유튜버')}
            className="flex items-center gap-1.5 px-4 py-3 rounded-lg text-sm font-medium transition-colors border whitespace-nowrap bg-gray-950 border-gray-800 text-gray-400 hover:text-orange-600 hover:border-orange-700"
          >
            <Flame className="w-4 h-4" />
            핫 채널
          </button>

          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="cl-search-btn"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </div>

        {/* 핫 채널 키워드 태그 */}
        {!hasSearched && (
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="text-xs text-gray-400 py-1">추천 채널</span>
            {hotChannelKeywords.map((keyword) => (
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

        {/* 에러 */}
        {error && (
          <div className="mb-6 p-4 bg-red-950 border border-red-800 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* 검색 결과 (로딩 중에도 테이블 유지 → 정렬 상태 보존) */}
        {hasSearched && channels.length > 0 && (
          <>
            {/* 액션 바 */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">
                {totalResults.toLocaleString()}개 채널
                {selectedIds.size > 0 && (
                  <span className="text-cl-500 ml-2 font-medium">{selectedIds.size}개 선택</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRemoveChannels}
                  disabled={selectedIds.size === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-gray-800 text-gray-400 hover:text-red-500 hover:border-red-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  채널 제거
                </button>
                {selectedIds.size > 0 && (
                  <span className="text-xs text-gray-400 tabular-nums">{channels.length}</span>
                )}
              </div>
            </div>

            {/* 채널 테이블 */}
            <div className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden shadow-sm">
              <ChannelSearchTable
                channels={channels}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
                sortCriteria={sortCriteria}
                onSortChange={setSortCriteria}
              />
            </div>

            {/* 키워드 배너 (테이블 중간에 삽입하는 대신 하단에) */}
            {channels.length >= 5 && (
              <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-6 flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-gray-100">
                    아이디어 확장 키워드를 확인해 보세요
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    고객님의 검색 패턴을 기반한 아이디어 확장 키워드입니다
                  </p>
                </div>
                <button
                  onClick={() => {/* 추천 키워드 기능 */}}
                  className="px-6 py-3 bg-cl-500 text-white rounded-full text-sm font-medium hover:bg-cl-600 transition-colors whitespace-nowrap"
                >
                  추천 키워드 확인
                </button>
              </div>
            )}
          </>
        )}

        {/* 무한 스크롤 감지 영역 + 로딩 표시 */}
        <div ref={sentinelRef} className="h-1" />
        {loading && channels.length > 0 && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-cl-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* 결과 없음 */}
        {hasSearched && !loading && channels.length === 0 && !error && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg text-gray-400">검색 결과가 없습니다.</p>
            <p className="text-sm mt-2">다른 키워드를 입력해보세요.</p>
          </div>
        )}

        {/* 초기 상태 */}
        {!hasSearched && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">📺</div>
            <p className="text-lg text-gray-400">YouTube 채널을 검색하세요</p>
            <p className="text-sm mt-2">구독자, 성장속도, 영상성과 등을 한눈에 비교할 수 있습니다.</p>
          </div>
        )}

        {/* 로딩 스켈레톤 */}
        {loading && channels.length === 0 && (
          <div className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 space-y-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-800 animate-pulse">
                  <div className="w-4 h-4 bg-gray-700 rounded" />
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-1/3" />
                  </div>
                  <div className="h-4 bg-gray-700 rounded w-16" />
                  <div className="h-4 bg-gray-700 rounded w-16" />
                  <div className="h-4 bg-gray-700 rounded w-12" />
                  <div className="h-4 bg-gray-700 rounded w-12" />
                  <div className="h-4 bg-gray-700 rounded w-12" />
                  <div className="h-4 bg-gray-700 rounded w-16" />
                  <div className="h-4 bg-gray-700 rounded w-12" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
