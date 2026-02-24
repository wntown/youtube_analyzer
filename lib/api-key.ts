// YouTube API Key localStorage 관리 유틸리티
// 브라우저 전용 (클라이언트 사이드)

const STORAGE_KEY = 'youtube_api_key';

/** localStorage에서 API Key 읽기 */
export function getApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY) || '';
}

/** localStorage에 API Key 저장 */
export function setApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, key.trim());
}

/** localStorage에서 API Key 삭제 */
export function removeApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/** API Key가 저장되어 있는지 확인 */
export function hasApiKey(): boolean {
  return getApiKey().length > 0;
}
