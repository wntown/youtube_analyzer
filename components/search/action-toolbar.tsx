'use client';

import { LayoutGrid, List, Download, Trash2 } from 'lucide-react';

export type ViewMode = 'grid' | 'table';

interface ActionToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedCount: number;
  totalCount: number;
  onCollect?: () => void;
  onRemove?: () => void;
}

// 액션 툴바: 뷰 토글 + 영상 관리 버튼
export function ActionToolbar({
  viewMode, onViewModeChange, selectedCount, totalCount,
  onCollect, onRemove,
}: ActionToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-4 gap-4">
      {/* 왼쪽: 결과 수 + 뷰 토글 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">
          {totalCount.toLocaleString()}개 결과
          {selectedCount > 0 && (
            <span className="text-cl-500 ml-2 font-medium">{selectedCount}개 선택</span>
          )}
        </span>

        {/* 뷰 모드 토글 */}
        <div className="flex items-center bg-gray-800 rounded-lg border border-[var(--border)] p-0.5">
          <button
            onClick={() => onViewModeChange('table')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'table'
                ? 'bg-cl-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="테이블 뷰"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-cl-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="그리드 뷰"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 오른쪽: 액션 버튼들 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onCollect}
          disabled={selectedCount === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-cl-200 text-cl-600 hover:bg-cl-50 disabled:opacity-30 disabled:cursor-not-allowed"
          title="선택한 영상 수집"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">영상수집</span>
        </button>
        <button
          onClick={onRemove}
          disabled={selectedCount === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-red-500 hover:border-red-800 disabled:opacity-30 disabled:cursor-not-allowed"
          title="선택한 영상 제거"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">영상제거</span>
        </button>
      </div>
    </div>
  );
}
