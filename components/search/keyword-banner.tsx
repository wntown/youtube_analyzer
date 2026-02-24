'use client';

import { Sparkles } from 'lucide-react';

interface KeywordBannerProps {
  query: string;
  onKeywordClick: (keyword: string) => void;
}

// 관련 키워드 배너
export function KeywordBanner({ query, onKeywordClick }: KeywordBannerProps) {
  const relatedKeywords = generateRelatedKeywords(query);

  if (relatedKeywords.length === 0) return null;

  return (
    <div className="bg-cl-50 border border-cl-100 rounded-lg p-4 my-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-cl-500" />
        <span className="text-sm font-medium text-cl-600">연관 키워드</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {relatedKeywords.map((keyword) => (
          <button
            key={keyword}
            onClick={() => onKeywordClick(keyword)}
            className="px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-full text-xs text-gray-400 hover:text-cl-600 hover:border-cl-300 transition-colors"
          >
            {keyword}
          </button>
        ))}
      </div>
    </div>
  );
}

// 검색어 기반 간단한 관련 키워드 생성
function generateRelatedKeywords(query: string): string[] {
  if (!query.trim()) return [];

  const base = query.trim();
  const suffixes = ['추천', '순위', '리뷰', '비교', '방법', '꿀팁', '2024', '2025'];

  return suffixes
    .slice(0, 6)
    .map((suffix) => `${base} ${suffix}`);
}
