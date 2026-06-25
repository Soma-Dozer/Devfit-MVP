/**
 * DevFit — 양면(면접관/취준생) 결정론 엔진 공유 타입.
 *
 * 설계 1원칙(idea.md §9-4, poc-aiming-engine §0):
 *   이 엔진은 "조준(retrieval)이지 점수(score)가 아니다". 사람을 랭킹하지 않는다.
 *   한 후보의 git 히스토리 안에서 "면접관이 캐물을 고신호 영역"만 결정론으로 retrieval 한다.
 *   따라서 아래의 모든 수치는 "영역의 캐물림 농도/빈출도"이지 사람 점수가 아니다.
 *
 * 두 축(고도화 핵심):
 *   - 노출축(Layer 1/2/3): 누가 보는가 → question-dilemma-solution.md.
 *   - 의도축(Intent: 킬러/기본문법/CS개념): 면접관이 *무엇을* 캐물고 싶은가 → 신규.
 *   두 축은 직교한다. 같은 분석 1회 → 페르소나·의도별로 *다르게* 노출(P4 양면).
 */

// ──────────────────────────────────────────────────────────────────────────
// 커밋 카테고리 — 정규식(한/영)으로 결정론 분류 (LLM 0회)
// ──────────────────────────────────────────────────────────────────────────
export type Category =
  | "troubleshooting"
  | "perf"
  | "refactor"
  | "concurrency"
  | "data"
  | "revert"
  | "test"
  | "feature"
  | "structure"
  | "chore"; // wip/update 등 저신호

/** 면접에서 "캐물리는" 고신호 카테고리(coaching 소재가 위조 불가능한 것). */
export const HIGH_SIGNAL_CATEGORIES: Category[] = [
  "troubleshooting",
  "perf",
  "refactor",
  "concurrency",
  "data",
  "structure",
];

/**
 * 카드(캐물 거리)로 만들 수 있는 카테고리 — chore(wip/update 잡음) 제외 전부.
 * 고신호는 우선 정렬되지만, feature/test/revert도 충분히 면접 소재가 된다
 * (특히 신입·주니어 레포는 feature가 대부분 → 이걸 빼면 "신호 빈약"이 과도하게 뜬다).
 */
export const CARD_CATEGORIES: Category[] = [
  "troubleshooting",
  "perf",
  "refactor",
  "concurrency",
  "data",
  "structure",
  "feature",
  "test",
  "revert",
];

/** GitHub에서 받아 엔진이 쓰는 최소 커밋 형태. */
export interface CommitLite {
  sha: string;
  message: string;
  title: string; // 메시지 첫 줄
  date: string; // ISO
  url: string;
  primaryFile?: string; // 대표 변경 파일(있으면, 근거 인용용)
}

/** 엔진이 쓰는 최소 레포 형태(기존 github.ts RepoMeta에서 매핑). */
export interface EngineRepo {
  fullName: string; // owner/repo
  primaryLanguage: string | null;
  htmlUrl: string;
}

/** 코드베이스 파일(경로·크기) — 트리에서. 코드베이스 가중치의 근거. */
export interface RepoFile {
  path: string;
  size: number;
}

/** 한 커밋 diff의 변경 파일. */
export interface DiffFile {
  filename: string;
  churn: number; // additions + deletions
  patch?: string;
}

/** 상위 커밋 diff(엔진 입력) — diff 가중치 + 변경 코드 근거. */
export interface CommitDiffInput {
  sha: string;
  sha7: string;
  message: string;
  url: string;
  churn: number;
  files: DiffFile[];
}

/**
 * 한 영역(카드)의 결정론 가중 신호 — 가중치: 코드베이스 > diff > commit.
 *  - fileCount: 영역의 코드베이스 규모(파일 수)  [최상위 가중]
 *  - churn:     영역에서 실제 변경된 코드량(diff) [중간 가중]
 *  - commitCount: 영역을 건드린 커밋 수(계기)     [최저 가중]
 */
export interface AimSignals {
  fileCount: number;
  churn: number;
  commitCount: number;
}

/** 질문을 grounding 할 실제 커밋 1건(카드 내 근거 커밋). */
export interface GroundCommit {
  sha: string;
  sha7: string;
  message: string; // 제목 줄
  url: string;
}

/**
 * 조준 카드 = "여기를 캐물어라"의 한 단위.
 * 주체는 **코드 영역(모듈/파일)**이고, 커밋은 그 코드를 짜게 된 *계기·근거*로만 붙는다
 * (가중치: 코드베이스 > diff > commit).
 */
export interface AimCard {
  id: string;
  repoFullName: string; // 이 카드가 나온 레포(owner/repo)
  repoUrl: string;
  category: Category;
  /** 사람이 읽는 영역명 (예: "결제 모듈" / "API 라우팅"). */
  area: string;
  /** 영역 경로 (예: "src/payment" / "(루트)"). 코드베이스 근거. */
  areaPath: string;
  /** 영역의 대표 파일 경로들(코드베이스 근거). */
  files: string[];
  /** 영역에서 실제 변경된 코드 스니펫(diff 근거, 있으면). */
  changedCode?: string;
  changedFile?: string;
  /** 이 영역을 건드린 커밋들 — "이 코드를 짜게 된 계기"의 근거(약한 가중). */
  evidenceCommits: GroundCommit[];
  whyProbed: string;
  signals: AimSignals;
  aimDensity: number; // 0..1 "캐물림 농도"(사람 랭킹 아님)
}

/** 카테고리별 준비 주제(Layer 1) — 답이 아니라 "설명할 줄 알아야 하는 주제". */
export interface PrepTopic {
  category: Category;
  label: string;
  topics: string[];
}

// ──────────────────────────────────────────────────────────────────────────
// 의도축(Intent) — 면접관 질문 성향 커스텀 (신규)
// ──────────────────────────────────────────────────────────────────────────
export type IntentId = "killer" | "fundamentals" | "cs" | "all";

/** Layer 2 질문 유형(question-dilemma §4-2 카탈로그). */
export type QuestionType =
  | "counterfactual"
  | "bug_archaeology"
  | "rejected_alt"
  | "line_dependency"
  | "verification_trap"
  | "pr_reviewer"
  | "syntax_understanding" // 기본문법 의도
  | "cs_concept"; // CS개념 의도

/**
 * 면접관에게 보여줄 질문 1개. **코드 영역**에 대한 질문이고, 커밋·파일·diff는
 * 근거(계기)로 첨부된다(질문의 주어가 커밋이 아님).
 */
export interface InterviewerQuestion {
  id: string;
  cardId: string;
  category: Category;
  repoFullName: string; // 이 질문이 나온 레포(멀티레포 표기)
  area: string; // 질문이 향하는 코드 영역
  intent: IntentId; // 이 질문을 만든 의도(킬러/기본문법/CS개념)
  questionType: QuestionType;
  layer: "L1" | "L2" | "L3";
  questionText: string; // 면접관용 원문(B2C 비노출, S)
  scoringTrue: string; // 이 답이 나오면 진짜
  scoringFake: string; // 이 답이 나오면 위조 의심
  csTopic?: string; // CS개념 의도일 때 매핑된 CS 주제
  // ── 근거(계기) ──
  evidenceFile?: string; // 근거 파일(코드베이스/diff)
  evidenceCode?: string; // 근거 diff 스니펫
  evidenceCommits: GroundCommit[]; // 계기 커밋(약한 근거)
}

/** 의도 프리셋 메타(UI 칩). */
export interface IntentPreset {
  id: IntentId;
  label: string; // 한국어 라벨
  tagline: string; // 한 줄 설명
  description: string; // 무엇을 캐무는가
}

// ──────────────────────────────────────────────────────────────────────────
// 빈출(frequency) — 취준생 빈출 질문 대비 (federated calibration의 소비자 표면, 신규)
// ──────────────────────────────────────────────────────────────────────────
export interface FrequencyItem {
  category: Category;
  label: string;
  repoFullName?: string; // 대표 근거 레포
  repoNames?: string[]; // 이 영역이 등장한 레포들(계정 전체 분석 시)
  /** 면접 빈출도 [0,1] — "이 영역이 면접에서 캐물릴 확률". 시드 추정치(부트스트랩). */
  frequency: number;
  /** 표시용 백분율(0..100). */
  frequencyPct: number;
  /** k-익명성 게이트를 통과한 실측 라벨인지(MVP: seed면 false). */
  fromRealLabels: boolean;
  /** 시드/실측 표기 사유. */
  basisNote: string;
  prepTopics: string[]; // 준비할 주제(Layer 1, 답 아님)
  selfCheckPrompt: string; // 스스로 답해보는 프롬프트(영역 기반, 정답집 아님)
  discriminatorNote: string; // "외운 사람과 해본 사람을 가른다" 톤
  area: string; // 대비할 코드 영역
  evidenceFile?: string; // 근거 파일
  evidenceCommits: GroundCommit[]; // 계기 커밋(약한 근거)
}

// ──────────────────────────────────────────────────────────────────────────
// 분석 + 양면 뷰
// ──────────────────────────────────────────────────────────────────────────
export interface AnalysisSummary {
  commitCount: number; // 분석에 쓴(diff 조회한) 커밋 수
  fileCount: number; // 코드베이스 파일 수(코드베이스 규모)
  firstCommitDate: string | null;
  lastCommitDate: string | null;
  spanDays: number | null;
}

export interface Coverage {
  analyzedCommits: number;
  lowSignal: boolean;
  note: string | null;
}

/** 분석에 포함된 레포 1개 요약(멀티레포/계정 분석 표기용). */
export interface AnalyzedRepo {
  fullName: string;
  url: string;
  commitCount: number;
  cardCount: number;
}

// ──────────────────────────────────────────────────────────────────────────
// 상단 분석 리포트 — 지원자 GitHub 전체 + 대표 레포 (결정론 요약)
// ──────────────────────────────────────────────────────────────────────────
/** 지원자 GitHub(계정) 전체 분석 요약. */
export interface AccountReport {
  reposAnalyzed: number;
  languages: string[]; // 빈도순 주 언어
  totalFiles: number; // 코드베이스 규모(파일 수 합)
  topAreas: { category: Category; label: string; count: number }[]; // 카테고리 집계 상위
  headline: string; // 수치 기반 한 줄 요약
}

/** 대표 레포지토리 분석 요약. */
export interface RepoReport {
  fullName: string;
  url: string;
  description: string | null;
  primaryLanguage: string | null;
  fileCount: number;
  stars: number;
  topAreas: { area: string; category: Category; label: string }[]; // 대표 영역 상위
  headline: string;
}

/** 결과 상단에 띄우는 분석 리포트(계정 + 대표 레포). */
export interface GitHubReport {
  account: AccountReport;
  primary: RepoReport;
}

/** 한 URL → 한 번의 결정론 분석(양면 공통 입력). */
export interface Analysis {
  repo: EngineRepo;
  summary: AnalysisSummary;
  cards: AimCard[];
  prepTopics: PrepTopic[];
  coverage: Coverage;
}

/** 면접관 뷰(B2B) — 의도별 질문 + 채점 신호 + 근거(전부 노출). */
export interface InterviewerView {
  persona: "interviewer";
  intent: IntentId;
  repoFullName: string; // 대표 레포(멀티레포 시 첫 번째)
  repoUrl: string;
  primaryLanguage: string | null;
  repos: AnalyzedRepo[]; // 분석에 포함된 레포들
  report: GitHubReport; // 상단 분석 리포트(계정 + 대표 레포)
  summary: AnalysisSummary; // commitCount = 전체 합
  coverage: Coverage;
  questions: InterviewerQuestion[];
}

/** 취준생 뷰(B2C) — 빈출 영역 + self-check(추궁 원문·채점신호 비노출). */
export interface JobseekerView {
  persona: "jobseeker";
  repoFullName: string; // 대표 레포(멀티레포 시 첫 번째)
  repoUrl: string;
  primaryLanguage: string | null;
  repos: AnalyzedRepo[]; // 분석에 포함된 레포들
  report: GitHubReport; // 상단 분석 리포트(계정 + 대표 레포)
  summary: AnalysisSummary; // commitCount = 전체 합
  coverage: Coverage;
  frequencyItems: FrequencyItem[];
  /** federated 환류 메타(빈출도 출처 투명성). */
  labelMeta: { totalSeedLabels: number; kAnonGate: string };
}

export type Persona = "interviewer" | "jobseeker";

// API 계약: POST /api/duo
export interface DuoRequest {
  url: string;
  persona: Persona;
  intent?: IntentId; // 면접관 뷰일 때만
}
export interface DuoResponse {
  ok: boolean;
  interviewer?: InterviewerView;
  jobseeker?: JobseekerView;
  error?: string;
}
