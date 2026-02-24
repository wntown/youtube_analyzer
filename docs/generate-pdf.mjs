import PDFDocument from "pdfkit";
import fs from "fs";

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 60, bottom: 60, left: 55, right: 55 },
  info: {
    Title: "CreatorLens 다중 정렬 사용설명서",
    Author: "CreatorLens",
  },
});

const outPath = "docs/CreatorLens_다중정렬_사용설명서.pdf";
const stream = fs.createWriteStream(outPath);
doc.pipe(stream);

// ===== 컬러 팔레트 (흰색 배경 + 가독성) =====
const C = {
  black: "#1a1a1a",
  dark: "#333333",
  body: "#444444",
  muted: "#666666",
  light: "#999999",
  border: "#dddddd",
  bgGray: "#f5f5f5",
  bgOrange: "#fff7ed",
  bgBlue: "#eff6ff",
  bgGreen: "#f0fdf4",
  bgRed: "#fef2f2",
  bgPurple: "#faf5ff",
  orange: "#ea580c",
  orangeDark: "#c2410c",
  blue: "#2563eb",
  green: "#16a34a",
  red: "#dc2626",
  purple: "#9333ea",
};

// ===== 한글 폰트 등록 =====
doc.registerFont("Korean", "/Library/Fonts/NotoSansKR-Regular.otf");
doc.registerFont("KoreanBold", "/Library/Fonts/NotoSansKR-Bold.otf");
doc.registerFont("KoreanMedium", "/Library/Fonts/NotoSansKR-Medium.otf");

// ===== 헬퍼 함수 =====
const W = 485; // 사용 가능 너비 (A4 - 좌우 마진)

function drawLine(y, color = C.border) {
  doc.strokeColor(color).lineWidth(0.5)
    .moveTo(55, y).lineTo(55 + W, y).stroke();
}

function drawBox(x, y, w, h, opts = {}) {
  const { fill, border, radius } = opts;
  if (radius) {
    doc.roundedRect(x, y, w, h, radius);
  } else {
    doc.rect(x, y, w, h);
  }
  if (fill) doc.fill(fill);
  if (border) {
    if (radius) doc.roundedRect(x, y, w, h, radius);
    else doc.rect(x, y, w, h);
    doc.strokeColor(border).lineWidth(0.8).stroke();
  }
}

function drawCircle(x, y, r, color) {
  doc.circle(x, y, r).fill(color);
}

function pageHeader(slideNum, label) {
  doc.font("KoreanBold").fontSize(9).fillColor(C.orange)
    .text(`${String(slideNum).padStart(2, "0")} / ${label}`, 55, 35, { width: W });
  drawLine(52, C.orange);
}

function ensurePage() {
  doc.addPage();
}

// =====================================================
// 페이지 1: 표지
// =====================================================

// 상단 여백
doc.moveDown(4);

// 브랜드
doc.font("KoreanBold").fontSize(14).fillColor(C.orange)
  .text("CreatorLens", { align: "center" });
doc.moveDown(0.8);

// 제목
doc.font("KoreanBold").fontSize(30).fillColor(C.black)
  .text("다중 정렬", { align: "center" });
doc.font("KoreanBold").fontSize(30).fillColor(C.black)
  .text("사용설명서", { align: "center" });
doc.moveDown(1);

// 부제
doc.font("Korean").fontSize(13).fillColor(C.muted)
  .text("원하는 기준을 여러 개 조합해서", { align: "center" });
doc.font("Korean").fontSize(13).fillColor(C.muted)
  .text("최적의 영상을 찾는 방법을 알려드립니다", { align: "center" });
doc.moveDown(2.5);

// 정렬 태그 시뮬레이션
const tagTexts = ["1  조회수 ↑", "2  구독자 ↑", "3  성과도 ↑"];
const tagW = 100, tagH = 26, tagGap = 15;
const tagsTotal = tagTexts.length * tagW + (tagTexts.length - 1) * tagGap;
let tagStartX = 55 + (W - tagsTotal) / 2;

tagTexts.forEach((t, i) => {
  const tx = tagStartX + i * (tagW + tagGap);
  const ty = doc.y;
  drawBox(tx, ty, tagW, tagH, { fill: C.bgOrange, border: C.orange, radius: 13 });
  doc.font("KoreanBold").fontSize(10).fillColor(C.orange)
    .text(t, tx, ty + 7, { width: tagW, align: "center" });
});

doc.moveDown(5);

// 하단 정보
doc.font("Korean").fontSize(9).fillColor(C.light)
  .text("v1.0  |  2026", { align: "center" });

// =====================================================
// 페이지 2: 정렬 가능한 7가지 항목
// =====================================================
ensurePage();
pageHeader(2, "정렬 가능한 항목");

doc.font("KoreanBold").fontSize(22).fillColor(C.black)
  .text("총 7가지 기준으로 정렬할 수 있어요", 55, 68);
doc.font("Korean").fontSize(11).fillColor(C.muted)
  .text("테이블 헤더의 각 항목을 클릭하면 정렬 기준에 추가됩니다", 55);
doc.moveDown(1);

const colItems = [
  { icon: "👁", name: "조회수", desc: "영상이 얼마나 많이 봤는지. 숫자가 클수록 인기 있는 영상이에요.", bg: C.bgOrange },
  { icon: "👥", name: "구독자", desc: "채널의 구독자 수. 채널의 규모를 파악할 수 있어요.", bg: C.bgBlue },
  { icon: "📊", name: "기여도", desc: "조회수 / 구독자 비율. 구독자 대비 조회수가 높으면 '터진 영상'이에요.", bg: C.bgGreen },
  { icon: "🏆", name: "성과도", desc: "좋아요 + 댓글 + 조회수를 종합한 점수. 영상의 퀄리티 지표예요.", bg: C.bgPurple },
  { icon: "🎬", name: "총영상수", desc: "채널의 총 영상 개수. 영상이 적은데 조회수가 높으면 주목할 만해요.", bg: C.bgRed },
  { icon: "📅", name: "게시일", desc: "영상 업로드 날짜. 최신순이나 오래된순으로 정렬할 수 있어요.", bg: C.bgGray },
  { icon: "🎯", name: "노출확률", desc: "내가 이 키워드로 영상을 올렸을 때 노출될 확률을 예측한 점수예요.", bg: C.bgOrange },
];

const cardW = 230, cardH = 70, cardGap = 18;
colItems.forEach((item, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const cx = 55 + col * (cardW + cardGap + 7);
  const cy = 130 + row * (cardH + 12);

  drawBox(cx, cy, cardW, cardH, { fill: item.bg, radius: 8 });

  doc.fontSize(20).text(item.icon, cx + 12, cy + 12, { width: 28 });

  doc.font("KoreanBold").fontSize(12).fillColor(C.black)
    .text(item.name, cx + 48, cy + 10, { width: cardW - 60 });

  doc.font("Korean").fontSize(9).fillColor(C.body)
    .text(item.desc, cx + 48, cy + 28, { width: cardW - 60, lineGap: 2 });
});

// =====================================================
// 페이지 3: 3단계 클릭 토글
// =====================================================
ensurePage();
pageHeader(3, "사용법");

doc.font("KoreanBold").fontSize(22).fillColor(C.black)
  .text("컬럼 헤더를 클릭하면 3단계로 바뀌어요", 55, 68);
doc.font("Korean").fontSize(11).fillColor(C.muted)
  .text("같은 항목을 반복 클릭하면 높은순 → 낮은순 → 제거 순서로 전환됩니다", 55);

const stepsData = [
  {
    num: "1", title: "첫 번째 클릭 → 높은순(↑) 추가",
    desc: "아직 정렬에 없는 항목을 클릭하면, 높은 값이 위에 오는 순서(내림차순)로 정렬 기준에 추가됩니다.",
    example: "예: 조회수 100만 → 50만 → 10만",
  },
  {
    num: "2", title: "두 번째 클릭 → 낮은순(↓) 전환",
    desc: "이미 높은순(↑)인 항목을 다시 클릭하면, 낮은 값이 위에 오는 순서(오름차순)로 바뀝니다.",
    example: "예: 조회수 10만 → 50만 → 100만",
  },
  {
    num: "3", title: "세 번째 클릭 → 정렬 기준에서 제거",
    desc: "이미 낮은순(↓)인 항목을 다시 클릭하면, 해당 항목이 정렬 기준에서 완전히 사라집니다.",
    example: "또는 태그의 x 버튼으로 개별 제거 가능",
  },
];

stepsData.forEach((step, i) => {
  const sy = 140 + i * 120;

  // 번호 원
  drawCircle(75, sy + 20, 14, C.orange);
  doc.font("KoreanBold").fontSize(16).fillColor("#ffffff")
    .text(step.num, 67, sy + 12, { width: 16, align: "center" });

  // 제목
  doc.font("KoreanBold").fontSize(14).fillColor(C.black)
    .text(step.title, 100, sy + 4, { width: 380 });

  // 설명
  doc.font("Korean").fontSize(11).fillColor(C.body)
    .text(step.desc, 100, sy + 26, { width: 380, lineGap: 3 });

  // 예시 박스
  drawBox(100, sy + 58, 380, 28, { fill: C.bgGray, radius: 6 });
  doc.font("Korean").fontSize(10).fillColor(C.orange)
    .text(step.example, 112, sy + 66, { width: 356 });
});

// 플로우 다이어그램
const flowY = 510;
drawBox(55, flowY, W, 40, { fill: C.bgGray, radius: 8 });

const flowTexts = ["클릭!", "높은순 ↑", "클릭!", "낮은순 ↓", "클릭!", "제거됨"];
flowTexts.forEach((ft, i) => {
  const fx = 70 + i * 78;
  const isAction = i % 2 === 0;
  doc.font(isAction ? "KoreanBold" : "Korean").fontSize(10)
    .fillColor(isAction ? C.orange : C.dark)
    .text(ft, fx, flowY + 14, { width: 65, align: "center" });
  if (i < flowTexts.length - 1) {
    doc.font("Korean").fontSize(12).fillColor(C.light)
      .text("→", fx + 62, flowY + 12, { width: 20, align: "center" });
  }
});

// 팁 박스
const tipY = 570;
drawBox(55, tipY, W, 55, { fill: C.bgGreen, border: "#bbf7d0", radius: 8 });
doc.font("KoreanBold").fontSize(10).fillColor(C.green)
  .text("💡 팁", 70, tipY + 10, { width: W - 30 });
doc.font("Korean").fontSize(10).fillColor(C.body)
  .text('"초기화" 버튼을 누르면 모든 정렬 기준이 한 번에 초기화되고, YouTube API가 반환한 검색 관련성 순서로 돌아갑니다.', 70, tipY + 28, { width: W - 40, lineGap: 3 });

// =====================================================
// 페이지 4: 실전 데모
// =====================================================
ensurePage();
pageHeader(4, "실전 데모");

doc.font("KoreanBold").fontSize(22).fillColor(C.black)
  .text("이렇게 동작합니다", 55, 68);

// --- 정렬 전 ---
doc.font("KoreanBold").fontSize(13).fillColor(C.dark)
  .text("정렬 전 (기본 상태)", 55, 105);

drawBox(55, 122, W, 20, { fill: C.bgGray, radius: 4 });
doc.font("Korean").fontSize(9).fillColor(C.muted)
  .text("정렬: 없음 (검색 관련성 순)", 65, 127);

// 정렬 전 테이블
const t1Y = 148;
const t1ColW = [180, 80, 80, 80];
const t1Headers = ["영상", "조회수 ↕", "구독자 ↕", "성과도"];
const t1Rows = [
  ["먹방 브이로그", "50만", "30만", "보통"],
  ["ASMR 치킨", "200만", "100만", "좋음"],
  ["길거리 음식", "10만", "5만", "매우좋음"],
];

// 헤더
let tx = 55;
drawBox(55, t1Y, 420, 22, { fill: "#f0f0f0" });
t1Headers.forEach((h, i) => {
  doc.font("KoreanBold").fontSize(9).fillColor(C.muted)
    .text(h, tx + 8, t1Y + 6, { width: t1ColW[i] - 16, align: i === 0 ? "left" : "center" });
  tx += t1ColW[i];
});

// 행
t1Rows.forEach((row, ri) => {
  const ry = t1Y + 22 + ri * 22;
  drawBox(55, ry, 420, 22, { fill: ri % 2 === 0 ? "#ffffff" : "#fafafa" });
  drawLine(ry, "#eeeeee");
  let rx = 55;
  row.forEach((cell, ci) => {
    doc.font(ci === 1 ? "KoreanBold" : "Korean").fontSize(10)
      .fillColor(ci === 0 ? C.dark : C.body)
      .text(cell, rx + 8, ry + 5, { width: t1ColW[ci] - 16, align: ci === 0 ? "left" : "center" });
    rx += t1ColW[ci];
  });
});

// 화살표
doc.font("KoreanBold").fontSize(28).fillColor(C.orange)
  .text("▼", 55 + W / 2 - 10, 242);

// --- 다중 정렬 후 ---
doc.font("KoreanBold").fontSize(13).fillColor(C.orange)
  .text("① 조회수 클릭 → ② 구독자 클릭 (다중 정렬!)", 55, 280);

// 정렬 태그
const tagY2 = 298;
drawBox(55, tagY2, W, 24, { fill: C.bgOrange, radius: 4 });
doc.font("Korean").fontSize(9).fillColor(C.muted).text("정렬:", 65, tagY2 + 6);
drawBox(100, tagY2 + 2, 75, 20, { fill: "#ffffff", border: C.orange, radius: 10 });
doc.font("KoreanBold").fontSize(8).fillColor(C.orange).text("1  조회수 ↑", 103, tagY2 + 7, { width: 70, align: "center" });
drawBox(182, tagY2 + 2, 75, 20, { fill: "#ffffff", border: C.orange, radius: 10 });
doc.font("KoreanBold").fontSize(8).fillColor(C.orange).text("2  구독자 ↑", 185, tagY2 + 7, { width: 70, align: "center" });

// 다중 정렬 후 테이블
const t2Y = 328;
const t2ColW = [160, 80, 80, 100];
const t2Headers = ["영상", "조회수 ① ↑", "구독자 ② ↑", "종합점수"];
const t2Rows = [
  ["🥇 ASMR 치킨", "200만", "100만", "2.0점"],
  ["🥈 먹방 브이로그", "50만", "30만", "1.0점"],
  ["🥉 길거리 음식", "10만", "5만", "0.0점"],
];
const scoreColors = [C.green, "#d97706", C.red];

tx = 55;
drawBox(55, t2Y, 420, 22, { fill: "#f0f0f0" });
t2Headers.forEach((h, i) => {
  doc.font("KoreanBold").fontSize(9).fillColor(i >= 1 ? C.orange : C.muted)
    .text(h, tx + 8, t2Y + 6, { width: t2ColW[i] - 16, align: i === 0 ? "left" : "center" });
  tx += t2ColW[i];
});

t2Rows.forEach((row, ri) => {
  const ry = t2Y + 22 + ri * 26;
  drawBox(55, ry, 420, 26, { fill: ri === 0 ? C.bgOrange : (ri % 2 === 0 ? "#ffffff" : "#fafafa") });
  let rx = 55;
  row.forEach((cell, ci) => {
    const color = ci === 3 ? scoreColors[ri] : (ci === 0 && ri === 0 ? C.orangeDark : C.dark);
    doc.font(ci === 0 || ci === 3 ? "KoreanBold" : "Korean").fontSize(10)
      .fillColor(color)
      .text(cell, rx + 8, ry + 7, { width: t2ColW[ci] - 16, align: ci === 0 ? "left" : "center" });
    rx += t2ColW[ci];
  });
});

// 핵심 포인트 박스
const infoY = 435;
drawBox(55, infoY, W, 50, { fill: C.bgBlue, border: "#bfdbfe", radius: 8 });
doc.font("KoreanBold").fontSize(10).fillColor(C.blue)
  .text("ℹ️ 핵심 포인트", 70, infoY + 10, { width: W - 30 });
doc.font("Korean").fontSize(10).fillColor(C.dark)
  .text('숫자 ①②는 "클릭한 순서"이지 "우선순위"가 아닙니다! 두 기준이 동등한 비중으로 합산되어 종합 랭킹이 만들어집니다.', 70, infoY + 28, { width: W - 40, lineGap: 3 });

// =====================================================
// 페이지 5: 단일 vs 다중 정렬
// =====================================================
ensurePage();
pageHeader(5, "원리 이해");

doc.font("KoreanBold").fontSize(22).fillColor(C.black)
  .text("단일 정렬과 다중 정렬은 다르게 동작해요", 55, 68);
doc.moveDown(1.5);

// 단일 정렬 박스
const boxY = 115;
drawBox(55, boxY, 230, 130, { fill: C.bgBlue, border: "#93c5fd", radius: 10 });
doc.font("KoreanBold").fontSize(9).fillColor(C.blue)
  .text("기준 1개", 70, boxY + 12, { width: 200 });
doc.font("KoreanBold").fontSize(16).fillColor(C.black)
  .text("단일 정렬", 70, boxY + 30, { width: 200 });
doc.font("Korean").fontSize(10).fillColor(C.body)
  .text("해당 값을 기준으로\n직접 크기 비교하여 정렬", 70, boxY + 55, { width: 200, lineGap: 3 });
doc.font("Korean").fontSize(10).fillColor(C.blue)
  .text("예: 조회수 ↑\n200만 → 50만 → 10만", 70, boxY + 90, { width: 200, lineGap: 2 });

// 가운데 ≠
doc.font("KoreanBold").fontSize(24).fillColor(C.light)
  .text("≠", 295, boxY + 50, { width: 30, align: "center" });

// 다중 정렬 박스
drawBox(55 + W - 230, boxY, 230, 130, { fill: C.bgOrange, border: "#fdba74", radius: 10 });
doc.font("KoreanBold").fontSize(9).fillColor(C.orange)
  .text("기준 2개+", 55 + W - 215, boxY + 12, { width: 200 });
doc.font("KoreanBold").fontSize(16).fillColor(C.black)
  .text("다중 정렬 (종합 점수)", 55 + W - 215, boxY + 30, { width: 200 });
doc.font("Korean").fontSize(10).fillColor(C.body)
  .text("각 기준의 값을 0~1로 변환 후\n합산한 종합 점수로 정렬", 55 + W - 215, boxY + 55, { width: 200, lineGap: 3 });
doc.font("Korean").fontSize(10).fillColor(C.orange)
  .text("예: 조회수↑ + 구독자↑\n점수 2.0 → 1.0 → 0.0", 55 + W - 215, boxY + 90, { width: 200, lineGap: 2 });

// 오해 vs 실제
const vsY = 270;
drawBox(55, vsY, 230, 100, { fill: C.bgRed, border: "#fca5a5", radius: 10 });
doc.font("KoreanBold").fontSize(9).fillColor(C.red)
  .text("이것이 아닙니다 ✕", 70, vsY + 12, { width: 200 });
doc.font("KoreanBold").fontSize(12).fillColor(C.dark)
  .text("일반적인 다중 정렬", 70, vsY + 30, { width: 200 });
doc.font("Korean").fontSize(10).fillColor(C.body)
  .text("조회수로 먼저 정렬하고,\n조회수가 같을 때만 구독자로 정렬", 70, vsY + 50, { width: 200, lineGap: 3 });

doc.font("KoreanBold").fontSize(20).fillColor(C.light)
  .text("→", 295, vsY + 35, { width: 30, align: "center" });

drawBox(55 + W - 230, vsY, 230, 100, { fill: C.bgGreen, border: "#86efac", radius: 10 });
doc.font("KoreanBold").fontSize(9).fillColor(C.green)
  .text("CreatorLens 방식 ✓", 55 + W - 215, vsY + 12, { width: 200 });
doc.font("KoreanBold").fontSize(12).fillColor(C.dark)
  .text("종합 랭킹 정렬", 55 + W - 215, vsY + 30, { width: 200 });
doc.font("Korean").fontSize(10).fillColor(C.body)
  .text("조회수와 구독자를 모두 고려해\n종합적으로 뛰어난 영상을 위로", 55 + W - 215, vsY + 50, { width: 200, lineGap: 3 });

// =====================================================
// 페이지 6: 종합 점수 계산법
// =====================================================
ensurePage();
pageHeader(6, "계산 원리");

doc.font("KoreanBold").fontSize(22).fillColor(C.black)
  .text("종합 점수는 이렇게 계산됩니다", 55, 68);

// 비유 박스
const anaY = 100;
drawBox(55, anaY, W, 55, { fill: C.bgGreen, border: "#bbf7d0", radius: 8 });
doc.font("KoreanBold").fontSize(10).fillColor(C.green)
  .text("🎓 비유: 학교 성적표", 70, anaY + 10, { width: W - 30 });
doc.font("Korean").fontSize(10).fillColor(C.body)
  .text("국어 95점, 수학 80점 → 만점이 다르면 그냥 합산 불가 → 모든 과목을 0~1 사이로 맞춘 다음 합산! CreatorLens도 같은 원리.", 70, anaY + 28, { width: W - 40, lineGap: 3 });

// 조건 설명
doc.font("Korean").fontSize(10).fillColor(C.muted)
  .text("정렬 기준: ①조회수↑ ②구독자↑  /  영상 3개", 55, 170);

// Step 1
const s1Y = 195;
drawBox(55, s1Y, W, 75, { fill: C.bgGray, radius: 8 });
doc.font("KoreanBold").fontSize(11).fillColor(C.orange).text("Step 1.", 70, s1Y + 10);
doc.font("KoreanBold").fontSize(11).fillColor(C.dark).text("원래 값 확인", 115, s1Y + 10);
doc.font("Korean").fontSize(10).fillColor(C.body)
  .text("영상A:  조회수 100만   구독자 50만\n영상B:  조회수  50만   구독자 30만\n영상C:  조회수  10만   구독자 10만", 70, s1Y + 30, { width: W - 40, lineGap: 4 });

// Step 2
const s2Y = 285;
drawBox(55, s2Y, W, 105, { fill: C.bgGray, radius: 8 });
doc.font("KoreanBold").fontSize(11).fillColor(C.orange).text("Step 2.", 70, s2Y + 10);
doc.font("KoreanBold").fontSize(11).fillColor(C.dark).text("0~1 사이로 변환 (정규화)", 115, s2Y + 10);
doc.font("Korean").fontSize(9).fillColor(C.muted)
  .text("공식:  (내 값 - 최솟값) / (최댓값 - 최솟값)", 70, s2Y + 30);
doc.font("Korean").fontSize(10).fillColor(C.body)
  .text(
    "영상A:  조회수 (100만-10만)/(100만-10만) = 1.0    구독자 (50만-10만)/(50만-10만) = 1.0\n" +
    "영상B:  조회수  (50만-10만)/(100만-10만) = 0.44   구독자 (30만-10만)/(50만-10만) = 0.50\n" +
    "영상C:  조회수  (10만-10만)/(100만-10만) = 0.0    구독자 (10만-10만)/(50만-10만) = 0.0",
    70, s2Y + 48, { width: W - 40, lineGap: 6 }
  );

// Step 3
const s3Y = 405;
drawBox(55, s3Y, W, 85, { fill: C.bgOrange, border: "#fdba74", radius: 8 });
doc.font("KoreanBold").fontSize(11).fillColor(C.orange).text("Step 3.", 70, s3Y + 10);
doc.font("KoreanBold").fontSize(11).fillColor(C.dark).text("합산 → 종합 점수!", 115, s3Y + 10);
doc.font("KoreanBold").fontSize(12).fillColor(C.green)
  .text("영상A:  1.0 + 1.0  =  2.0점  🥇", 70, s3Y + 35, { width: W - 40 });
doc.font("KoreanBold").fontSize(12).fillColor("#d97706")
  .text("영상B:  0.44 + 0.50  =  0.94점  🥈", 70, s3Y + 52, { width: W - 40 });
doc.font("KoreanBold").fontSize(12).fillColor(C.red)
  .text("영상C:  0.0 + 0.0  =  0.0점  🥉", 70, s3Y + 69, { width: W - 40 });

// 주의사항
const warnY = 510;
drawBox(55, warnY, W, 45, { fill: "#fffbeb", border: "#fde68a", radius: 8 });
doc.font("KoreanBold").fontSize(10).fillColor("#d97706")
  .text("⚠️ ↓(낮은순)은 점수가 뒤집힙니다", 70, warnY + 10, { width: W - 30 });
doc.font("Korean").fontSize(10).fillColor(C.body)
  .text("구독자↓ 설정 시 → 구독자가 적을수록 높은 점수 (소규모 채널 찾기에 유용)", 70, warnY + 28, { width: W - 40 });

// =====================================================
// 페이지 7: 실전 활용 시나리오
// =====================================================
ensurePage();
pageHeader(7, "실전 활용");

doc.font("KoreanBold").fontSize(22).fillColor(C.black)
  .text("이런 상황에서 다중 정렬을 쓰세요", 55, 68);
doc.moveDown(1.2);

const scenarios = [
  {
    icon: "🔥", title: "터진 영상 찾기",
    combo: "기여도 ↑ + 성과도 ↑",
    desc: "구독자 대비 조회수가 폭발적이고 참여율도 높은 영상을 찾습니다.",
    bg: C.bgRed, border: "#fca5a5",
  },
  {
    icon: "🌱", title: "소규모 채널의 대박 영상",
    combo: "조회수 ↑ + 구독자 ↓",
    desc: "조회수는 높지만 구독자는 적은 영상. 블루오션 키워드 발굴에 유용합니다.",
    bg: C.bgGreen, border: "#86efac",
  },
  {
    icon: "📈", title: "대형 채널 벤치마킹",
    combo: "구독자 ↑ + 성과도 ↑",
    desc: "구독자도 많고 성과도도 높은 영상. TOP 크리에이터 콘텐츠를 분석할 때.",
    bg: C.bgBlue, border: "#93c5fd",
  },
  {
    icon: "🎯", title: "노출 가능성 높은 영상",
    combo: "노출확률 ↑ + 조회수 ↑",
    desc: "내가 이 키워드로 진입했을 때 노출 확률이 높으면서 시장도 큰 키워드.",
    bg: C.bgPurple, border: "#d8b4fe",
  },
];

scenarios.forEach((sc, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const sx = 55 + col * (240 + 12);
  const sy = 115 + row * 145;

  drawBox(sx, sy, 237, 130, { fill: sc.bg, border: sc.border, radius: 10 });

  doc.fontSize(22).text(sc.icon, sx + 14, sy + 14, { width: 30 });

  doc.font("KoreanBold").fontSize(14).fillColor(C.black)
    .text(sc.title, sx + 48, sy + 14, { width: 175 });

  drawBox(sx + 14, sy + 42, 209, 24, { fill: "#ffffff", radius: 6 });
  doc.font("KoreanBold").fontSize(10).fillColor(C.orange)
    .text("조합:  " + sc.combo, sx + 22, sy + 49, { width: 195 });

  doc.font("Korean").fontSize(10).fillColor(C.body)
    .text(sc.desc, sx + 14, sy + 78, { width: 209, lineGap: 3 });
});

// 팁 박스
const tipY2 = 420;
drawBox(55, tipY2, W, 45, { fill: C.bgGreen, border: "#bbf7d0", radius: 8 });
doc.font("KoreanBold").fontSize(10).fillColor(C.green)
  .text("💡 채널 검색에서도 동일!", 70, tipY2 + 10, { width: W - 30 });
doc.font("Korean").fontSize(10).fillColor(C.body)
  .text("구독자, 조회수대비 구독전환, 일평균 구독전환, 영상성과, 성장속도 등 8가지 기준으로 다중 정렬 가능합니다.", 70, tipY2 + 28, { width: W - 40 });

// =====================================================
// 페이지 8: 꿀팁 & FAQ
// =====================================================
ensurePage();
pageHeader(8, "꿀팁 & FAQ");

doc.font("KoreanBold").fontSize(22).fillColor(C.black)
  .text("알아두면 좋은 꿀팁", 55, 68);

// 꿀팁 카드
const tipItems = [
  { icon: "✅", title: "정렬 상태 자동 저장", desc: "다른 페이지 갔다 와도 정렬 상태가 그대로 유지됩니다." },
  { icon: "♾️", title: "무한 스크롤 + 정렬 유지", desc: "새 영상이 로드되어도 정렬 기준이 사라지지 않습니다." },
  { icon: "🏷️", title: "태그로 한눈에 확인", desc: "테이블 위 태그 바에서 현재 정렬 기준을 바로 확인 가능." },
  { icon: "✕", title: "개별 제거 가능", desc: "태그의 x 버튼으로 특정 기준만 제거할 수 있습니다." },
];

tipItems.forEach((tip, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const ttx = 55 + col * (245 + 5);
  const tty = 105 + row * 62;

  drawBox(ttx, tty, 240, 52, { fill: C.bgGray, radius: 8 });
  doc.fontSize(16).text(tip.icon, ttx + 12, tty + 10, { width: 24 });
  doc.font("KoreanBold").fontSize(11).fillColor(C.dark)
    .text(tip.title, ttx + 40, tty + 8, { width: 185 });
  doc.font("Korean").fontSize(9).fillColor(C.body)
    .text(tip.desc, ttx + 40, tty + 26, { width: 185, lineGap: 2 });
});

// FAQ
const faqY = 245;
doc.font("KoreanBold").fontSize(15).fillColor(C.dark)
  .text("자주 묻는 질문", 55, faqY);

drawBox(55, faqY + 25, W, 1, { fill: C.border });

const faqs = [
  { q: "숫자 ①②가 우선순위인가요?", a: "아닙니다. 클릭한 순서를 표시할 뿐, 모든 기준은 동등한 비중으로 합산됩니다." },
  { q: "기준을 몇 개까지 추가할 수 있나요?", a: "7가지 모두 가능하지만, 2~3개가 가장 실용적입니다." },
  { q: "정렬 없으면 어떤 순서인가요?", a: "YouTube API가 제공하는 검색 관련성 순서로 표시됩니다." },
  { q: "채널 검색에서 초기화하면 완전히 비워지나요?", a: "채널 검색에서는 기본값(구독자 높은순)으로 돌아갑니다. 완전히 비워지지 않아요." },
  { q: "종합 점수가 동점이면 어떻게 되나요?", a: "종합 점수가 같은 영상끼리는 최신 게시일 순서로 정렬됩니다." },
];

faqs.forEach((faq, i) => {
  const fy = faqY + 38 + i * 52;
  doc.font("KoreanBold").fontSize(11).fillColor(C.orange)
    .text("Q.", 55, fy, { continued: true, width: W });
  doc.font("KoreanBold").fontSize(11).fillColor(C.dark)
    .text("  " + faq.q, { width: W });
  doc.font("Korean").fontSize(10).fillColor(C.body)
    .text("→  " + faq.a, 70, fy + 18, { width: W - 20, lineGap: 2 });
  if (i < faqs.length - 1) {
    drawBox(55, fy + 42, W, 1, { fill: "#eeeeee" });
  }
});

// ===== 완료 =====
doc.end();
stream.on("finish", () => {
  console.log(`PDF 생성 완료: ${outPath}`);
});
