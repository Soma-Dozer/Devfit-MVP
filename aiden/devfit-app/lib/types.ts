// ──────────────────────────────────────────────────────────────
// Shared contract for DevFit MVP. All modules implement against
// these types. Do not change shapes without updating every consumer.
// ──────────────────────────────────────────────────────────────

export type InputKind = "repo" | "profile";

/** Parsed GitHub URL. repo is undefined for a profile URL. */
export interface ParsedInput {
  kind: InputKind;
  owner: string;
  repo?: string;
}

export interface RepoMeta {
  owner: string;
  name: string;
  fullName: string; // "owner/name"
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
  defaultBranch: string; // 트리 조회용 기본 브랜치
}

export interface CommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string; // ISO
  url: string;
  additions: number;
  deletions: number;
  filesChanged: number;
  repoFullName: string; // "owner/name"
  /** Concatenated unified diff (patch) text, truncated for token budget. */
  diff: string;
}

export interface InterviewQuestion {
  layer: 1 | 2 | 3; // 1=공유가능 주제, 2=면접관전용 추궁, 3=라이브
  category: string; // 예: "버그 고고학", "반사실", "라인 의존성", "기술 선택"
  question: string;
  rationale: string; // 이 질문이 무엇을 검증하는가 (면접관용)
  goodAnswer: string; // 채점 신호: 이런 답이 나오면 진짜
  evidence: string; // 근거: "commit a1f9c2 · path/to/file.ts"
}

export interface AnalysisResult {
  input: { kind: InputKind; raw: string };
  repos: RepoMeta[];
  commitsAnalyzed: number;
  techStack: string[];
  questions: InterviewQuestion[];
}

// API contract: POST /api/analyze
export interface AnalyzeRequest {
  url: string;
}
export interface AnalyzeResponse {
  ok: boolean;
  result?: AnalysisResult;
  error?: string;
}
