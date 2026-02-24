import type { Metadata } from 'next';
import { Inter, Noto_Sans_KR, Sora } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

// 영문 본문 폰트
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// 한글 본문 폰트
const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
});

// 헤딩 폰트
const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '첫번째 레슨 - YouTube 영상검색 & 채널분석',
  description: 'YouTube 키워드로 영상을 검색하고 채널을 분석하세요',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body
        className={`${inter.variable} ${notoSansKR.variable} ${sora.variable} ${GeistMono.variable} antialiased min-h-screen`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
