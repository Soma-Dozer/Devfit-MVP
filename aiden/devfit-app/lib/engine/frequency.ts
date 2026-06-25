import type { AimCard, Category, FrequencyItem } from "./types";
import { CATEGORY_LABEL, topicsFor } from "./topics";
import { selfCheckPrompt, discriminatorNote } from "./selfcheck";

/**
 * 빈출(frequency) 모델 — 취준생 "빈출 질문 대비" (고도화 신규 메커니즘 #2).
 *
 * 이것은 federated calibration(idea.md §9-4)의 *소비자용 표면*이다.
 * 면접관=라벨러로 쌓이는 "어떤 코드 영역이 실제 면접에서 캐물렸나" 통계를,
 * 취준생에게는 "빈출도(이 영역이 면접에서 캐물릴 확률)"로 환류한다.
 *
 * 중요(정직성·법적 헌법):
 *  - MVP 단계에는 실측 라벨이 거의 없으므로 아래 SEED를 부트스트랩 사전확률로 쓴다.
 *    fromRealLabels=false로 표시하고 "추정치"임을 UI에 드러낸다(과장 금지).
 *  - 실측 라벨이 k-익명성 게이트를 통과하면 그 값으로 대체된다(labels.ts 설계와 정합).
 *  - 빈출도는 "영역"의 확률이지 사람 점수가 아니다(retrieval, not score).
 *  - 취준생에게는 Layer 2 추궁 원문·채점 신호를 절대 노출하지 않는다(self-check만).
 */

/**
 * 카테고리별 면접 빈출 사전확률(시드). [0,1].
 * "이 영역의 작업 흔적이 있을 때, 면접관이 그것을 캐물을 확률"의 부트스트랩 추정.
 * 근거: question-dilemma의 prep-resistant 우선순위 + 일반적 기술면접 관찰(시드).
 */
const SEED_FREQUENCY: Record<Category, number> = {
  troubleshooting: 0.86,
  data: 0.79,
  perf: 0.73,
  concurrency: 0.68,
  structure: 0.61,
  refactor: 0.54,
  test: 0.42,
  feature: 0.4,
  revert: 0.34,
  chore: 0.12,
};

/** 실측 라벨(있을 때) 주입용 — 외부에서 패턴별 변별률/빈출을 넘겨받아 시드를 덮는다. */
export interface RealLabelStat {
  pattern: Category;
  /** k-익명성 통과 시 [0,1] 빈출/변별률, 미달이면 null. */
  value: number | null;
  nLabels: number;
  nOrgs: number;
}

/** 빈출도 합성: 실측이 게이트를 통과했으면 실측, 아니면 시드(추정치). */
function resolveFrequency(
  cat: Category,
  real?: RealLabelStat,
): { frequency: number; fromRealLabels: boolean; basisNote: string } {
  if (real && real.value !== null) {
    return {
      frequency: real.value,
      fromRealLabels: true,
      basisNote: `실측 면접관 라벨 ${real.nLabels}건(조직 ${real.nOrgs}곳) 기반 — k-익명성 통과`,
    };
  }
  return {
    frequency: SEED_FREQUENCY[cat],
    fromRealLabels: false,
    basisNote: "부트스트랩 추정치 — 실측 면접관 라벨이 쌓이면 정확해집니다(federated calibration)",
  };
}

/**
 * 분석 카드 → 취준생 빈출 항목(빈도순). self-check + 준비 주제만 노출.
 * realStats가 주어지면 해당 패턴은 실측 빈출도로 대체된다.
 */
export function buildFrequencyItems(
  cards: AimCard[],
  realStats?: Map<Category, RealLabelStat>,
): FrequencyItem[] {
  const items: FrequencyItem[] = cards.map((card) => {
    const real = realStats?.get(card.category);
    const { frequency, fromRealLabels, basisNote } = resolveFrequency(card.category, real);
    return {
      category: card.category,
      label: CATEGORY_LABEL[card.category],
      repoFullName: card.repoFullName,
      frequency,
      frequencyPct: Math.round(frequency * 100),
      fromRealLabels,
      basisNote,
      prepTopics: topicsFor(card.category),
      selfCheckPrompt: selfCheckPrompt(card.category, card.area),
      discriminatorNote: discriminatorNote(card.category),
      area: card.area,
      evidenceFile: card.changedFile ?? card.files[0],
      evidenceCommits: card.evidenceCommits,
    };
  });
  // 빈출도 높은 순(같으면 캐물림 농도 순서 유지).
  items.sort((a, b) => b.frequency - a.frequency);
  return items;
}
