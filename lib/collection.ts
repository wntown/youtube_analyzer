// 수집한 영상 관리 (localStorage 기반)

import type { VideoWithChannel } from './youtube';

const STORAGE_KEY = 'cl_collected_videos';

// 수집된 영상 타입 (수집 날짜 포함)
export interface CollectedVideo extends VideoWithChannel {
  collectedAt: string; // ISO 날짜
}

// 저장된 영상 목록 불러오기
export function getCollectedVideos(): CollectedVideo[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// 영상 수집 (중복 제거)
export function addCollectedVideos(videos: VideoWithChannel[]): number {
  const existing = getCollectedVideos();
  const existingIds = new Set(existing.map((v) => v.id));

  const newVideos: CollectedVideo[] = videos
    .filter((v) => !existingIds.has(v.id))
    .map((v) => ({ ...v, collectedAt: new Date().toISOString() }));

  if (newVideos.length === 0) return 0;

  const updated = [...newVideos, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newVideos.length;
}

// 영상 제거
export function removeCollectedVideos(ids: Set<string>): number {
  const existing = getCollectedVideos();
  const filtered = existing.filter((v) => !ids.has(v.id));
  const removed = existing.length - filtered.length;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return removed;
}

// 전체 삭제
export function clearCollectedVideos(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// 수집 여부 확인
export function isVideoCollected(id: string): boolean {
  return getCollectedVideos().some((v) => v.id === id);
}
