'use client';

import type { VideoType } from '@/lib/youtube';

interface SearchFiltersProps {
  order: string;
  setOrder: (v: string) => void;
  duration: string;
  setDuration: (v: string) => void;
  dateRange: string;
  setDateRange: (v: string) => void;
  videoType: VideoType;
  setVideoType: (v: VideoType) => void;
  onFilterChange: () => void;
}

// 검색 필터 패널
export function SearchFilters({
  order, setOrder,
  duration, setDuration,
  dateRange, setDateRange,
  videoType, setVideoType,
  onFilterChange,
}: SearchFiltersProps) {

  const handleChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setTimeout(onFilterChange, 0);
  };

  return (
    <div className="flex flex-wrap gap-3 mb-6 items-center">
      {/* 정렬 */}
      <FilterSelect
        label="정렬"
        value={order}
        onChange={(v) => handleChange(setOrder, v)}
        options={[
          { value: 'relevance', label: '관련성' },
          { value: 'viewCount', label: '조회수' },
          { value: 'date', label: '최신순' },
          { value: 'rating', label: '평점순' },
        ]}
      />

      {/* 길이 */}
      <FilterSelect
        label="길이"
        value={duration}
        onChange={(v) => handleChange(setDuration, v)}
        options={[
          { value: 'any', label: '전체' },
          { value: 'short', label: '4분 미만' },
          { value: 'medium', label: '4~20분' },
          { value: 'long', label: '20분 이상' },
        ]}
      />

      {/* 업로드 날짜 */}
      <FilterSelect
        label="업로드 날짜"
        value={dateRange}
        onChange={(v) => handleChange(setDateRange, v)}
        options={[
          { value: 'all', label: '전체 기간' },
          { value: '1h', label: '1시간 이내' },
          { value: '1d', label: '오늘' },
          { value: '7d', label: '이번 주' },
          { value: '30d', label: '이번 달' },
          { value: '1y', label: '올해' },
        ]}
      />

      {/* 영상 유형 (전체 / 롱폼 / 숏츠) */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">유형</span>
        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
          {([
            { value: 'all', label: '전체' },
            { value: 'long', label: '롱폼' },
            { value: 'shorts', label: '숏츠' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setVideoType(opt.value)}
              className={`px-3 py-1.5 text-sm transition-colors ${
                videoType === opt.value
                  ? 'bg-cl-500 text-white font-medium'
                  : 'bg-gray-950 text-gray-400 hover:text-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// 개별 필터 셀렉트
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 bg-gray-950 border border-[var(--border)] rounded-lg text-sm text-gray-300 focus:outline-none focus:border-cl-500 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
