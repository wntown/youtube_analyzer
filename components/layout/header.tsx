'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, BarChart3, Folder } from 'lucide-react';
import { SettingsButton } from './settings-modal';

// 네비게이션 메뉴 항목
const navItems = [
  { href: '/', label: '영상 찾기', icon: Search },
  { href: '/channel-search', label: '채널 찾기', icon: BarChart3 },
  { href: '/channel-analysis', label: '채널 분석', icon: BarChart3 },
  { href: '/collected', label: '수집한 영상', icon: Folder },
];

// CreatorLens 공통 헤더 (글래스모피즘 + sticky)
export function Header() {
  const pathname = usePathname();

  return (
    <header className="glass sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 py-0 flex items-center gap-8">
        {/* 로고 */}
        <Link href="/" className="text-xl font-bold text-gray-100 flex items-center gap-1 py-4 flex-shrink-0">
          <span className="brand-text-gradient">첫번째</span> 레슨
        </Link>

        {/* 네비게이션 */}
        <nav className="flex items-center gap-0 overflow-x-auto flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href === '/' && pathname === '/') ||
              (item.href === '/channel-search' && (pathname === '/channel-search' || pathname.startsWith('/channel/')) ) ||
              (item.href === '/channel-analysis' && pathname === '/channel-analysis') ||
              (item.href === '/collected' && pathname === '/collected');

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`
                  flex items-center gap-1.5 px-4 py-4 text-sm whitespace-nowrap transition-colors border-b-2
                  ${isActive
                    ? 'text-cl-500 border-cl-500 font-medium'
                    : 'text-gray-400 border-transparent hover:text-gray-200'
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 설정 버튼 */}
        <SettingsButton />
      </div>
    </header>
  );
}
