'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Image from 'next/image';
import { Users, Eye, Video, TrendingUp, BarChart3, ChevronUp, ChevronDown, X } from 'lucide-react';
import { formatCount, formatDuration, type YouTubeVideo, type YouTubeChannel } from '@/lib/youtube';
import { Header } from '@/components/layout/header';
import { getApiKey } from '@/lib/api-key';

interface ChannelVideoWithEngagement extends YouTubeVideo {
  engagementRate: number;
}

interface ChannelData {
  channel: YouTubeChannel;
  videos: ChannelVideoWithEngagement[];
  stats: {
    totalViews: number;
    avgViews: number;
    topVideo: YouTubeVideo | null;
    videoCount: number;
  };
}

type SortKey = 'viewCount' | 'likeCount' | 'commentCount' | 'engagementRate' | 'durationSeconds' | 'publishedAt';
type SortDirection = 'asc' | 'desc';

interface SortCriterion {
  key: SortKey;
  dir: SortDirection;
}

const sortColumns: Array<{ key: SortKey; label: string }> = [
  { key: 'viewCount', label: '조회수' },
  { key: 'likeCount', label: '좋아요' },
  { key: 'commentCount', label: '댓글' },
  { key: 'engagementRate', label: '참여율' },
  { key: 'durationSeconds', label: '길이' },
  { key: 'publishedAt', label: '게시일' },
];

const labelMap: Record<SortKey, string> = {
  viewCount: '조회수',
  likeCount: '좋아요',
  commentCount: '댓글',
  engagementRate: '참여율',
  durationSeconds: '길이',
  publishedAt: '게시일',
};

export default function ChannelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([
    { key: 'viewCount', dir: 'desc' },
  ]);

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        const res = await fetch(`/api/channel?id=${id}`, {
          headers: { 'x-youtube-api-key': getApiKey() },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : '채널 정보를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchChannel();
  }, [id]);

  // 3단계 토글: 추가(desc) → 전환(asc) → 제거
  const handleSort = useCallback((key: SortKey) => {
    setSortCriteria((prev) => {
      const existingIdx = prev.findIndex((c) => c.key === key);
      if (existingIdx < 0) {
        return [...prev, { key, dir: 'desc' }];
      }
      if (prev[existingIdx].dir === 'desc') {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], dir: 'asc' };
        return updated;
      }
      const filtered = prev.filter((c) => c.key !== key);
      return filtered.length > 0 ? filtered : [{ key: 'viewCount', dir: 'desc' }];
    });
  }, []);

  const removeCriterion = useCallback((key: SortKey) => {
    setSortCriteria((prev) => {
      const filtered = prev.filter((c) => c.key !== key);
      return filtered.length > 0 ? filtered : [{ key: 'viewCount', dir: 'desc' }];
    });
  }, []);

  const resetSort = useCallback(() => {
    setSortCriteria([{ key: 'viewCount', dir: 'desc' }]);
  }, []);

  const getSortInfo = (key: SortKey) => {
    const idx = sortCriteria.findIndex((c) => c.key === key);
    if (idx < 0) return null;
    return { order: idx + 1, dir: sortCriteria[idx].dir };
  };

  const getSortValue = (video: ChannelVideoWithEngagement, key: SortKey): number => {
    switch (key) {
      case 'viewCount': return video.viewCount;
      case 'likeCount': return video.likeCount;
      case 'commentCount': return video.commentCount;
      case 'engagementRate': return video.engagementRate;
      case 'durationSeconds': return video.durationSeconds;
      case 'publishedAt': return new Date(video.publishedAt).getTime();
      default: return 0;
    }
  };

  // 정렬: 단일이면 직접 정렬, 다중이면 가중 평균 합산
  const sortedVideos = (() => {
    if (!data) return [];
    const list = [...data.videos];

    if (sortCriteria.length === 1) {
      const { key, dir } = sortCriteria[0];
      const mult = dir === 'asc' ? 1 : -1;
      return list.sort((a, b) => (getSortValue(a, key) - getSortValue(b, key)) * mult);
    }

    const ranges = sortCriteria.map(({ key }) => {
      const vals = list.map((v) => getSortValue(v, key));
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      return { min, range: max - min };
    });

    const scores = new Map<string, number>();
    for (const video of list) {
      let total = 0;
      sortCriteria.forEach(({ key, dir }, i) => {
        const val = getSortValue(video, key);
        const norm = ranges[i].range > 0 ? (val - ranges[i].min) / ranges[i].range : 0;
        total += dir === 'desc' ? norm : 1 - norm;
      });
      scores.set(video.id, total);
    }

    return list.sort((a, b) => {
      const diff = (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0);
      if (diff !== 0) return diff;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-lg">채널 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error || '데이터 없음'}</p>
          <a href="/channel-search" className="text-cl-500 hover:underline">
            돌아가기
          </a>
        </div>
      </div>
    );
  }

  const { channel, stats } = data;

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 채널 프로필 */}
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-start gap-5">
            <Image
              src={channel.thumbnailUrl}
              alt={channel.title}
              width={80}
              height={80}
              className="rounded-full"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-100">{channel.title}</h2>
              <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                {channel.description || '채널 설명 없음'}
              </p>
              {channel.country && (
                <span className="text-xs text-gray-400 mt-1 inline-block">
                  {channel.country}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <StatCard
              icon={<Users className="w-5 h-5 text-cl-500" />}
              label="구독자"
              value={formatCount(channel.subscriberCount)}
            />
            <StatCard
              icon={<Eye className="w-5 h-5 text-emerald-500" />}
              label="총 조회수"
              value={formatCount(channel.viewCount)}
            />
            <StatCard
              icon={<Video className="w-5 h-5 text-purple-500" />}
              label="영상 수"
              value={channel.videoCount.toLocaleString()}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-amber-500" />}
              label="평균 조회수"
              value={formatCount(stats.avgViews)}
            />
          </div>
        </div>

        {/* 영상 퍼포먼스 */}
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cl-500" />
              영상 퍼포먼스 (최근 {stats.videoCount}개)
            </h3>
          </div>

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
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-800">
                  <th className="text-left py-3 pl-2 font-semibold w-8">#</th>
                  <th className="text-left py-3 font-semibold min-w-[300px]">영상</th>
                  {sortColumns.map((col) => {
                    const sortInfo = getSortInfo(col.key);
                    const isActive = sortInfo !== null;
                    return (
                      <th
                        key={col.key}
                        className={`py-3 px-3 text-right cursor-pointer select-none hover:text-gray-200 transition-colors font-semibold whitespace-nowrap min-w-[70px] ${
                          isActive ? 'text-gray-100' : ''
                        }`}
                        onClick={() => handleSort(col.key)}
                        title="클릭: 추가(↑) → 전환(↓) → 제거"
                      >
                        <span className="inline-flex items-center gap-1 justify-end">
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
                {sortedVideos.map((video, index) => (
                  <tr
                    key={video.id}
                    className={`border-b border-gray-800 hover:bg-gray-800 transition-colors ${
                      index % 2 === 1 ? 'bg-gray-800/30' : ''
                    }`}
                  >
                    <td className="py-3 pl-2 text-sm text-gray-400">{index + 1}</td>
                    <td className="py-3">
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
                            width={120}
                            height={68}
                            className="rounded object-cover"
                          />
                        </a>
                        <div className="min-w-0">
                          <a
                            href={`https://www.youtube.com/watch?v=${video.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-100 hover:text-cl-500 line-clamp-2 transition-colors font-medium"
                          >
                            {video.title}
                          </a>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(video.publishedAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-sm text-gray-100 font-medium">
                        {formatCount(video.viewCount)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-sm text-gray-400">
                      {formatCount(video.likeCount)}
                    </td>
                    <td className="py-3 px-3 text-right text-sm text-gray-400">
                      {formatCount(video.commentCount)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`text-sm font-medium ${
                        video.engagementRate >= 5
                          ? 'text-emerald-600'
                          : video.engagementRate >= 2
                          ? 'text-amber-600'
                          : 'text-gray-400'
                      }`}>
                        {video.engagementRate.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-sm text-gray-400">
                      {formatDuration(video.durationSeconds)}
                    </td>
                    <td className="py-3 px-3 text-right text-sm text-gray-400">
                      {new Date(video.publishedAt).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="text-xl font-bold text-gray-100">{value}</div>
    </div>
  );
}
