import type { Category, PrepTopic } from "./types";

/**
 * 준비 주제(Layer 1) — 카테고리별 "설명할 줄 알아야 하는 주제".
 *
 * 주의(question-dilemma §4-1): 개별 질문 문장이 아니라 *주제(topic)*로 추상화한다.
 * 토씨 그대로의 적중을 막고, 노출돼도 위조 불가능한 "이해 영역"만 가리킨다.
 * 취준생 뷰(빈출 질문 대비)가 이 주제를 빈도순으로 보여준다.
 */

export const CATEGORY_LABEL: Record<Category, string> = {
  troubleshooting: "트러블슈팅",
  perf: "성능 최적화",
  refactor: "리팩토링",
  structure: "구조/아키텍처",
  concurrency: "동시성",
  data: "데이터/쿼리",
  revert: "되돌림(revert)",
  test: "테스트",
  feature: "기능 구현",
  chore: "기타",
};

const TOPICS: Record<Category, string[]> = {
  troubleshooting: [
    "버그 재현 절차 — 어떤 입력/상태에서 터졌는지 말로 재현하기",
    "근본 원인 vs 증상 — 무엇을 고쳤고 무엇을 덮었는지 구분",
    "회귀 방지 — 같은 버그가 다시 안 나게 무엇을 했는지",
  ],
  perf: [
    "병목 측정 방법 — 프로파일링/로깅/벤치마크 중 무엇을 썼는지",
    "개선 전후 수치 — 정량 근거(레이턴시·메모리·쿼리 수)",
    "트레이드오프 — 빨라진 대가로 무엇을 포기했는지",
  ],
  refactor: [
    "변경 동기 — 무엇이 아팠고 무엇을 해결하려 했는지",
    "기각된 대안 — 고려했다 버린 설계와 그 이유",
    "안전성 — 동작을 깨지 않았다는 근거(테스트/단계적 적용)",
  ],
  structure: [
    "경계 기준 — 무엇을 기준으로 모듈/계층을 나눴는지",
    "의존 방향 — 어느 쪽이 어느 쪽을 알아야 하는지",
    "확장 시나리오 — 기능이 늘면 이 구조가 어떻게 버티는지",
  ],
  concurrency: [
    "경합 지점 — 정확히 어디서 동시 접근이 문제였는지",
    "정확성 보장 — 락/큐/원자성 중 무엇으로 보장했는지",
    "장애 시나리오 — 동기화를 빼면 무슨 일이 나는지",
  ],
  data: [
    "설계 의도 — 이 스키마/쿼리를 택한 이유",
    "성능 특성 — 인덱스/조인/N+1을 어떻게 다뤘는지",
    "스케일 — 데이터가 10배일 때의 변화",
  ],
  revert: [
    "되돌린 이유 — 처음 접근이 왜 실패했는지",
    "재시도 차이 — 다시 갈 때 무엇을 바꿨는지",
  ],
  test: [
    "테스트 의도 — 어떤 회귀/버그를 막는 테스트인지",
    "커버 못 한 영역 — 일부러 안 짠 부분과 이유",
  ],
  feature: [
    "핵심 흐름 — 이 기능의 데이터/제어 흐름 설명",
    "엣지 케이스 — 가장 까다로웠던 예외 처리",
  ],
  chore: ["변경 내용 — 실제로 무엇을 왜 바꿨는지"],
};

/** 카테고리의 준비 주제. */
export function topicsFor(category: Category): string[] {
  return TOPICS[category] ?? TOPICS.chore;
}

/** 등장한 카테고리들에 대한 준비 주제 묶음(중복 제거). */
export function buildPrepTopics(presentCategories: Category[]): PrepTopic[] {
  const seen = new Set<Category>();
  const out: PrepTopic[] = [];
  for (const cat of presentCategories) {
    if (seen.has(cat)) continue;
    seen.add(cat);
    out.push({ category: cat, label: CATEGORY_LABEL[cat], topics: topicsFor(cat) });
  }
  return out;
}
