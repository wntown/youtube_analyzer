'use client';

import { useCallback } from 'react';
import Image from 'next/image';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { formatCount, isShorts, type VideoWithChannel } from '@/lib/youtube';
import { calcContribution, calcPerformance, calcExposure } from '@/lib/metrics';
import { ScoreBadge } from './score-badge';

// 정렬 가능한 컬럼 키
export type SortKey = 'viewCount' | 'subscriberCount' | 'contribution' | 'performance' | 'channelVideoCount' | 'publishedAt' | 'exposure';
export type SortDirection = 'asc' | 'desc';

// 다중 정렬 조건 하나
export interface SortCriterion {
  key: SortKey;
  dir: SortDirection;
}

interface VideoTableProps {
  videos: VideoWithChannel[];
  query: string;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  sortCriteria: SortCriterion[];
  onSortChange: (criteria: SortCriterion[]) => void;
}

// 테이블 헤더 컬럼 정의
const columns: Array<{ key: SortKey; label: string; align: 'left' | 'right' | 'center' }> = [
  { key: 'viewCount', label: '조회수', align: 'right' },
  { key: 'subscriberCount', label: '구독자', align: 'right' },
  { key: 'contribution', label: '기여도', align: 'center' },
  { key: 'performance', label: '성과도', align: 'center' },
  { key: 'channelVideoCount', label: '총영상수', align: 'right' },
  { key: 'publishedAt', label: '게시일', align: 'right' },
  { key: 'exposure', label: '노출확률', align: 'center' },
];

// 영상의 정렬 값을 가져오는 헬퍼 함수
function getSortValue(video: VideoWithChannel, key: SortKey, query: string): number {
  switch (key) {
    case 'viewCount':
      return video.viewCount;
    case 'subscriberCount':
      return video.subscriberCount;
    case 'contribution':
      return calcContribution(video.viewCount, video.subscriberCount).value;
    case 'performance':
      return calcPerformance(video.viewCount, video.likeCount, video.commentCount, video.subscriberCount).value;
    case 'channelVideoCount':
      return video.channelVideoCount;
    case 'publishedAt':
      return new Date(video.publishedAt).getTime();
    case 'exposure':
      return calcExposure({
        title: video.title, query,
        viewCount: video.viewCount, likeCount: video.likeCount,
        commentCount: video.commentCount, subscriberCount: video.subscriberCount,
        publishedAt: video.publishedAt, channelVideoCount: video.channelVideoCount,
      }).percent;
    default:
      return 0;
  }
}

// CreatorLens 스타일 테이블 뷰
export function VideoTable({ videos, query, selectedIds, onToggleSelect, onToggleSelectAll, sortCriteria, onSortChange }: VideoTableProps) {
  // 정렬 클릭 핸들러 (3단계 토글)
  // 1) 없으면 → desc(↑ 높은순) 추가
  // 2) desc → asc(↓ 낮은순) 전환
  // 3) asc → 해당 조건 제거
  const handleSort = useCallback((key: SortKey) => {
    const existingIdx = sortCriteria.findIndex((c) => c.key === key);
    if (existingIdx < 0) {
      onSortChange([...sortCriteria, { key, dir: 'desc' }]);
      return;
    }
    if (sortCriteria[existingIdx].dir === 'desc') {
      const updated = [...sortCriteria];
      updated[existingIdx] = { ...updated[existingIdx], dir: 'asc' };
      onSortChange(updated);
      return;
    }
    onSortChange(sortCriteria.filter((c) => c.key !== key));
  }, [sortCriteria, onSortChange]);

  // 특정 정렬 조건 제거
  const removeCriterion = useCallback((key: SortKey) => {
    onSortChange(sortCriteria.filter((c) => c.key !== key));
  }, [sortCriteria, onSortChange]);

  // 전체 정렬 초기화
  const resetSort = useCallback(() => {
    onSortChange([]);
  }, [onSortChange]);

  // 정렬 조건에서 해당 컬럼의 인덱스와 방향 조회
  const getSortInfo = (key: SortKey) => {
    const idx = sortCriteria.findIndex((c) => c.key === key);
    if (idx < 0) return null;
    return { order: idx + 1, dir: sortCriteria[idx].dir };
  };

  // 정렬된 영상 목록
  // - 단일 정렬: 해당 기준으로 직접 정렬
  // - 다중 정렬: 각 기준값을 0~1로 정규화한 뒤 합산하여 종합 점수로 정렬
  const sortedVideos = (() => {
    const list = [...videos];

    // 정렬 조건이 없으면 API 반환 순서(관련성) 그대로 표시
    if (sortCriteria.length === 0) return list;

    if (sortCriteria.length === 1) {
      // 단일 정렬
      const { key, dir } = sortCriteria[0];
      const mult = dir === 'asc' ? 1 : -1;
      return list.sort((a, b) => (getSortValue(a, key, query) - getSortValue(b, key, query)) * mult);
    }

    // 다중 정렬: 가중 평균 합산 방식
    // 1) 각 기준별 min/max 계산
    const ranges = sortCriteria.map(({ key }) => {
      const vals = list.map((v) => getSortValue(v, key, query));
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      return { min, range: max - min };
    });

    // 2) 각 영상의 종합 점수 계산
    const scores = new Map<string, number>();
    for (const video of list) {
      let total = 0;
      sortCriteria.forEach(({ key, dir }, i) => {
        const val = getSortValue(video, key, query);
        const norm = ranges[i].range > 0 ? (val - ranges[i].min) / ranges[i].range : 0;
        // desc: 높을수록 점수 높음 / asc: 낮을수록 점수 높음
        total += dir === 'desc' ? norm : 1 - norm;
      });
      scores.set(video.id, total);
    }

    // 3) 종합 점수 내림차순 정렬
    return list.sort((a, b) => {
      const diff = (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0);
      if (diff !== 0) return diff;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  })();

  const allSelected = videos.length > 0 && selectedIds.size === videos.length;

  // 정렬 조건의 한글 라벨
  const labelMap: Record<SortKey, string> = {
    viewCount: '조회수',
    subscriberCount: '구독자',
    contribution: '기여도',
    performance: '성과도',
    channelVideoCount: '총영상수',
    publishedAt: '게시일',
    exposure: '노출확률',
  };

  return (
    <div>
      {/* 정렬 조건 태그 표시 */}
      <div className="flex items-center gap-2 mb-3 px-1 overflow-x-auto whitespace-nowrap">
        <span className="text-xs text-gray-400 flex-shrink-0">정렬:</span>
        {sortCriteria.length === 0 ? (
          <span className="text-xs text-gray-500 flex-shrink-0">없음 (검색 관련성 순)</span>
        ) : (
          sortCriteria.map((c, idx) => (
            <span
              key={c.key}
              className="inline-flex items-center gap-1 px-2 py-1 bg-cl-50 border border-cl-200 rounded-full text-xs text-cl-700 font-medium flex-shrink-0"
            >
              <span className="w-4 h-4 bg-cl-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {idx + 1}
              </span>
              {labelMap[c.key]}{c.dir === 'desc' ? '↑' : '↓'}
              <button
                onClick={() => removeCriterion(c.key)}
                className="ml-0.5 text-cl-400 hover:text-cl-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
        {sortCriteria.length > 0 && (
          <button
            onClick={resetSort}
            className="text-xs text-gray-400 hover:text-gray-300 transition-colors flex-shrink-0"
          >
            초기화
          </button>
        )}
        <span className="text-[10px] text-gray-400 ml-auto flex-shrink-0">클릭: 추가(↑) → 전환(↓) → 제거</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          {/* 테이블 헤더 */}
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-[var(--border)] bg-gray-900">
              {/* 체크박스 */}
              <th className="w-12 py-3.5 pl-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 rounded border-gray-700 accent-cl-500 cursor-pointer"
                />
              </th>
              {/* 영상 정보 */}
              <th className="text-left py-3.5 pl-2 min-w-[320px] font-semibold">영상</th>
              {/* 정렬 가능 컬럼 */}
              {columns.map((col) => {
                const sortInfo = getSortInfo(col.key);
                const isActive = sortInfo !== null;

                return (
                  <th
                    key={col.key}
                    className={`py-3.5 px-4 cursor-pointer select-none hover:text-gray-200 transition-colors font-semibold whitespace-nowrap min-w-[90px] ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } ${isActive ? 'text-gray-100' : ''}`}
                    onClick={() => handleSort(col.key)}
                    title="클릭: 추가(↑) → 전환(↓) → 제거"
                  >
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                      {col.label}
                      {isActive ? (
                        <span className="inline-flex items-center gap-0.5">
                          {/* 정렬 순서 번호 표시 */}
                          <span className="w-4 h-4 bg-cl-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold leading-none">
                            {sortInfo.order}
                          </span>
                          {sortInfo.dir === 'desc'
                            ? <ChevronUp className="w-3.5 h-3.5 text-cl-500" />
                            : <ChevronDown className="w-3.5 h-3.5 text-cl-500" />
                          }
                        </span>
                      ) : (
                        <span className="inline-flex flex-col -space-y-1">
                          <ChevronUp className="w-3 h-3 text-gray-400" />
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* 테이블 바디 */}
          <tbody>
            {sortedVideos.map((video, idx) => {
              const contribution = calcContribution(video.viewCount, video.subscriberCount);
              const performance = calcPerformance(
                video.viewCount, video.likeCount, video.commentCount, video.subscriberCount
              );
              const exposure = calcExposure({
                title: video.title, query,
                viewCount: video.viewCount, likeCount: video.likeCount,
                commentCount: video.commentCount, subscriberCount: video.subscriberCount,
                publishedAt: video.publishedAt, channelVideoCount: video.channelVideoCount,
              });
              const isSelected = selectedIds.has(video.id);
              const rowBg = isSelected
                ? 'bg-cl-50'
                : idx % 2 === 1
                  ? 'bg-gray-800/30'
                  : '';

              return (
                <tr
                  key={`${video.id}-${idx}`}
                  className={`border-b border-[var(--border)] hover:bg-gray-800 transition-colors ${rowBg}`}
                >
                  {/* 체크박스 */}
                  <td className="py-3.5 pl-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(video.id)}
                      className="w-4 h-4 rounded border-gray-700 accent-cl-500 cursor-pointer"
                    />
                  </td>

                  {/* 영상 정보: 썸네일 + 제목 + 채널 */}
                  <td className="py-3.5 pl-2 pr-4">
                    <div className="flex items-center gap-3">
                      <a
                        href={`https://www.youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                      >
                        <Image
                          src={video.thumbnailUrl}
                          alt={video.title}
                          width={130}
                          height={73}
                          className="rounded object-cover"
                        />
                      </a>
                      <div className="min-w-0">
                        <a
                          href={`https://www.youtube.com/watch?v=${video.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[13px] leading-snug text-gray-100 hover:text-cl-500 line-clamp-2 transition-colors font-medium"
                        >
                          {video.title}
                        </a>
                        <div className="flex items-center gap-1.5 mt-1">
                          <a
                            href={`/channel/${video.channelId}`}
                            className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
                          >
                            {video.channelTitle}
                          </a>
                          {isShorts(video.durationSeconds) && (
                            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-semibold rounded">
                              Shorts
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 조회수 */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="text-[13px] text-gray-100 font-semibold tabular-nums">
                      {formatCount(video.viewCount)}
                    </span>
                  </td>

                  {/* 구독자 */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="text-[13px] text-gray-400 tabular-nums">
                      {formatCount(video.subscriberCount)}
                    </span>
                  </td>

                  {/* 기여도 */}
                  <td className="py-3.5 px-4 text-center">
                    <ScoreBadge label={contribution.label} grade={contribution.grade} />
                  </td>

                  {/* 성과도 */}
                  <td className="py-3.5 px-4 text-center">
                    <ScoreBadge label={performance.label} grade={performance.grade} />
                  </td>

                  {/* 총영상수 */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="text-[13px] text-gray-400 tabular-nums">
                      {video.channelVideoCount.toLocaleString()}
                    </span>
                  </td>

                  {/* 게시일 */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="text-xs text-gray-400">
                      {new Date(video.publishedAt).toLocaleDateString('ko-KR')}
                    </span>
                  </td>

                  {/* 노출확률 */}
                  <td className="py-3.5 px-4 text-center">
                    <ExposureBar percent={exposure.percent} label={exposure.label} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}

// 노출확률 프로그레스 바
function ExposureBar({ percent, label }: { percent: number; label: string }) {
  const barColor =
    percent >= 75 ? 'bg-emerald-500' :
    percent >= 50 ? 'bg-sky-500' :
    percent >= 25 ? 'bg-amber-500' :
    'bg-red-400';

  return (
    <div className="flex flex-col items-center gap-1 min-w-[70px]">
      <span className="text-[13px] font-semibold text-gray-100 tabular-nums">{percent}%</span>
      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-[10px] text-gray-400 font-medium">{label}</span>
    </div>
  );
}
