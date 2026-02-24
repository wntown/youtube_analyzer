'use client';

import type { ChannelGrade } from '@/lib/channel-metrics';

interface ChannelGradeBadgeProps {
  grade: ChannelGrade;
  label: string;
  dots: number;
}

// 등급별 색상 (다크 테마)
const gradeColors: Record<ChannelGrade, { dot: string; text: string }> = {
  great: { dot: 'bg-emerald-500', text: 'text-emerald-600' },
  good: { dot: 'bg-emerald-400', text: 'text-emerald-600' },
  normal: { dot: 'bg-gray-300', text: 'text-gray-500' },
  bad: { dot: 'bg-red-400', text: 'text-red-500' },
  worst: { dot: 'bg-red-500', text: 'text-red-400' },
};

// CreatorLens 스타일 등급 배지 (점 + 라벨)
export function ChannelGradeBadge({ grade, label, dots }: ChannelGradeBadgeProps) {
  const colors = gradeColors[grade];

  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* 점 표시 (최대 5개) */}
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i < dots ? colors.dot : 'bg-gray-700'
            }`}
          />
        ))}
      </div>
      {/* 등급 라벨 */}
      <span className={`text-xs font-semibold ${colors.text}`}>
        {label}
      </span>
    </div>
  );
}
