// 등록 채널 관리 (localStorage 기반)
// CreatorLens의 "등록 채널" 기능 - 채널을 저장해두고 빠르게 분석

const STORAGE_KEY = 'cl_registered_channels';

// 등록 채널 타입
export interface RegisteredChannel {
  id: string;
  title: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  registeredAt: string; // ISO 날짜
}

// 등록된 채널 목록 불러오기
export function getRegisteredChannels(): RegisteredChannel[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// 채널 등록 (중복 방지)
export function registerChannel(channel: Omit<RegisteredChannel, 'registeredAt'>): boolean {
  const existing = getRegisteredChannels();
  if (existing.some((c) => c.id === channel.id)) return false;

  const updated = [
    { ...channel, registeredAt: new Date().toISOString() },
    ...existing,
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return true;
}

// 채널 등록 해제
export function unregisterChannel(channelId: string): boolean {
  const existing = getRegisteredChannels();
  const filtered = existing.filter((c) => c.id !== channelId);
  if (filtered.length === existing.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// 채널 등록 여부 확인
export function isChannelRegistered(channelId: string): boolean {
  return getRegisteredChannels().some((c) => c.id === channelId);
}
