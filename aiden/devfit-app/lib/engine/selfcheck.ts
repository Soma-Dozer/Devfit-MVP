import type { Category } from "./types";

/**
 * Self-check 프롬프트 — 카테고리별, **코드 영역 기반**(커밋이 아니라 코드/설계를 설명).
 *
 * 가드레일(question-dilemma §7): "답안집"이 아니라 "설명해보세요" self-check다.
 * 취준생에게는 Layer 1(영역 주제) + self-check만 노출하고, 면접관 전용 Layer 2
 * 추궁·채점 기준·diff는 B2C에 가지 않는다. 노출이 곧 학습이 되어 변별력을 죽이지 않는다.
 */

const SELF_CHECK: Record<Category, (area: string) => string> = {
  troubleshooting: (a) =>
    `\`${a}\`에서 겪었던 문제를 하나 골라, 무엇이 어떻게 터졌고(재현) 원인이 무엇이었으며 어떻게 고쳤는지 스스로 설명해보세요.`,
  perf: (a) =>
    `\`${a}\`에서 성능을 신경 쓴 부분은 어디인가요? 무엇으로 측정했고, 데이터/트래픽이 커지면 어디가 먼저 무너질지 설명해보세요.`,
  refactor: (a) =>
    `\`${a}\`를 지금 다시 짠다면 무엇을 바꾸겠어요? 당시 고려했다 버린 구조와 그 이유를 설명해보세요.`,
  structure: (a) =>
    `\`${a}\`의 모듈/계층 경계를 나눈 기준은 무엇인가요? 다르게 그었다면 무엇이 달라졌을지 설명해보세요.`,
  concurrency: (a) =>
    `\`${a}\`에서 동시 접근/경합이 문제될 수 있는 지점은 어디고, 어떻게 정확성을 보장했는지 설명해보세요.`,
  data: (a) =>
    `\`${a}\`의 데이터 모델/쿼리를 이렇게 설계한 이유는? 데이터가 10배가 되면 어떻게 바뀌어야 할지 설명해보세요.`,
  revert: (a) =>
    `\`${a}\`에서 되돌리거나 갈아엎은 결정이 있나요? 처음 접근이 왜 실패했고 다시 갈 때 무엇을 바꿨는지 설명해보세요.`,
  test: (a) =>
    `\`${a}\`의 테스트는 어떤 버그/회귀를 막나요? 일부러 커버하지 않은 영역과 이유를 설명해보세요.`,
  feature: (a) =>
    `\`${a}\` 기능에서 가장 까다로웠던 엣지 케이스는 무엇이었고 어떻게 처리했는지 설명해보세요.`,
  chore: (a) =>
    `\`${a}\`에서 최근 정리/설정 변경한 것은 무엇이고 왜 필요했는지 설명해보세요.`,
};

const NOTES: Record<Category, string> = {
  troubleshooting: "면접관은 여기서 '버그를 재현할 수 있는 사람'과 '메시지만 외운 사람'을 가릅니다.",
  perf: "면접관은 '측정한 사람'과 '빨라졌다고 말만 하는 사람'을 가릅니다.",
  refactor: "면접관은 '버린 대안을 말할 수 있는 사람'과 '정리했다고만 하는 사람'을 가릅니다.",
  structure: "면접관은 '경계를 왜 그었는지 아는 사람'과 '폴더만 나눈 사람'을 가릅니다.",
  concurrency: "면접관은 '락을 빼면 무슨 일이 나는지 아는 사람'과 '붙여둔 사람'을 가릅니다.",
  data: "면접관은 '데이터가 커졌을 때를 아는 사람'과 '동작만 시킨 사람'을 가릅니다.",
  revert: "면접관은 '왜 되돌렸는지 아는 사람'과 '히스토리만 깨끗한 사람'을 가릅니다.",
  test: "면접관은 '이 테스트가 무엇을 막는지 아는 사람'과 '커버리지만 채운 사람'을 가릅니다.",
  feature: "면접관은 '엣지 케이스를 다뤄본 사람'과 '해피 패스만 짠 사람'을 가릅니다.",
  chore: "면접관은 사소해 보이는 변경에서도 '왜 했는지' 아는지를 봅니다.",
};

export function selfCheckPrompt(category: Category, area: string): string {
  return SELF_CHECK[category](area);
}

export function discriminatorNote(category: Category): string {
  return NOTES[category];
}

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
