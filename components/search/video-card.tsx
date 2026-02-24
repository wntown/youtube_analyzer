'use client';

import Image from 'next/image';
import { Eye, ThumbsUp, MessageCircle, Clock } from 'lucide-react';
import { formatDuration, formatCount, isShorts, type YouTubeVideo } from '@/lib/youtube';

interface VideoCardProps {
  video: YouTubeVideo;
  highlight?: string;
}

// 영상 검색 결과 카드
export function VideoCard({ video, highlight }: VideoCardProps) {
  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
    return `${Math.floor(diffDays / 365)}년 전`;
  };

  const engagementRate = video.viewCount > 0
    ? (((video.likeCount + video.commentCount) / video.viewCount) * 100).toFixed(2)
    : '0.00';

  const highlightText = (text: string) => {
    if (!highlight?.trim()) return text;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-cl-100 text-cl-700 rounded px-0.5">{part}</mark>
        : part
    );
  };

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 hover:shadow-sm transition-all group">
      <div className="flex gap-4 p-3">
        {/* 썸네일 */}
        <a
          href={`https://www.youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 relative w-[280px] aspect-video rounded-lg overflow-hidden"
        >
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
            sizes="280px"
          />
          {isShorts(video.durationSeconds) && (
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-red-500 rounded text-xs text-white font-semibold">
              #Shorts
            </div>
          )}
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 rounded text-xs text-white font-medium">
            {formatDuration(video.durationSeconds)}
          </div>
        </a>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <h3 className="text-base font-medium text-gray-100 line-clamp-2 hover:text-cl-500 transition-colors">
              {highlightText(video.title)}
            </h3>
          </a>

          <a
            href={`/channel/${video.channelId}`}
            className="block mt-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            {video.channelTitle}
          </a>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-gray-100 font-medium">{formatCount(video.viewCount)}</span>
              <span>조회</span>
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{formatCount(video.likeCount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{formatCount(video.commentCount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{getRelativeTime(video.publishedAt)}</span>
            </div>
          </div>

          {/* 참여율 바 */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-400">참여율</span>
            <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden max-w-[200px]">
              <div
                className="h-full bg-cl-500 rounded-full"
                style={{ width: `${Math.min(parseFloat(engagementRate) * 10, 100)}%` }}
              />
            </div>
            <span className="text-xs text-cl-600 font-medium">{engagementRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
