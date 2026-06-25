import type {
  AimCard,
  Category,
  IntentId,
  IntentPreset,
  InterviewerQuestion,
  QuestionType,
} from "./types";

/**
 * 의도축(Intent) — 면접관 질문 성향 커스텀.
 *
 * 질문의 주체는 **코드 영역/설계**다("이 커밋 왜?"가 아니라 "이 모듈을 왜 이렇게?").
 * 커밋·파일·diff는 질문에 첨부되는 *근거(계기)* 일 뿐 질문의 주어가 아니다.
 *
 *  - killer(킬러)       : 떨어뜨리는 결정적 추궁(설계 결정·반사실·약점 자각).
 *  - fundamentals(기본기): 이 영역에서 쓴 언어/문법/자료구조를 이해하고 썼는가.
 *  - cs(CS개념)         : 영역의 구현을 OS·DB·복잡도·설계원칙으로 설명.
 *  - all(전체)          : 세 결을 고루.
 */

export const INTENT_PRESETS: IntentPreset[] = [
  { id: "killer", label: "킬러", tagline: "떨어뜨리는 결정적 추궁",
    description: "설계 결정·반사실·자기 코드 약점 자각을 캐묻습니다. 외운 사람과 직접 만든 사람을 가장 강하게 가릅니다." },
  { id: "fundamentals", label: "기본 문법", tagline: "쓴 문법을 이해했는가",
    description: "이 영역에서 실제 사용한 언어 기능·자료구조·표준 API를 이해하고 골랐는지 확인합니다." },
  { id: "cs", label: "CS 개념", tagline: "구현 뒤의 CS 원리",
    description: "영역의 구현을 OS·DB·자료구조·복잡도·설계 원칙으로 끌어올려 묻습니다." },
  { id: "all", label: "전체 균형", tagline: "세 결을 고루",
    description: "킬러·기본기·CS를 영역마다 고루 섞습니다." },
];

export function intentPreset(id: IntentId): IntentPreset {
  return INTENT_PRESETS.find((p) => p.id === id) ?? INTENT_PRESETS[3];
}

interface Tmpl {
  type: QuestionType;
  layer: "L1" | "L2" | "L3";
  q: (area: string, lang: string) => string;
  scoringTrue: string;
  scoringFake: string;
  csTopic?: string;
}

// ── 킬러: 영역당 2가지 각도(준비 내성) ──
const KILLER: Record<Category, Tmpl[]> = {
  troubleshooting: [
    { type: "bug_archaeology", layer: "L2",
      q: (a) => `\`${a}\`에서 겪었던 버그/장애를 하나 골라, 무엇이 문제였고 어떻게 재현되며 근본 원인이 무엇이었는지 설명해보세요.`,
      scoringTrue: "재현 입력·상태(어떤 값/순서/환경에서 터지는지)를 구체적으로 대고 · 근본 원인과 겉 증상을 구분하며 · 회귀 방지 수단(추가한 테스트·가드·검증)을 댄다.",
      scoringFake: "'에러 나서 고쳤다'·'어디선가 났다' 수준에 머물고, 재현 조건이나 근본 원인을 못 대거나 증상만 덮었다." },
    { type: "verification_trap", layer: "L2",
      q: (a) => `\`${a}\`는 동일 입력에 항상 같은 결과를 보장하나요? (그렇지 않다면 어디서 깨지는지) — 단정 섞어 묻고 정정을 본다.`,
      scoringTrue: "결과가 입력 외 요인(시간·랜덤·외부 상태·동시성)에 의존하는 지점을 짚고 · 잘못된 단정을 '그건 보장 안 된다'고 정정한다.",
      scoringFake: "'항상 같다'는 단정을 그대로 받아들이거나, 비결정 요인(시계·캐시·경합)을 인지하지 못한다." },
  ],
  perf: [
    { type: "counterfactual", layer: "L2",
      q: (a) => `\`${a}\`에서 성능을 신경 쓴 부분은 어디인가요? 무엇으로 측정했고, 트래픽/데이터가 10배면 어디가 먼저 무너지나요?`,
      scoringTrue: "측정 지표(p95 레이턴시·쿼리 수·메모리·처리량)와 실제 값 · 복잡도 변화 · 10배 시 먼저 무너질 지점(쿼리/락/메모리)과 다음 병목을 댄다.",
      scoringFake: "'빨라졌다'만 말하고 측정 지표·수치가 없으며, 확장 시 한계나 다음 병목을 못 짚는다." },
    { type: "rejected_alt", layer: "L2",
      q: (a) => `\`${a}\`의 성능 접근에서 더 단순한/다른 방법을 두고 이 방식을 택한 이유는? 버린 대안의 단점은?`,
      scoringTrue: "고려한 대안(캐싱·배치·인덱스·알고리즘 교체 등)과 각자의 비용/한계를 대고 · 이 방식을 택한 트레이드오프를 설명한다.",
      scoringFake: "다른 접근을 떠올리지 못하거나, 트레이드오프 없이 '이게 제일 빠르다'고만 한다." },
  ],
  refactor: [
    { type: "rejected_alt", layer: "L2",
      q: (a) => `\`${a}\`를 지금 다시 설계한다면 무엇을 바꾸겠어요? 당시 고려했다 버린 구조와 그 이유는?`,
      scoringTrue: "당시 버린 구조(다른 패턴·경계·라이브러리)와 버린 이유 · 지금이라면 바꿀 점과 그 근거(결합도·테스트 용이성)를 댄다.",
      scoringFake: "'그냥 더 깔끔해서'에 그치고 버린 대안이나 바꿀 점을 구체적으로 못 댄다." },
    { type: "pr_reviewer", layer: "L2",
      q: (a) => `\`${a}\`를 리뷰어가 본다면 가장 먼저 지적할 곳은 어디고, 왜인가요?`,
      scoringTrue: "약한 곳(긴 함수·누수된 추상화·테스트 공백·모호한 네이밍)을 스스로 지목하고 · 왜 위험한지 코드와 연결한다.",
      scoringFake: "'약점 없다'고 하거나 코드 품질 문제를 코드와 연결해 지목하지 못한다." },
  ],
  structure: [
    { type: "counterfactual", layer: "L2",
      q: (a) => `\`${a}\`의 모듈/계층 경계를 이렇게 그은 기준은 무엇이고, 다르게 그었다면 무엇이 깨지나요?`,
      scoringTrue: "의존 방향과 경계 기준(도메인/계층/책임)을 대고 · 다르게 그었을 때 깨지는 것(순환참조·변경 파급)을 추론한다.",
      scoringFake: "'폴더만 나눴다' 수준으로 경계 기준을 못 대고, 대안의 결과를 추론하지 못한다." },
    { type: "rejected_alt", layer: "L2",
      q: (a) => `\`${a}\`가 새 요구사항으로 커지면 어디가 가장 먼저 아파오나요? 지금 구조의 약한 고리는?`,
      scoringTrue: "확장 시 먼저 아파올 지점(변경 파급·순환참조·god 모듈)과 약한 고리를 구체적으로 짚는다.",
      scoringFake: "막연히 '괜찮다/유연하다'고만 하고 약한 고리를 못 짚는다." },
  ],
  concurrency: [
    { type: "line_dependency", layer: "L2",
      q: (a) => `\`${a}\`에서 동시 접근/경합이 문제될 수 있는 지점은 어디고, 어떻게 정확성을 보장하나요? 그 동기화를 빼면 무슨 일이 나나요?`,
      scoringTrue: "경합 지점(공유 상태·체크-후-사용)과 깨지는 시나리오를 대고 · 보장 수단(락 범위·원자성·큐)과 그것을 빼면 생길 race/중복/유실을 설명한다.",
      scoringFake: "'동시성 문제가 난다'는 일반론에 머물고, 어디서·어떻게 깨지는지 라인/상태 수준으로 못 짚는다." },
    { type: "counterfactual", layer: "L2",
      q: (a) => `\`${a}\`가 단일 인스턴스에서 여러 인스턴스로 늘면 이 동시성 처리는 어떻게 바뀌어야 하나요?`,
      scoringTrue: "여러 인스턴스로 늘 때 깨지는 가정(인메모리 상태·로컬 락)을 짚고 · 분산 락·멱등성·외부 상태 저장 등 대응을 댄다.",
      scoringFake: "단일 프로세스 가정을 벗어나지 못하고 '그대로 된다'고 한다." },
  ],
  data: [
    { type: "counterfactual", layer: "L2",
      q: (a) => `\`${a}\`의 데이터 모델/쿼리에서 데이터가 10배가 되면 어디가 먼저 무너지고 무엇을 바꾸겠어요?`,
      scoringTrue: "N+1·풀스캔·락 경합 중 먼저 무너질 지점을 짚고 · 인덱스(종류)·쿼리 재작성·페이지네이션·캐시 등 대응을 댄다.",
      scoringFake: "'잘 된다'에 그치고 인덱스·N+1·트랜잭션 등 스케일 병목을 못 댄다." },
    { type: "rejected_alt", layer: "L2",
      q: (a) => `\`${a}\`의 스키마/저장 방식에서 정규화/역정규화·다른 저장소를 두고 이걸 택한 이유는?`,
      scoringTrue: "정규화/역정규화 · 다른 저장소(RDB/KV/검색엔진)의 트레이드오프를 대고 · 이 선택의 근거(일관성·조회 패턴)를 설명한다.",
      scoringFake: "선택 이유를 못 대거나 트레이드오프 없이 '익숙해서'라고만 한다." },
  ],
  revert: [
    { type: "bug_archaeology", layer: "L2",
      q: (a) => `\`${a}\`에서 되돌리거나 갈아엎은 결정이 있나요? 처음 접근은 왜 실패했고, 다시 갈 때 무엇을 바꿨나요?`,
      scoringTrue: "처음 접근의 실패 비용(성능·복잡도·버그)과 비가역적 부분을 구분하고 · 다시 갈 때 바꾼 점을 댄다.",
      scoringFake: "되돌린 이유나 처음 접근의 문제를 기억/설명하지 못한다." },
    { type: "pr_reviewer", layer: "L2",
      q: (a) => `\`${a}\`의 그 결정을 사전에 막을 수 있었다면 어떤 신호를 봤어야 했나요?`,
      scoringTrue: "사전에 봤어야 할 신호(벤치마크·부하 테스트·리뷰 지적·타입/테스트)를 구체적으로 대고 무엇을 놓쳤는지 인정한다.",
      scoringFake: "교훈을 '다음엔 잘하겠다' 식 일반론으로만 말한다." },
  ],
  test: [
    { type: "pr_reviewer", layer: "L2",
      q: (a) => `\`${a}\`의 테스트는 어떤 회귀/버그를 막나요? 일부러 커버하지 않은 영역과 그 이유는?`,
      scoringTrue: "이 테스트가 막는 회귀(구체 버그/계약)와 · 일부러 안 짠 영역·그 이유 · 커버 못 한 입력 공간을 댄다.",
      scoringFake: "'커버리지 채우려고 짰다'에 그치고 무엇을 막는지·무엇이 빠졌는지 못 댄다." },
    { type: "counterfactual", layer: "L2",
      q: (a) => `\`${a}\`에서 가장 깨지기 쉬운(flaky) 테스트는 무엇이고 왜 그런가요?`,
      scoringTrue: "flaky 원인(시간·순서 의존·외부 의존·동시성)을 지목하고 · 격리/모킹/고정으로 안정화할 방법을 댄다.",
      scoringFake: "테스트가 가끔 깨지는 원인을 모르거나 신뢰성 문제를 의식하지 못한다." },
  ],
  feature: [
    { type: "pr_reviewer", layer: "L2",
      q: (a) => `\`${a}\` 기능에서 가장 까다로운 엣지 케이스는 무엇이고 어떻게 처리했나요? 리뷰어라면 어디를 지적할까요?`,
      scoringTrue: "빈/경계 입력(0·최대·null)·동시 요청·실패/타임아웃·재시도·권한 없는 접근 중 *실제로 처리한 것*을 짚고 · 처리 안 한 것을 약점으로 인정한다.",
      scoringFake: "해피 패스만 설명하고 빈 입력·실패 경로·권한 같은 엣지를 떠올리지 못한다." },
    { type: "counterfactual", layer: "L2",
      q: (a) => `\`${a}\` 기능의 요구사항이 하나 추가된다면(예: 동시 사용·국제화·권한) 지금 설계의 어디를 고쳐야 하나요?`,
      scoringTrue: "추가 요구(동시 사용·국제화/시간대·권한·대용량)에 따라 고쳐야 할 지점(자료구조·경계·스키마)을 구체적으로 짚는다.",
      scoringFake: "현재 구현에만 매여 무엇을 바꿔야 할지 못 댄다." },
  ],
  chore: [
    { type: "verification_trap", layer: "L2",
      q: (a) => `\`${a}\`에서 최근 정리/설정 변경한 것은 무엇이고 왜 필요했나요? 그게 없으면 무엇이 깨지나요?`,
      scoringTrue: "변경 내용과 영향 범위(빌드·의존성·다른 모듈)·왜 지금 필요했는지·없으면 깨지는 것을 댄다.",
      scoringFake: "'정리했다'에 그치고 이유나 영향 범위를 못 댄다." },
  ],
};

// ── 기본 문법: 영역에서 쓴 언어 기능 이해 ──
function fundamentalsFor(cat: Category): Tmpl[] {
  const base: Tmpl = {
    type: "syntax_understanding", layer: "L2",
    q: (a, lang) =>
      `\`${a}\`에서 사용한 ${lang} 핵심 문법·표준 라이브러리·자료구조 중, 직접 설명할 수 있는 것과 '되니까 쓴' 것을 구분해보세요. 가장 핵심이 된 언어 기능과 그 선택 이유는?`,
    scoringTrue: "사용한 문법/표준 API의 의미·동작과 대안 문법과의 차이를 대고 · 자료구조면 시간복잡도까지 · 왜 그걸 골랐는지 설명한다.",
    scoringFake: "동작 결과만 알고 문법의 의미·대안·비용을 못 댄다(복붙 신호).",
  };
  const extra: Partial<Record<Category, Tmpl>> = {
    data: { type: "syntax_understanding", layer: "L2",
      q: (a) => `\`${a}\`의 쿼리/스키마에서 쓴 자료형·제약조건·조인/집계 표현을 설명하고, 다르게 쓰면 결과가 어떻게 달라지는지 말해보세요.`,
      scoringTrue: "쓴 자료형·제약조건·조인/집계의 의미를 대고 · 다르게 쓰면 결과·성능이 어떻게 달라지는지 설명한다.",
      scoringFake: "쿼리가 '돈다'만 알고 자료형·제약·조인 표현의 의미를 못 댄다." },
    concurrency: { type: "syntax_understanding", layer: "L2",
      q: (a, lang) => `\`${a}\`에서 쓴 ${lang}의 동시성 문법(async/await·lock·channel 등)의 문법적 의미와 실행 시 동작을 설명해보세요.`,
      scoringTrue: "async/await·lock·channel의 문법적 의미와 실행 모델(이벤트 루프·블로킹·스케줄링)을 정확히 설명한다.",
      scoringFake: "'비동기로 만든다' 정도에 그치고 실행 시 동작을 설명 못 한다." },
    feature: { type: "syntax_understanding", layer: "L2",
      q: (a, lang) => `\`${a}\`를 떠받치는 ${lang} 자료구조/내장 함수의 동작(시간복잡도 포함)을 설명해보세요.`,
      scoringTrue: "쓴 자료구조/내장 함수의 내부 동작과 시간복잡도(예: 해시 평균 O(1)·정렬 O(n log n))를 댄다.",
      scoringFake: "이름만 알고 내부 동작·비용(복잡도)을 설명 못 한다." },
  };
  const e = extra[cat];
  return e ? [base, e] : [base];
}

// ── CS 개념: 영역을 CS 기초로 ──
const CS: Record<Category, Tmpl> = {
  concurrency: { type: "cs_concept", layer: "L2", csTopic: "운영체제 · 동시성",
    q: (a) => `\`${a}\`의 동시성 처리를 스레드/스케줄링·임계영역 관점에서 설명해보세요. race condition과 deadlock의 차이, 이 코드가 막는 쪽은?`,
    scoringTrue: "임계영역·상호배제를 정의하고 · race condition(공유 자원 동시 변경)과 deadlock(상호 대기)의 차이를 대며 · 이 코드가 막는 쪽과 방법(락/원자연산)을 연결한다.",
    scoringFake: "race condition과 deadlock을 혼동하거나 임계영역 개념을 코드의 락/공유 상태와 연결 못 한다." },
  data: { type: "cs_concept", layer: "L2", csTopic: "데이터베이스 · 자료구조",
    q: (a) => `\`${a}\`의 쿼리 시간복잡도와 인덱스 자료구조(B-tree/해시)를 설명하고, 정규화/역정규화 트레이드오프가 여기서 어떻게 작용하는지 말해보세요.`,
    scoringTrue: "인덱스가 B-tree(범위 검색)인지 해시(등치)인지와 조회 복잡도를 대고 · 정규화(중복 제거 vs 조인 비용) 트레이드오프를 이 스키마에 연결한다.",
    scoringFake: "'인덱스 걸면 빨라진다' 수준에 그치고 자료구조·복잡도·정규화 트레이드오프를 못 댄다." },
  perf: { type: "cs_concept", layer: "L2", csTopic: "알고리즘 · 복잡도",
    q: (a) => `\`${a}\`의 핵심 연산은 시간/공간 복잡도(Big-O)가 어떻게 되나요? 캐시/메모리 계층(locality)이 성능에 주는 영향은?`,
    scoringTrue: "핵심 연산의 시간/공간 Big-O와 개선 전후 변화를 대고 · 캐시 지역성(locality)·메모리 계층이 실측 성능에 준 영향을 설명한다.",
    scoringFake: "복잡도(Big-O)를 못 따지고 '최적화했다'·'빨라졌다'에 그친다." },
  structure: { type: "cs_concept", layer: "L2", csTopic: "소프트웨어 설계 원칙",
    q: (a) => `\`${a}\`를 결합도/응집도, SOLID 같은 설계 원칙으로 설명해보세요. 이 경계가 지킨 원칙과 양보한 것은?`,
    scoringTrue: "결합도/응집도로 경계를 평가하고 · SRP/의존역전 등 지킨 원칙과 · 이를 위해 양보한 것(보일러플레이트·간접화)을 댄다.",
    scoringFake: "SOLID·결합도 같은 용어를 실제 코드 경계와 연결하지 못한다." },
  troubleshooting: { type: "cs_concept", layer: "L2", csTopic: "디버깅 · 불변식",
    q: (a) => `\`${a}\`에서 유지되어야 할 불변식(invariant)은 무엇인가요? 버그는 어떤 불변식이 깨진 것이고, 수정이 그걸 어떻게 복구하나요?`,
    scoringTrue: "유지돼야 할 불변식(예: 잔액≥0·정렬 유지·단일 소유)을 명시하고 · 버그를 '어떤 불변식이 언제 깨졌나'로 설명하며 · 수정이 그걸 어떻게 복구하는지 댄다.",
    scoringFake: "증상만 말하고 상태/불변식 같은 추상으로 끌어올리지 못한다." },
  refactor: { type: "cs_concept", layer: "L2", csTopic: "추상화 · 응집도",
    q: (a) => `\`${a}\`의 추상화를 응집도/결합도로 정량화해 설명해보세요. 추상화 누수(leaky abstraction)는 어디에 남아 있나요?`,
    scoringTrue: "전후 응집도/결합도 변화를 구체적으로 대고 · 남은 추상화 누수(구현 세부가 인터페이스로 새는 곳)를 지목한다.",
    scoringFake: "'깔끔해졌다'에 그치고 응집도/결합도·누수를 개념으로 설명 못 한다." },
  feature: { type: "cs_concept", layer: "L2", csTopic: "자료구조 · 트레이드오프",
    q: (a) => `\`${a}\`를 떠받치는 핵심 자료구조는 무엇이고, 그 선택의 시간/공간 트레이드오프는?`,
    scoringTrue: "핵심 자료구조(맵·큐·트리 등)와 · 선택의 시간/공간 트레이드오프 · 대안 자료구조와의 차이를 댄다.",
    scoringFake: "어떤 자료구조를 왜 썼는지 의식하지 못한다." },
  test: { type: "cs_concept", layer: "L2", csTopic: "검증 · 동치 분할",
    q: (a) => `\`${a}\`의 테스트를 동치 분할/경계값 관점에서 설명해보세요. 어떤 입력 공간을 대표하도록 골랐나요?`,
    scoringTrue: "입력을 동치 클래스로 나누고 · 경계값(0·최대·경계±1)을 골랐음을 대며 · 대표 못 한 입력 공간(공백)을 인정한다.",
    scoringFake: "케이스가 임의로 보이고 동치 분할·경계값으로 선정 근거를 못 댄다." },
  revert: { type: "cs_concept", layer: "L2", csTopic: "설계 결정 · 가역성",
    q: (a) => `\`${a}\`에서 되돌린 결정을 가역적/비가역적 설계 결정의 관점으로 설명해보세요. 무엇이 비용을 키웠나요?`,
    scoringTrue: "결정이 가역적(되돌리기 쉬움)인지 비가역적인지 구분하고 · 무엇이 전환 비용(데이터 마이그레이션·API 계약)을 키웠는지 댄다.",
    scoringFake: "'그냥 안 됐다'에 그치고 결정의 가역성·비용 구조를 설명 못 한다." },
  chore: { type: "cs_concept", layer: "L2", csTopic: "빌드 · 의존성",
    q: (a) => `\`${a}\`의 설정/빌드 변경을 의존성 그래프 관점에서 설명해보세요. 다른 모듈에 어떤 영향을 주나요?`,
    scoringTrue: "변경이 의존성 그래프/빌드에 주는 파급(버전 충돌·트랜지티브 의존·빌드 시간)과 영향 모듈을 댄다.",
    scoringFake: "변경의 영향 범위를 의식하지 못하고 '설정만 바꿨다'에 그친다." },
};

function templatesFor(intent: IntentId, cat: Category): Tmpl[] {
  if (intent === "killer") return KILLER[cat] ?? [];
  if (intent === "fundamentals") return fundamentalsFor(cat);
  if (intent === "cs") return [CS[cat]];
  // all: 킬러 1 + 기본기 1 + CS 1
  const out: Tmpl[] = [];
  const k = (KILLER[cat] ?? [])[0];
  if (k) out.push(k);
  out.push(fundamentalsFor(cat)[0]);
  out.push(CS[cat]);
  return out;
}

const MAX_Q_PER_CARD = 3;

/** 한 영역(카드) → 선택 의도의 질문들. 커밋은 근거(계기)로만 첨부. */
export function interviewerQuestionsForCard(
  card: AimCard,
  intent: IntentId,
  primaryLanguage: string | null,
): InterviewerQuestion[] {
  const lang = primaryLanguage && primaryLanguage.trim() ? primaryLanguage : "이 언어";
  const tmpls = templatesFor(intent, card.category).slice(0, MAX_Q_PER_CARD);
  return tmpls.map((t, i) => ({
    id: `${card.id}_${intent}_q${i}`,
    cardId: card.id,
    category: card.category,
    repoFullName: card.repoFullName,
    area: card.area,
    intent,
    questionType: t.type,
    layer: t.layer,
    questionText: t.q(card.area, lang),
    scoringTrue: t.scoringTrue,
    scoringFake: t.scoringFake,
    csTopic: t.csTopic,
    evidenceFile: card.changedFile ?? card.files[0],
    evidenceCode: card.changedCode,
    evidenceCommits: card.evidenceCommits,
  }));
}
