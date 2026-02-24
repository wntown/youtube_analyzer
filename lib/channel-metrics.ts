// 채널 분석 지표 계산 함수
// CreatorLens 스타일의 채널 성과 분석

// 등급 타입 (5단계)
export type ChannelGrade = 'great' | 'good' | 'normal' | 'bad' | 'worst';

export interface ChannelScoreResult {
  grade: ChannelGrade;
  label: string;
  dots: number; // 1~5 점 표시
  value: number;
}

// 등급별 설정
const gradeMap: Record<ChannelGrade, { label: string; dots: number }> = {
  great: { label: 'Great', dots: 5 },
  good: { label: 'Good', dots: 4 },
  normal: { label: 'Normal', dots: 3 },
  bad: { label: 'Bad', dots: 2 },
  worst: { label: 'Worst', dots: 1 },
};

function makeResult(grade: ChannelGrade, value: number): ChannelScoreResult {
  return { grade, ...gradeMap[grade], value };
}

// 1. 조회수대비 구독전환
// 전체 조회수 대비 구독자 비율 → 얼마나 효율적으로 구독을 유도하는지
// subscriberCount / viewCount * 100 (%)
export function calcViewToSubConversion(
  subscriberCount: number,
  viewCount: number
): ChannelScoreResult {
  if (viewCount <= 0) return makeResult('normal', 0);

  const ratio = (subscriberCount / viewCount) * 100;

  if (ratio >= 1) return makeResult('great', ratio);
  if (ratio >= 0.5) return makeResult('good', ratio);
  if (ratio >= 0.1) return makeResult('normal', ratio);
  if (ratio >= 0.01) return makeResult('bad', ratio);
  return makeResult('worst', ratio);
}

// 2. 일평균 구독전환
// 채널 개설일부터 오늘까지 하루 평균 구독자 증가 수
export function calcDailySubGrowth(
  subscriberCount: number,
  publishedAt: string
): ChannelScoreResult {
  const daysSinceCreation = Math.max(
    1,
    (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const dailyGrowth = subscriberCount / daysSinceCreation;

  if (dailyGrowth >= 500) return makeResult('great', dailyGrowth);
  if (dailyGrowth >= 50) return makeResult('good', dailyGrowth);
  if (dailyGrowth >= 5) return makeResult('normal', dailyGrowth);
  if (dailyGrowth >= 0.5) return makeResult('bad', dailyGrowth);
  return makeResult('worst', dailyGrowth);
}

// 3. 영상성과
// 영상 1개당 평균 조회수 / 구독자 수 → 영상이 구독자 대비 얼마나 잘 나가는지
export function calcVideoPerformance(
  viewCount: number,
  videoCount: number,
  subscriberCount: number
): ChannelScoreResult {
  if (videoCount <= 0 || subscriberCount <= 0) return makeResult('normal', 0);

  const avgViewsPerVideo = viewCount / videoCount;
  const ratio = avgViewsPerVideo / subscriberCount;

  if (ratio >= 3) return makeResult('great', ratio);
  if (ratio >= 1) return makeResult('good', ratio);
  if (ratio >= 0.3) return makeResult('normal', ratio);
  if (ratio >= 0.1) return makeResult('bad', ratio);
  return makeResult('worst', ratio);
}

// 4. 성장속도
// 일평균 구독전환(40%) + 조회수대비 구독전환(30%) + 영상 생산성(30%) 종합 점수
export function calcGrowthSpeed(
  subscriberCount: number,
  viewCount: number,
  videoCount: number,
  publishedAt: string
): ChannelScoreResult {
  const daysSinceCreation = Math.max(
    1,
    (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // 일평균 구독 점수 (0~100) - 500명/일 이상이면 만점
  const dailyGrowth = subscriberCount / daysSinceCreation;
  const dailyScore = Math.min((dailyGrowth / 500) * 100, 100);

  // 조회수→구독 전환 점수 (0~100) - 1% 이상이면 만점
  const conversionRate = viewCount > 0 ? (subscriberCount / viewCount) * 100 : 0;
  const conversionScore = Math.min((conversionRate / 1) * 100, 100);

  // 영상 생산성 점수 (0~100) - 일평균 0.5개 이상이면 만점
  const videosPerDay = videoCount / daysSinceCreation;
  const productivityScore = Math.min((videosPerDay / 0.5) * 100, 100);

  const total = dailyScore * 0.4 + conversionScore * 0.3 + productivityScore * 0.3;

  if (total >= 75) return makeResult('great', total);
  if (total >= 50) return makeResult('good', total);
  if (total >= 25) return makeResult('normal', total);
  if (total >= 10) return makeResult('bad', total);
  return makeResult('worst', total);
}
