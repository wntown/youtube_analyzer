import PptxGenJS from "pptxgenjs";

const pptx = new PptxGenJS();

// ===== 공통 설정 =====
pptx.layout = "LAYOUT_WIDE"; // 16:9
pptx.author = "CreatorLens";
pptx.title = "CreatorLens 다중 정렬 사용설명서";

const BG = "0C0C0C";
const ORANGE = "FF6B00";
const ORANGE_LIGHT = "FF8F33";
const WHITE = "FFFFFF";
const GRAY1 = "E5E5E5";
const GRAY2 = "AAAAAA";
const GRAY3 = "666666";
const CARD_BG = "1A1A1A";
const BORDER = "2C2C2C";

// 공통 마스터 슬라이드 세팅
const masterOpts = { background: { color: BG } };

// 슬라이드 번호 추가 헬퍼
function addSlideNumber(slide, num, total) {
  slide.addText(`${num} / ${total}`, {
    x: 11.5, y: 7.0, w: 1.5, h: 0.3,
    fontSize: 9, color: GRAY3, align: "right",
  });
}

// 페이지 하단 로고
function addFooter(slide) {
  slide.addText("CreatorLens", {
    x: 0.5, y: 7.0, w: 2, h: 0.3,
    fontSize: 9, color: GRAY3, fontFace: "Arial",
  });
}

const TOTAL = 8;

// =====================================================
// 슬라이드 1: 표지
// =====================================================
let slide = pptx.addSlide(masterOpts);

slide.addText("CreatorLens", {
  x: 0, y: 1.5, w: "100%", h: 0.6,
  fontSize: 18, color: ORANGE, bold: true, align: "center",
  fontFace: "Arial",
});

slide.addText("다중 정렬 사용설명서", {
  x: 0, y: 2.3, w: "100%", h: 1.0,
  fontSize: 40, color: WHITE, bold: true, align: "center",
});

slide.addText(
  "원하는 기준을 여러 개 조합해서\n최적의 영상을 찾으세요",
  {
    x: 2, y: 3.5, w: 9.33, h: 1.0,
    fontSize: 18, color: GRAY2, align: "center", lineSpacingMultiple: 1.5,
  }
);

// 정렬 태그 시뮬레이션
const tags = ["1  조회수 ↑", "2  구독자 ↑", "3  성과도 ↑"];
tags.forEach((tag, i) => {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 3.8 + i * 2.0, y: 5.0, w: 1.8, h: 0.45,
    fill: { color: "1A1200" }, line: { color: ORANGE, width: 1 },
    rectRadius: 0.2,
  });
  slide.addText(tag, {
    x: 3.8 + i * 2.0, y: 5.0, w: 1.8, h: 0.45,
    fontSize: 11, color: ORANGE_LIGHT, align: "center", bold: true,
  });
});

addSlideNumber(slide, 1, TOTAL);

// =====================================================
// 슬라이드 2: 정렬 가능한 7가지 항목
// =====================================================
slide = pptx.addSlide(masterOpts);
addFooter(slide);
addSlideNumber(slide, 2, TOTAL);

slide.addText("정렬 가능한 항목", {
  x: 0.8, y: 0.3, w: 5, h: 0.3,
  fontSize: 11, color: ORANGE, bold: true,
});

slide.addText("총 7가지 기준으로 정렬할 수 있어요", {
  x: 0.8, y: 0.6, w: 10, h: 0.7,
  fontSize: 28, color: WHITE, bold: true,
});

const items = [
  { icon: "👁", name: "조회수", desc: "영상이 얼마나 많이 봤는지" },
  { icon: "👥", name: "구독자", desc: "채널의 구독자 수" },
  { icon: "📊", name: "기여도", desc: "조회수 / 구독자 비율 (터진 영상 판별)" },
  { icon: "🏆", name: "성과도", desc: "좋아요+댓글+조회수 종합 점수" },
  { icon: "🎬", name: "총영상수", desc: "채널의 총 영상 개수" },
  { icon: "📅", name: "게시일", desc: "영상 업로드 날짜" },
  { icon: "🎯", name: "노출확률", desc: "내가 이 키워드로 노출될 확률 예측" },
];

items.forEach((item, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  const x = 0.8 + col * 2.95;
  const y = 1.8 + row * 2.5;

  // 카드 배경
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w: 2.7, h: 2.1,
    fill: { color: CARD_BG }, line: { color: BORDER, width: 0.5 },
    rectRadius: 0.15,
  });

  // 아이콘
  slide.addText(item.icon, {
    x: x + 0.2, y: y + 0.2, w: 0.5, h: 0.5,
    fontSize: 24,
  });

  // 이름
  slide.addText(item.name, {
    x: x + 0.2, y: y + 0.8, w: 2.3, h: 0.35,
    fontSize: 16, color: GRAY1, bold: true,
  });

  // 설명
  slide.addText(item.desc, {
    x: x + 0.2, y: y + 1.2, w: 2.3, h: 0.7,
    fontSize: 11, color: GRAY2, lineSpacingMultiple: 1.4,
  });
});

// =====================================================
// 슬라이드 3: 3단계 클릭 토글
// =====================================================
slide = pptx.addSlide(masterOpts);
addFooter(slide);
addSlideNumber(slide, 3, TOTAL);

slide.addText("사용법", {
  x: 0.8, y: 0.3, w: 5, h: 0.3,
  fontSize: 11, color: ORANGE, bold: true,
});

slide.addText("컬럼 헤더를 클릭하면 3단계로 바뀌어요", {
  x: 0.8, y: 0.6, w: 11, h: 0.7,
  fontSize: 28, color: WHITE, bold: true,
});

const steps = [
  {
    num: "1",
    title: "첫 번째 클릭 → 높은순(↑) 추가",
    desc: "아직 정렬에 없는 항목을 클릭하면,\n높은 값이 위에 오는 순서(내림차순)로 추가됩니다.",
    example: "예: 조회수 100만 → 50만 → 10만",
  },
  {
    num: "2",
    title: "두 번째 클릭 → 낮은순(↓) 전환",
    desc: "이미 높은순인 항목을 다시 클릭하면,\n낮은 값이 위에 오는 순서(오름차순)로 바뀝니다.",
    example: "예: 조회수 10만 → 50만 → 100만",
  },
  {
    num: "3",
    title: "세 번째 클릭 → 제거",
    desc: "이미 낮은순인 항목을 다시 클릭하면,\n정렬 기준에서 완전히 사라집니다.",
    example: "또는 태그의 x 버튼으로 개별 제거 가능",
  },
];

steps.forEach((step, i) => {
  const y = 1.7 + i * 1.7;

  // 번호 원
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 0.8, y: y + 0.1, w: 0.55, h: 0.55,
    fill: { color: ORANGE },
  });
  slide.addText(step.num, {
    x: 0.8, y: y + 0.1, w: 0.55, h: 0.55,
    fontSize: 20, color: WHITE, bold: true, align: "center", valign: "middle",
  });

  // 제목
  slide.addText(step.title, {
    x: 1.6, y, w: 5, h: 0.4,
    fontSize: 16, color: GRAY1, bold: true,
  });

  // 설명
  slide.addText(step.desc, {
    x: 1.6, y: y + 0.45, w: 5, h: 0.7,
    fontSize: 12, color: GRAY2, lineSpacingMultiple: 1.4,
  });

  // 예시 박스
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 7.5, y: y + 0.05, w: 4.5, h: 0.9,
    fill: { color: "111111" }, line: { color: BORDER, width: 0.5 },
    rectRadius: 0.1,
  });
  slide.addText(step.example, {
    x: 7.7, y: y + 0.05, w: 4.1, h: 0.9,
    fontSize: 12, color: ORANGE_LIGHT, valign: "middle",
  });
});

// 플로우 다이어그램
const flowY = 6.6;
const flowItems = ["클릭!", "높은순 ↑", "클릭!", "낮은순 ↓", "클릭!", "제거됨"];
flowItems.forEach((text, i) => {
  const x = 1.0 + i * 1.85;
  const isAction = i % 2 === 0;

  slide.addShape(pptx.ShapeType.roundRect, {
    x, y: flowY, w: 1.5, h: 0.45,
    fill: { color: isAction ? "1A1200" : CARD_BG },
    line: { color: isAction ? ORANGE : BORDER, width: 1 },
    rectRadius: 0.2,
  });
  slide.addText(text, {
    x, y: flowY, w: 1.5, h: 0.45,
    fontSize: 11, color: isAction ? ORANGE : GRAY2, bold: true, align: "center",
  });

  if (i < flowItems.length - 1) {
    slide.addText("→", {
      x: x + 1.5, y: flowY, w: 0.35, h: 0.45,
      fontSize: 14, color: GRAY3, align: "center",
    });
  }
});

// =====================================================
// 슬라이드 4: 실전 데모 (정렬 전)
// =====================================================
slide = pptx.addSlide(masterOpts);
addFooter(slide);
addSlideNumber(slide, 4, TOTAL);

slide.addText("실전 데모", {
  x: 0.8, y: 0.3, w: 5, h: 0.3,
  fontSize: 11, color: ORANGE, bold: true,
});

slide.addText("이렇게 동작합니다", {
  x: 0.8, y: 0.6, w: 10, h: 0.7,
  fontSize: 28, color: WHITE, bold: true,
});

// --- 정렬 전 테이블 ---
slide.addText("정렬 전 (기본 상태)", {
  x: 0.8, y: 1.5, w: 5, h: 0.35,
  fontSize: 14, color: GRAY2, bold: true,
});

slide.addText("정렬: 없음 (검색 관련성 순)", {
  x: 0.8, y: 1.9, w: 5, h: 0.3,
  fontSize: 10, color: GRAY3,
});

const tableHeaderOpts = {
  fill: { color: "111827" },
  color: GRAY3, fontSize: 10, bold: true, align: "center", valign: "middle",
};
const tableCellOpts = { color: GRAY2, fontSize: 11, align: "center", valign: "middle" };
const tableCellBold = { color: GRAY1, fontSize: 11, bold: true, align: "center", valign: "middle" };

// 정렬 전 테이블
slide.addTable(
  [
    [
      { text: "영상", options: { ...tableHeaderOpts, align: "left" } },
      { text: "조회수 ↕", options: tableHeaderOpts },
      { text: "구독자 ↕", options: tableHeaderOpts },
      { text: "성과도", options: tableHeaderOpts },
    ],
    [
      { text: "먹방 브이로그", options: { ...tableCellOpts, align: "left" } },
      { text: "50만", options: tableCellBold },
      { text: "30만", options: tableCellOpts },
      { text: "보통", options: tableCellOpts },
    ],
    [
      { text: "ASMR 치킨", options: { ...tableCellOpts, align: "left" } },
      { text: "200만", options: tableCellBold },
      { text: "100만", options: tableCellOpts },
      { text: "좋음", options: tableCellOpts },
    ],
    [
      { text: "길거리 음식", options: { ...tableCellOpts, align: "left" } },
      { text: "10만", options: tableCellBold },
      { text: "5만", options: tableCellOpts },
      { text: "매우좋음", options: tableCellOpts },
    ],
  ],
  {
    x: 0.8, y: 2.3, w: 5.0,
    border: { type: "solid", color: BORDER, pt: 0.5 },
    colW: [1.8, 1.0, 1.0, 1.2],
    rowH: [0.35, 0.35, 0.35, 0.35],
    fill: { color: CARD_BG },
  }
);

// --- 다중 정렬 후 테이블 ---
slide.addText("① 조회수 클릭 → ② 구독자 클릭 (다중 정렬!)", {
  x: 6.5, y: 1.5, w: 6, h: 0.35,
  fontSize: 14, color: ORANGE_LIGHT, bold: true,
});

// 정렬 태그
slide.addShape(pptx.ShapeType.roundRect, {
  x: 7.5, y: 1.9, w: 1.4, h: 0.32,
  fill: { color: "1A1200" }, line: { color: ORANGE, width: 0.5 },
  rectRadius: 0.15,
});
slide.addText("1  조회수 ↑", {
  x: 7.5, y: 1.9, w: 1.4, h: 0.32,
  fontSize: 9, color: ORANGE_LIGHT, bold: true, align: "center",
});
slide.addShape(pptx.ShapeType.roundRect, {
  x: 9.1, y: 1.9, w: 1.4, h: 0.32,
  fill: { color: "1A1200" }, line: { color: ORANGE, width: 0.5 },
  rectRadius: 0.15,
});
slide.addText("2  구독자 ↑", {
  x: 9.1, y: 1.9, w: 1.4, h: 0.32,
  fontSize: 9, color: ORANGE_LIGHT, bold: true, align: "center",
});

slide.addText("정렬:", {
  x: 6.5, y: 1.9, w: 1, h: 0.32,
  fontSize: 10, color: GRAY3,
});

// 다중 정렬 후 테이블
const hlOpts = { color: "111111" };
slide.addTable(
  [
    [
      { text: "영상", options: { ...tableHeaderOpts, align: "left" } },
      { text: "조회수 ① ↑", options: { ...tableHeaderOpts, color: ORANGE } },
      { text: "구독자 ② ↑", options: { ...tableHeaderOpts, color: ORANGE } },
      { text: "종합점수", options: { ...tableHeaderOpts, color: ORANGE } },
    ],
    [
      { text: "🥇 ASMR 치킨", options: { ...tableCellOpts, align: "left", bold: true, color: WHITE } },
      { text: "200만", options: { ...tableCellBold } },
      { text: "100만", options: { ...tableCellOpts, color: GRAY1 } },
      { text: "2.0점", options: { ...tableCellBold, color: "10B981" } },
    ],
    [
      { text: "🥈 먹방 브이로그", options: { ...tableCellOpts, align: "left" } },
      { text: "50만", options: tableCellBold },
      { text: "30만", options: tableCellOpts },
      { text: "1.0점", options: { ...tableCellBold, color: "F59E0B" } },
    ],
    [
      { text: "🥉 길거리 음식", options: { ...tableCellOpts, align: "left" } },
      { text: "10만", options: tableCellBold },
      { text: "5만", options: tableCellOpts },
      { text: "0.0점", options: { ...tableCellBold, color: "EF4444" } },
    ],
  ],
  {
    x: 6.5, y: 2.3, w: 5.8,
    border: { type: "solid", color: BORDER, pt: 0.5 },
    colW: [1.8, 1.2, 1.2, 1.2],
    rowH: [0.35, 0.4, 0.4, 0.4],
    fill: { color: CARD_BG },
  }
);

// 핵심 포인트
slide.addShape(pptx.ShapeType.roundRect, {
  x: 0.8, y: 5.5, w: 11.7, h: 1.2,
  fill: { color: "0D1117" }, line: { color: "1F3A5F", width: 1 },
  rectRadius: 0.12,
});

slide.addText(
  [
    { text: "ℹ️  핵심 포인트\n", options: { fontSize: 13, bold: true, color: "60A5FA" } },
    { text: "숫자 ①②는 \"클릭한 순서\"이지 \"우선순위\"가 아닙니다!\n", options: { fontSize: 12, bold: true, color: GRAY1 } },
    { text: "두 기준이 동등한 비중으로 합산되어 종합 랭킹이 만들어집니다.", options: { fontSize: 12, color: GRAY2 } },
  ],
  { x: 1.1, y: 5.6, w: 11.2, h: 1.0, lineSpacingMultiple: 1.4 }
);

// =====================================================
// 슬라이드 5: 단일 vs 다중 정렬
// =====================================================
slide = pptx.addSlide(masterOpts);
addFooter(slide);
addSlideNumber(slide, 5, TOTAL);

slide.addText("원리 이해", {
  x: 0.8, y: 0.3, w: 5, h: 0.3,
  fontSize: 11, color: ORANGE, bold: true,
});

slide.addText("단일 정렬과 다중 정렬은 다르게 동작해요", {
  x: 0.8, y: 0.6, w: 11, h: 0.7,
  fontSize: 28, color: WHITE, bold: true,
});

// 단일 정렬 박스
slide.addShape(pptx.ShapeType.roundRect, {
  x: 0.8, y: 1.8, w: 5.2, h: 2.5,
  fill: { color: CARD_BG }, line: { color: "1F3A5F", width: 1 },
  rectRadius: 0.15,
});
slide.addText("기준 1개", {
  x: 1.1, y: 1.95, w: 1.2, h: 0.3,
  fontSize: 10, color: "3B82F6", bold: true,
});
slide.addText("단일 정렬", {
  x: 1.1, y: 2.3, w: 4, h: 0.4,
  fontSize: 20, color: GRAY1, bold: true,
});
slide.addText(
  "해당 값을 기준으로\n직접 크기 비교하여 정렬\n\n예: 조회수 ↑\n200만 → 50만 → 10만",
  {
    x: 1.1, y: 2.8, w: 4.5, h: 1.3,
    fontSize: 13, color: GRAY2, lineSpacingMultiple: 1.4,
  }
);

// VS
slide.addText("≠", {
  x: 6.0, y: 2.6, w: 0.8, h: 0.8,
  fontSize: 32, color: GRAY3, align: "center", bold: true,
});

// 다중 정렬 박스
slide.addShape(pptx.ShapeType.roundRect, {
  x: 6.8, y: 1.8, w: 5.5, h: 2.5,
  fill: { color: CARD_BG }, line: { color: ORANGE, width: 1 },
  rectRadius: 0.15,
});
slide.addText("기준 2개+", {
  x: 7.1, y: 1.95, w: 1.5, h: 0.3,
  fontSize: 10, color: ORANGE, bold: true,
});
slide.addText("다중 정렬 (종합 점수)", {
  x: 7.1, y: 2.3, w: 5, h: 0.4,
  fontSize: 20, color: GRAY1, bold: true,
});
slide.addText(
  "각 기준의 값을 0~1로 변환 후\n합산한 종합 점수로 정렬\n\n예: 조회수↑ + 구독자↑\n점수 2.0 → 1.0 → 0.0",
  {
    x: 7.1, y: 2.8, w: 4.8, h: 1.3,
    fontSize: 13, color: GRAY2, lineSpacingMultiple: 1.4,
  }
);

// 오해 vs 실제 비교
slide.addShape(pptx.ShapeType.roundRect, {
  x: 0.8, y: 4.8, w: 5.2, h: 1.8,
  fill: { color: CARD_BG }, line: { color: "EF4444", width: 1 },
  rectRadius: 0.15,
});
slide.addText("이것이 아닙니다 ✕", {
  x: 1.1, y: 4.95, w: 3, h: 0.3,
  fontSize: 10, color: "EF4444", bold: true,
});
slide.addText(
  "일반적인 다중 정렬\n\n조회수로 먼저 정렬하고,\n조회수가 같을 때만 구독자로 정렬",
  {
    x: 1.1, y: 5.3, w: 4.5, h: 1.1,
    fontSize: 12, color: GRAY2, lineSpacingMultiple: 1.3,
  }
);

slide.addText("→", {
  x: 6.0, y: 5.3, w: 0.8, h: 0.8,
  fontSize: 28, color: GRAY3, align: "center",
});

slide.addShape(pptx.ShapeType.roundRect, {
  x: 6.8, y: 4.8, w: 5.5, h: 1.8,
  fill: { color: CARD_BG }, line: { color: "10B981", width: 1 },
  rectRadius: 0.15,
});
slide.addText("CreatorLens 방식 ✓", {
  x: 7.1, y: 4.95, w: 3, h: 0.3,
  fontSize: 10, color: "10B981", bold: true,
});
slide.addText(
  "종합 랭킹 정렬\n\n조회수와 구독자를 모두 고려해\n종합적으로 뛰어난 영상을 위로",
  {
    x: 7.1, y: 5.3, w: 4.8, h: 1.1,
    fontSize: 12, color: GRAY2, lineSpacingMultiple: 1.3,
  }
);

// =====================================================
// 슬라이드 6: 종합 점수 계산법
// =====================================================
slide = pptx.addSlide(masterOpts);
addFooter(slide);
addSlideNumber(slide, 6, TOTAL);

slide.addText("계산 원리", {
  x: 0.8, y: 0.3, w: 5, h: 0.3,
  fontSize: 11, color: ORANGE, bold: true,
});

slide.addText("종합 점수는 이렇게 계산됩니다", {
  x: 0.8, y: 0.6, w: 11, h: 0.7,
  fontSize: 28, color: WHITE, bold: true,
});

// 비유 박스
slide.addShape(pptx.ShapeType.roundRect, {
  x: 0.8, y: 1.5, w: 11.7, h: 1.0,
  fill: { color: "0D1710" }, line: { color: "1F5F3A", width: 1 },
  rectRadius: 0.12,
});
slide.addText(
  [
    { text: "🎓  비유: 학교 성적표\n", options: { fontSize: 12, bold: true, color: "10B981" } },
    { text: "국어 95점, 수학 80점 → 만점이 다르면 그냥 합산하면 안 됨 → 모든 과목을 0~1 사이로 맞춘 다음 합산! CreatorLens도 같은 원리.", options: { fontSize: 11, color: GRAY2 } },
  ],
  { x: 1.1, y: 1.55, w: 11.2, h: 0.9, lineSpacingMultiple: 1.4 }
);

// Step 1
slide.addText(
  [
    { text: "Step 1.  ", options: { color: ORANGE, bold: true, fontSize: 13 } },
    { text: "원래 값 확인", options: { color: GRAY1, bold: true, fontSize: 13 } },
  ],
  { x: 0.8, y: 2.8, w: 5, h: 0.35 }
);

slide.addText(
  "영상A: 조회수 100만  구독자 50만\n영상B: 조회수  50만  구독자 30만\n영상C: 조회수  10만  구독자 10만",
  {
    x: 0.8, y: 3.2, w: 5.5, h: 0.9,
    fontSize: 11, color: GRAY2, fontFace: "Courier New", lineSpacingMultiple: 1.3,
  }
);

// Step 2
slide.addText(
  [
    { text: "Step 2.  ", options: { color: ORANGE, bold: true, fontSize: 13 } },
    { text: "0~1 사이로 변환 (정규화)", options: { color: GRAY1, bold: true, fontSize: 13 } },
  ],
  { x: 0.8, y: 4.3, w: 8, h: 0.35 }
);

slide.addText("공식:  (내 값 - 최솟값) / (최댓값 - 최솟값)", {
  x: 0.8, y: 4.7, w: 8, h: 0.3,
  fontSize: 10, color: GRAY3, fontFace: "Courier New",
});

slide.addText(
  "영상A: 조회수 → 1.0   구독자 → 1.0\n영상B: 조회수 → 0.44  구독자 → 0.50\n영상C: 조회수 → 0.0   구독자 → 0.0",
  {
    x: 0.8, y: 5.1, w: 5.5, h: 0.9,
    fontSize: 11, color: ORANGE_LIGHT, fontFace: "Courier New", lineSpacingMultiple: 1.3,
  }
);

// Step 3
slide.addText(
  [
    { text: "Step 3.  ", options: { color: ORANGE, bold: true, fontSize: 13 } },
    { text: "합산 → 종합 점수!", options: { color: GRAY1, bold: true, fontSize: 13 } },
  ],
  { x: 6.8, y: 2.8, w: 5, h: 0.35 }
);

// 결과 박스
slide.addShape(pptx.ShapeType.roundRect, {
  x: 6.8, y: 3.3, w: 5.5, h: 2.0,
  fill: { color: "111111" }, line: { color: BORDER, width: 0.5 },
  rectRadius: 0.12,
});

slide.addText(
  [
    { text: "영상A:  1.0 + 1.0 = ", options: { fontSize: 14, color: GRAY2 } },
    { text: "2.0점 🥇\n", options: { fontSize: 14, color: "10B981", bold: true } },
    { text: "\n", options: { fontSize: 6 } },
    { text: "영상B:  0.44 + 0.50 = ", options: { fontSize: 14, color: GRAY2 } },
    { text: "0.94점 🥈\n", options: { fontSize: 14, color: "F59E0B", bold: true } },
    { text: "\n", options: { fontSize: 6 } },
    { text: "영상C:  0.0 + 0.0 = ", options: { fontSize: 14, color: GRAY2 } },
    { text: "0.0점 🥉", options: { fontSize: 14, color: "EF4444", bold: true } },
  ],
  { x: 7.1, y: 3.5, w: 5.0, h: 1.6, lineSpacingMultiple: 1.3 }
);

// 참고 박스
slide.addShape(pptx.ShapeType.roundRect, {
  x: 6.8, y: 5.6, w: 5.5, h: 0.8,
  fill: { color: "171207" }, line: { color: "5F4A1F", width: 1 },
  rectRadius: 0.1,
});
slide.addText(
  [
    { text: "⚠️  ", options: { fontSize: 11 } },
    { text: "↓(낮은순)은 점수가 뒤집힘", options: { fontSize: 11, bold: true, color: "F59E0B" } },
    { text: "\n구독자↓ → 구독자가 적을수록 높은 점수 (소규모 채널 찾기용)", options: { fontSize: 10, color: GRAY2 } },
  ],
  { x: 7.0, y: 5.65, w: 5.1, h: 0.7, lineSpacingMultiple: 1.3 }
);

// =====================================================
// 슬라이드 7: 실전 활용 시나리오
// =====================================================
slide = pptx.addSlide(masterOpts);
addFooter(slide);
addSlideNumber(slide, 7, TOTAL);

slide.addText("실전 활용", {
  x: 0.8, y: 0.3, w: 5, h: 0.3,
  fontSize: 11, color: ORANGE, bold: true,
});

slide.addText("이런 상황에서 다중 정렬을 쓰세요", {
  x: 0.8, y: 0.6, w: 11, h: 0.7,
  fontSize: 28, color: WHITE, bold: true,
});

const usecases = [
  {
    icon: "🔥", title: "터진 영상 찾기",
    combo: "기여도 ↑ + 성과도 ↑",
    desc: "구독자 대비 조회수가 폭발적이고\n참여율도 높은 영상을 찾습니다",
    borderColor: "EF4444",
  },
  {
    icon: "🌱", title: "소규모 채널 대박 영상",
    combo: "조회수 ↑ + 구독자 ↓",
    desc: "조회수는 높지만 구독자는 적은\n블루오션 키워드 발굴용",
    borderColor: "10B981",
  },
  {
    icon: "📈", title: "대형 채널 벤치마킹",
    combo: "구독자 ↑ + 성과도 ↑",
    desc: "구독자도 많고 성과도도 높은\nTOP 크리에이터 콘텐츠 분석",
    borderColor: "3B82F6",
  },
  {
    icon: "🎯", title: "노출 가능성 높은 영상",
    combo: "노출확률 ↑ + 조회수 ↑",
    desc: "내가 진입했을 때 노출될 확률이\n높으면서 시장도 큰 키워드",
    borderColor: "A855F7",
  },
];

usecases.forEach((uc, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.8 + col * 6.0;
  const y = 1.7 + row * 2.7;

  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w: 5.7, h: 2.3,
    fill: { color: CARD_BG }, line: { color: uc.borderColor, width: 1 },
    rectRadius: 0.15,
  });

  slide.addText(uc.icon, {
    x: x + 0.25, y: y + 0.2, w: 0.5, h: 0.5,
    fontSize: 28,
  });

  slide.addText(uc.title, {
    x: x + 0.9, y: y + 0.25, w: 4, h: 0.35,
    fontSize: 17, color: GRAY1, bold: true,
  });

  // 조합 태그
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x + 0.25, y: y + 0.85, w: 5.2, h: 0.35,
    fill: { color: "111111" }, rectRadius: 0.08,
  });
  slide.addText("조합:  " + uc.combo, {
    x: x + 0.4, y: y + 0.85, w: 4.8, h: 0.35,
    fontSize: 12, color: ORANGE_LIGHT, bold: true,
  });

  slide.addText(uc.desc, {
    x: x + 0.3, y: y + 1.4, w: 5.1, h: 0.8,
    fontSize: 12, color: GRAY2, lineSpacingMultiple: 1.4,
  });
});

// =====================================================
// 슬라이드 8: 꿀팁 & FAQ
// =====================================================
slide = pptx.addSlide(masterOpts);
addFooter(slide);
addSlideNumber(slide, 8, TOTAL);

slide.addText("꿀팁 & FAQ", {
  x: 0.8, y: 0.3, w: 5, h: 0.3,
  fontSize: 11, color: ORANGE, bold: true,
});

slide.addText("알아두면 좋은 꿀팁", {
  x: 0.8, y: 0.6, w: 10, h: 0.7,
  fontSize: 28, color: WHITE, bold: true,
});

// 꿀팁 카드
const tips = [
  { icon: "✅", title: "정렬 상태 자동 저장", desc: "다른 페이지 갔다 와도\n정렬 상태가 그대로 유지" },
  { icon: "♾️", title: "무한 스크롤 + 정렬 유지", desc: "새 영상이 로드되어도\n정렬 기준이 사라지지 않음" },
  { icon: "🏷️", title: "태그로 한눈에 확인", desc: "테이블 위 태그 바에서\n현재 정렬 기준 즉시 확인" },
  { icon: "✕", title: "개별 제거 가능", desc: "태그의 x 버튼으로\n특정 기준만 제거 가능" },
];

tips.forEach((tip, i) => {
  const x = 0.8 + i * 3.0;
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y: 1.6, w: 2.75, h: 1.5,
    fill: { color: CARD_BG }, line: { color: BORDER, width: 0.5 },
    rectRadius: 0.12,
  });
  slide.addText(tip.icon, { x: x + 0.2, y: 1.75, w: 0.4, h: 0.4, fontSize: 18 });
  slide.addText(tip.title, { x: x + 0.2, y: 2.15, w: 2.3, h: 0.3, fontSize: 12, color: GRAY1, bold: true });
  slide.addText(tip.desc, { x: x + 0.2, y: 2.5, w: 2.3, h: 0.5, fontSize: 10, color: GRAY2, lineSpacingMultiple: 1.3 });
});

// FAQ
slide.addText("자주 묻는 질문", {
  x: 0.8, y: 3.5, w: 5, h: 0.4,
  fontSize: 16, color: GRAY1, bold: true,
});

const faqs = [
  { q: "숫자 ①②가 우선순위인가요?", a: "아닙니다. 클릭한 순서를 표시할 뿐, 모든 기준은 동등한 비중으로 합산됩니다." },
  { q: "기준을 몇 개까지 추가할 수 있나요?", a: "7가지 모두 가능하지만, 2~3개가 가장 실용적입니다." },
  { q: "정렬 없으면 어떤 순서인가요?", a: "YouTube API가 제공하는 검색 관련성 순서로 표시됩니다." },
  { q: "종합 점수가 동점이면?", a: "종합 점수가 같은 영상끼리는 최신 게시일 순서로 정렬됩니다." },
];

faqs.forEach((faq, i) => {
  const y = 4.1 + i * 0.85;
  slide.addText(
    [
      { text: `Q. ${faq.q}\n`, options: { fontSize: 12, bold: true, color: GRAY1 } },
      { text: faq.a, options: { fontSize: 11, color: GRAY2 } },
    ],
    {
      x: 0.8, y, w: 11.5, h: 0.75,
      lineSpacingMultiple: 1.3,
    }
  );
  if (i < faqs.length - 1) {
    slide.addShape(pptx.ShapeType.line, {
      x: 0.8, y: y + 0.78, w: 11.5, h: 0,
      line: { color: "1A1A1A", width: 0.5 },
    });
  }
});

// ===== 파일 저장 =====
const outPath = "docs/CreatorLens_다중정렬_사용설명서.pptx";
await pptx.writeFile({ fileName: outPath });
console.log(`PPTX 생성 완료: ${outPath}`);
