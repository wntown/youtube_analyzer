'use client';

import { useCallback } from 'react';
import Image from 'next/image';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { formatCount, type ChannelSearchResult } from '@/lib/youtube';
import {
  calcViewToSubConversion,
  calcDailySubGrowth,
  calcVideoPerformance,
  calcGrowthSpeed,
} from '@/lib/channel-metrics';
import { ChannelGradeBadge } from './channel-grade-badge';

export type SortKey = 'subscriberCount' | 'viewToSub' | 'dailySub' | 'videoPerf' | 'growthSpeed' | 'viewCount' | 'videoCount' | 'publishedAt';
export type SortDirection = 'asc' | 'desc';

export interface SortCriterion {
  key: SortKey;
  dir: SortDirection;
}

interface ChannelSearchTableProps {
  channels: ChannelSearchResult[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  sortCriteria: SortCriterion[];
  onSortChange: (criteria: SortCriterion[]) => void;
}

const columns: Array<{ key: SortKey; label: string; align: 'left' | 'right' | 'center' }> = [
  { key: 'publishedAt', label: '채널 개설일', align: 'center' },
  { key: 'subscriberCount', label: '구독자', align: 'right' },
  { key: 'viewToSub', label: '조회수대비\n구독전환', align: 'center' },
  { key: 'dailySub', label: '일평균\n구독전환', align: 'center' },
  { key: 'videoPerf', label: '영상성과', align: 'center' },
  { key: 'growthSpeed', label: '성장속도', align: 'center' },
  { key: 'viewCount', label: '조회수', align: 'right' },
  { key: 'videoCount', label: '총 영상 수', align: 'right' },
];

const labelMap: Record<SortKey, string> = {
  subscriberCount: '구독자',
  viewToSub: '구독전환',
  dailySub: '일평균구독',
  videoPerf: '영상성과',
  growthSpeed: '성장속도',
  viewCount: '조회수',
  videoCount: '총영상수',
  publishedAt: '개설일',
};

export function ChannelSearchTable({
  channels,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  sortCriteria,
  onSortChange,
}: ChannelSearchTableProps) {
  // 기본값: 빈 배열이 되면 구독자 내림차순으로 복원
  const defaultCriteria: SortCriterion[] = [{ key: 'subscriberCount', dir: 'desc' }];

  // 3단계 토글: 추가(desc) → 전환(asc) → 제거
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
    const filtered = sortCriteria.filter((c) => c.key !== key);
    onSortChange(filtered.length > 0 ? filtered : defaultCriteria);
  }, [sortCriteria, onSortChange]);

  const removeCriterion = useCallback((key: SortKey) => {
    const filtered = sortCriteria.filter((c) => c.key !== key);
    onSortChange(filtered.length > 0 ? filtered : defaultCriteria);
  }, [sortCriteria, onSortChange]);

  const resetSort = useCallback(() => {
    onSortChange(defaultCriteria);
  }, [onSortChange]);

  const getSortInfo = (key: SortKey) => {
    const idx = sortCriteria.findIndex((c) => c.key === key);
    if (idx < 0) return null;
    return { order: idx + 1, dir: sortCriteria[idx].dir };
  };

  // 정렬 값 가져오기
  const getMetricValue = (ch: ChannelSearchResult, key: SortKey): number => {
    switch (key) {
      case 'subscriberCount': return ch.subscriberCount;
      case 'viewCount': return ch.viewCount;
      case 'videoCount': return ch.videoCount;
      case 'publishedAt': return new Date(ch.publishedAt).getTime();
      case 'viewToSub': return calcViewToSubConversion(ch.subscriberCount, ch.viewCount).value;
      case 'dailySub': return calcDailySubGrowth(ch.subscriberCount, ch.publishedAt).value;
      case 'videoPerf': return calcVideoPerformance(ch.viewCount, ch.videoCount, ch.subscriberCount).value;
      case 'growthSpeed': return calcGrowthSpeed(ch.subscriberCount, ch.viewCount, ch.videoCount, ch.publishedAt).value;
      default: return 0;
    }
  };

  // 정렬: 단일이면 직접 정렬, 다중이면 가중 평균 합산
  const sortedChannels = (() => {
    const list = [...channels];

    if (sortCriteria.length === 1) {
      const { key, dir } = sortCriteria[0];
      const mult = dir === 'asc' ? 1 : -1;
      return list.sort((a, b) => (getMetricValue(a, key) - getMetricValue(b, key)) * mult);
    }

    const ranges = sortCriteria.map(({ key }) => {
      const vals = list.map((v) => getMetricValue(v, key));
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      return { min, range: max - min };
    });

    const scores = new Map<string, number>();
    for (const ch of list) {
      let total = 0;
      sortCriteria.forEach(({ key, dir }, i) => {
        const val = getMetricValue(ch, key);
        const norm = ranges[i].range > 0 ? (val - ranges[i].min) / ranges[i].range : 0;
        total += dir === 'desc' ? norm : 1 - norm;
      });
      scores.set(ch.id, total);
    }

    return list.sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));
  })();

  const allSelected = channels.length > 0 && selectedIds.size === channels.length;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}.${mm}.${dd}`;
  };

  return (
    <div>
      {/* 정렬 조건 태그 */}
      <div className="flex items-center gap-2 mb-3 px-1 overflow-x-auto whitespace-nowrap">
        <span className="text-xs text-gray-400 flex-shrink-0">정렬:</span>
        {sortCriteria.map((c, idx) => (
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
        ))}
        <button
          onClick={resetSort}
          className="text-xs text-gray-400 hover:text-gray-300 transition-colors flex-shrink-0"
        >
          초기화
        </button>
        <span className="text-[10px] text-gray-400 ml-auto flex-shrink-0">클릭: 추가(↑) → 전환(↓) → 제거</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-800 bg-gray-900">
              <th className="w-12 py-3.5 pl-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 rounded border-gray-700 accent-cl-500 cursor-pointer"
                />
              </th>
              <th className="text-left py-3.5 pl-2 min-w-[240px] font-semibold">
                프로필 ({channels.length})
              </th>
              {columns.map((col) => {
                const sortInfo = getSortInfo(col.key);
                const isActive = sortInfo !== null;
                return (
                  <th
                    key={col.key}
                    className={`py-3.5 px-3 cursor-pointer select-none hover:text-gray-200 transition-colors font-semibold whitespace-pre-line leading-tight min-w-[80px] ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } ${isActive ? 'text-gray-100' : ''}`}
                    onClick={() => handleSort(col.key)}
                    title="클릭: 추가(↑) → 전환(↓) → 제거"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {isActive ? (
                        <span className="inline-flex items-center gap-0.5">
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

          <tbody>
            {sortedChannels.map((ch, idx) => {
              const viewToSub = calcViewToSubConversion(ch.subscriberCount, ch.viewCount);
              const dailySub = calcDailySubGrowth(ch.subscriberCount, ch.publishedAt);
              const videoPerf = calcVideoPerformance(ch.viewCount, ch.videoCount, ch.subscriberCount);
              const growth = calcGrowthSpeed(ch.subscriberCount, ch.viewCount, ch.videoCount, ch.publishedAt);
              const isSelected = selectedIds.has(ch.id);
              const rowBg = isSelected
                ? 'bg-cl-50'
                : idx % 2 === 1
                  ? 'bg-gray-800/30'
                  : '';

              return (
                <tr
                  key={`${ch.id}-${idx}`}
                  className={`border-b border-gray-800 hover:bg-gray-800 transition-colors ${rowBg}`}
                >
                  <td className="py-4 pl-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(ch.id)}
                      className="w-4 h-4 rounded border-gray-700 accent-cl-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-4 pl-2 pr-4">
                    <div className="flex items-center gap-3">
                      <a href={`/channel/${ch.id}`} className="flex-shrink-0">
                        <Image
                          src={ch.thumbnailUrl}
                          alt={ch.title}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      </a>
                      <a
                        href={`/channel/${ch.id}`}
                        className="text-[13px] text-gray-100 hover:text-cl-500 font-medium transition-colors line-clamp-1"
                      >
                        {ch.title}
                      </a>
                    </div>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span className="text-[13px] text-gray-400 tabular-nums">
                      {formatDate(ch.publishedAt)}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-right">
                    <span className="text-[13px] text-gray-100 font-medium tabular-nums">
                      {formatCount(ch.subscriberCount)}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <ChannelGradeBadge grade={viewToSub.grade} label={viewToSub.label} dots={viewToSub.dots} />
                  </td>
                  <td className="py-4 px-3 text-center">
                    <ChannelGradeBadge grade={dailySub.grade} label={dailySub.label} dots={dailySub.dots} />
                  </td>
                  <td className="py-4 px-3 text-center">
                    <ChannelGradeBadge grade={videoPerf.grade} label={videoPerf.label} dots={videoPerf.dots} />
                  </td>
                  <td className="py-4 px-3 text-center">
                    <ChannelGradeBadge grade={growth.grade} label={growth.label} dots={growth.dots} />
                  </td>
                  <td className="py-4 px-3 text-right">
                    <span className="text-[13px] text-gray-400 tabular-nums">
                      {formatCount(ch.viewCount)}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-right">
                    <span className="text-[13px] text-gray-400 tabular-nums">
                      {ch.videoCount.toLocaleString()}
                    </span>
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
