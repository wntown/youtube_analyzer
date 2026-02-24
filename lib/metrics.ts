// 기여도/성과도 계산 함수
// CreatorLens 스타일의 영상 분석 지표를 계산합니다

// 등급 타입 정의
export type ScoreGrade = 'very-good' | 'good' | 'normal' | 'bad';

export interface ScoreResult {
  grade: ScoreGrade;
  label: string;
  value: number;
}

// 기여도 계산: 영상 조회수 / 구독자 수 비율
// - 3배 이상 = Very Good
// - 1배 이상 = Good
// - 0.3배 이상 = Normal
// - 그 미만 = Bad
export function calcContribution(viewCount: number, subscriberCount: number): ScoreResult {
  if (subscriberCount <= 0) {
    return { grade: 'normal', label: 'Normal', value: 0 };
  }

  const ratio = viewCount / subscriberCount;

  if (ratio >= 3) return { grade: 'very-good', label: 'Very Good', value: ratio };
  if (ratio >= 1) return { grade: 'good', label: 'Good', value: ratio };
  if (ratio >= 0.3) return { grade: 'normal', label: 'Normal', value: ratio };
  return { grade: 'bad', label: 'Bad', value: ratio };
}

// 성과도 계산: 참여율(40%) + 조회수/구독자비율(40%) + 절대조회수(20%) 복합 점수
// 최종 점수를 0~100으로 정규화
export function calcPerformance(
  viewCount: number,
  likeCount: number,
  commentCount: number,
  subscriberCount: number
): ScoreResult {
  // 참여율 점수 (0~100) - 참여율 5% 이상이면 만점
  const engagementRate = viewCount > 0 ? ((likeCount + commentCount) / viewCount) * 100 : 0;
  const engagementScore = Math.min(engagementRate / 5 * 100, 100);

  // 조회수/구독자 비율 점수 (0~100) - 3배 이상이면 만점
  const ratio = subscriberCount > 0 ? viewCount / subscriberCount : 0;
  const ratioScore = Math.min(ratio / 3 * 100, 100);

  // 절대 조회수 점수 (0~100) - 100만 이상이면 만점
  const absScore = Math.min(viewCount / 1_000_000 * 100, 100);

  // 가중 평균
  const totalScore = engagementScore * 0.4 + ratioScore * 0.4 + absScore * 0.2;

  if (totalScore >= 75) return { grade: 'very-good', label: 'Very Good', value: totalScore };
  if (totalScore >= 50) return { grade: 'good', label: 'Good', value: totalScore };
  if (totalScore >= 25) return { grade: 'normal', label: 'Normal', value: totalScore };
  return { grade: 'bad', label: 'Bad', value: totalScore };
}

// 노출확률 계산 (반전 로직)
// "이 영상 자리를 내가 빼앗을 수 있는 확률"
// 경쟁자가 약할수록 (구독자 적고, 참여율 낮고, 채널 작을수록) 노출확률이 높음
export interface ExposureResult {
  percent: number;       // 0~100 확률값
  grade: ScoreGrade;
  label: string;
}

export function calcExposure(params: {
  title: string;
  query: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  subscriberCount: number;
  publishedAt: string;
  channelVideoCount?: number;
}): ExposureResult {
  const { title, query, viewCount, likeCount, commentCount, subscriberCount, publishedAt, channelVideoCount = 0 } = params;

  // 1. 키워드 일치도 (25%) - 제목에 검색어가 있으면 이 자리를 노리기 좋음
  const titleLower = title.toLowerCase();
  const queryLower = query.toLowerCase().trim();
  let keywordScore = 0;
  if (queryLower && titleLower.includes(queryLower)) {
    keywordScore = 100;
  } else if (queryLower) {
    const words = queryLower.split(/\s+/);
    const matched = words.filter((w) => titleLower.includes(w)).length;
    keywordScore = words.length > 0 ? (matched / words.length) * 70 : 0;
  }

  // 2. 채널 약점 (30%) - 구독자가 적을수록 내가 이길 수 있음 (반전!)
  // 구독자 1000 이하 = 100점, 100만 이상 = 0점
  let weaknessScore = 0;
  if (subscriberCount <= 1_000) weaknessScore = 100;
  else if (subscriberCount <= 10_000) weaknessScore = 80;
  else if (subscriberCount <= 100_000) weaknessScore = 50;
  else if (subscriberCount <= 1_000_000) weaknessScore = 20;
  else weaknessScore = 5;

  // 3. 참여율 약점 (20%) - 참여율이 낮으면 시청자 만족도가 낮은 영상 = 기회
  const engagementRate = viewCount > 0 ? ((likeCount + commentCount) / viewCount) * 100 : 0;
  const engagementWeakness = Math.max(0, 100 - Math.min(engagementRate / 5 * 100, 100));

  // 4. 채널 경험 부족 (15%) - 영상 수가 적은 채널일수록 기회
  let experienceScore = 0;
  if (channelVideoCount <= 50) experienceScore = 100;
  else if (channelVideoCount <= 200) experienceScore = 70;
  else if (channelVideoCount <= 500) experienceScore = 40;
  else experienceScore = 10;

  // 5. 영상 노후도 (10%) - 오래된 영상일수록 새 영상으로 대체 가능
  const daysSincePublish = Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24));
  let ageScore = 0;
  if (daysSincePublish >= 365) ageScore = 100;
  else if (daysSincePublish >= 180) ageScore = 70;
  else if (daysSincePublish >= 90) ageScore = 50;
  else if (daysSincePublish >= 30) ageScore = 30;
  else ageScore = 10;

  // 가중 합산
  const total = keywordScore * 0.25
    + weaknessScore * 0.30
    + engagementWeakness * 0.20
    + experienceScore * 0.15
    + ageScore * 0.10;

  const percent = Math.round(Math.min(Math.max(total, 0), 100));

  let grade: ScoreGrade;
  let label: string;
  if (percent >= 75) { grade = 'very-good'; label = '매우높음'; }
  else if (percent >= 50) { grade = 'good'; label = '높음'; }
  else if (percent >= 25) { grade = 'normal'; label = '보통'; }
  else { grade = 'bad'; label = '낮음'; }

  return { percent, grade, label };
}

// 핫 비디오 판정
// 기여도 Good 이상 (영상이 터지고 있음) + 노출확률 50% 이상 (내가 진입 가능)
export function isHotVideo(params: {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  subscriberCount: number;
  publishedAt: string;
  channelVideoCount: number;
  title: string;
  query: string;
}): boolean {
  const contribution = calcContribution(params.viewCount, params.subscriberCount);
  const exposure = calcExposure(params);

  // 기여도 Good 이상 = 터지고 있음
  const isTrending = contribution.grade === 'very-good' || contribution.grade === 'good';
  // 노출확률 40% 이상 = 진입 가능
  const hasOpportunity = exposure.percent >= 40;

  return isTrending && hasOpportunity;
}
