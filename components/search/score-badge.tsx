'use client';

import type { ScoreGrade } from '@/lib/metrics';

interface ScoreBadgeProps {
  label: string;
  grade: ScoreGrade;
}

// 등급별 색상 매핑 (라이트 테마)
const gradeStyles: Record<ScoreGrade, string> = {
  'very-good': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'good': 'bg-blue-50 text-blue-700 border-blue-200',
  'normal': 'bg-amber-50 text-amber-700 border-amber-200',
  'bad': 'bg-red-950 text-red-400 border-red-800',
};

// 기여도/성과도 배지 컴포넌트
export function ScoreBadge({ label, grade }: ScoreBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${gradeStyles[grade]}`}>
      {label}
    </span>
  );
}
