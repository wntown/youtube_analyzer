'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings, X, Eye, EyeOff, Check, Trash2, Key } from 'lucide-react';
import { getApiKey, setApiKey, removeApiKey } from '@/lib/api-key';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiKey, setApiKeyState] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 모달 열릴 때 저장된 키 로드
  useEffect(() => {
    if (isOpen) {
      setApiKeyState(getApiKey());
      setShowKey(false);
    }
  }, [isOpen]);

  // 토스트 자동 사라짐
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  const handleSave = useCallback(() => {
    if (!apiKey.trim()) {
      setToast({ message: 'API Key를 입력해주세요.', type: 'error' });
      return;
    }
    setApiKey(apiKey.trim());
    setToast({ message: 'API Key가 저장되었습니다!', type: 'success' });
  }, [apiKey]);

  const handleDelete = useCallback(() => {
    removeApiKey();
    setApiKeyState('');
    setToast({ message: 'API Key가 삭제되었습니다.', type: 'success' });
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 min-h-screen">
        <div
          className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl relative"
          style={{ margin: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold text-white">설정</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 본문 */}
          <div className="px-6 py-5 space-y-4">
            {/* 라벨 */}
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[var(--accent)]" />
              <label className="text-sm font-medium text-gray-200">
                YouTube API Key
              </label>
            </div>

            {/* 안내 문구 */}
            <p className="text-xs text-gray-500 leading-relaxed">
              Google Cloud Console에서 YouTube Data API v3 키를 발급받아 입력하세요.
              <br />
              키는 이 브라우저의 로컬 저장소에만 저장됩니다.
            </p>

            {/* 입력 필드 */}
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKeyState(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 pr-12 rounded-xl bg-[var(--background)] border border-[var(--border)] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300 transition-colors"
                title={showKey ? '숨기기' : '보기'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* 버튼 그룹 */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[#E65A00] text-white text-sm font-semibold transition-colors"
              >
                <Check className="w-4 h-4" />
                저장
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
            </div>
          </div>

          {/* 토스트 */}
          {toast && (
            <div
              className={`mx-6 mb-4 px-4 py-2.5 rounded-xl text-sm font-medium text-center transition-all ${
                toast.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/15 text-red-400 border border-red-500/20'
              }`}
            >
              {toast.message}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/** 헤더에 넣을 Settings 버튼 (모달 제어 포함) */
export function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  // 키 존재 여부 업데이트
  useEffect(() => {
    setHasKey(getApiKey().length > 0);
  }, []);

  // 모달 닫힐 때 상태 갱신
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setHasKey(getApiKey().length > 0);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        title="설정"
      >
        <Settings className="w-5 h-5" />
        {/* API Key 상태 인디케이터 */}
        <span
          className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
            hasKey ? 'bg-emerald-400' : 'bg-red-400'
          }`}
        />
      </button>

      <SettingsModal isOpen={isOpen} onClose={handleClose} />
    </>
  );
}
