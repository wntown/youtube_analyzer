import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 오렌지 보조 팔레트 (Tubegen 스타일)
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          500: '#FF6B00',
          600: '#E65A00',
          700: '#C2410C',
        },
        // CreatorLens 오렌지 테마 컬러 (기존 cl-* 클래스명 유지, 색상만 교체)
        cl: {
          50: '#FFF7ED',   // 매우 밝은 오렌지 - 선택행/태그배경
          100: '#FFEDD5',  // 밝은 오렌지 - 배너테두리
          200: '#FED7AA',  // 오렌지 라이트 - 칩테두리
          300: '#FDBA74',  // 밝은 오렌지
          400: '#FF8F33',  // 호버 오렌지 (Tubegen brand-hover)
          500: '#FF6B00',  // 메인 브랜드 (Tubegen brand)
          600: '#E65A00',  // 다크 오렌지 (Tubegen brand-dark)
          700: '#C2410C',  // 진한 오렌지
          800: '#9A3412',
          900: '#7C2D12',
        },
      },
      // Tubegen 스타일 폰트 패밀리
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-noto-sans-kr)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-sora)', 'var(--font-noto-sans-kr)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
