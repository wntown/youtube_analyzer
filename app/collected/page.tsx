'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Trash2, FolderOpen } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { formatCount } from '@/lib/youtube';
import { calcContribution, calcPerformance } from '@/lib/metrics';
import { ScoreBadge } from '@/components/search/score-badge';
import {
  getCollectedVideos,
  removeCollectedVideos,
  clearCollectedVideos,
  type CollectedVideo,
} from '@/lib/collection';

export default function CollectedPage() {
  const [videos, setVideos] = useState<CollectedVideo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setVideos(getCollectedVideos());
  }, []);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedIds.size === videos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(videos.map((v) => v.id)));
    }
  };

  const handleRemove = () => {
    if (selectedIds.size === 0) return;
    removeCollectedVideos(selectedIds);
    setVideos(getCollectedVideos());
    setSelectedIds(new Set());
  };

  const handleClearAll = () => {
    if (!confirm('수집한 영상을 모두 삭제할까요?')) return;
    clearCollectedVideos();
    setVideos([]);
    setSelectedIds(new Set());
  };

  const allSelected = videos.length > 0 && selectedIds.size === videos.length;

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />

      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-cl-500" />
              수집한 영상
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              총 {videos.length}개의 영상을 수집했습니다
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <span className="text-sm text-cl-500 mr-2 font-medium">{selectedIds.size}개 선택</span>
            )}
            <button
              onClick={handleRemove}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-800 text-gray-400 hover:text-red-500 hover:border-red-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              선택 삭제
            </button>
            {videos.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-800 text-gray-400 hover:text-red-500 hover:border-red-800 transition-colors"
              >
                전체 삭제
              </button>
            )}
          </div>
        </div>

        {/* 영상 목록 */}
        {videos.length > 0 ? (
          <div className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-800 bg-gray-900">
                    <th className="w-10 py-3 pl-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleToggleAll}
                        className="w-4 h-4 accent-cl-500 cursor-pointer"
                      />
                    </th>
                    <th className="text-left py-3 pl-2 font-semibold">영상</th>
                    <th className="text-right py-3 px-3 font-semibold">조회수</th>
                    <th className="text-right py-3 px-3 font-semibold">구독자</th>
                    <th className="text-center py-3 px-3 font-semibold">기여도</th>
                    <th className="text-center py-3 px-3 font-semibold">성과도</th>
                    <th className="text-right py-3 px-3 font-semibold">수집일</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map((video, idx) => {
                    const contribution = calcContribution(video.viewCount, video.subscriberCount);
                    const performance = calcPerformance(
                      video.viewCount, video.likeCount, video.commentCount, video.subscriberCount
                    );
                    const isSelected = selectedIds.has(video.id);

                    return (
                      <tr
                        key={video.id}
                        className={`border-b border-gray-800 hover:bg-gray-800 transition-colors ${
                          isSelected ? 'bg-cl-50' : idx % 2 === 1 ? 'bg-gray-800/30' : ''
                        }`}
                      >
                        <td className="py-3 pl-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggle(video.id)}
                            className="w-4 h-4 accent-cl-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 pl-2">
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
                              <a
                                href={`/channel/${video.channelId}`}
                                className="text-xs text-gray-400 hover:text-gray-200 transition-colors mt-0.5 block"
                              >
                                {video.channelTitle}
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="text-sm text-gray-100 font-medium">{formatCount(video.viewCount)}</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="text-sm text-gray-400">{formatCount(video.subscriberCount)}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <ScoreBadge label={contribution.label} grade={contribution.grade} />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <ScoreBadge label={performance.label} grade={performance.grade} />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="text-xs text-gray-400">
                            {new Date(video.collectedAt).toLocaleDateString('ko-KR')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg text-gray-400">수집한 영상이 없습니다</p>
            <p className="text-sm mt-2">영상 검색 후 체크박스로 선택하고 &quot;영상수집&quot; 버튼을 눌러보세요.</p>
            <a
              href="/"
              className="inline-block mt-4 px-6 py-2 bg-cl-500 text-white rounded-lg text-sm hover:bg-cl-600 transition-colors"
            >
              영상 검색하기
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
