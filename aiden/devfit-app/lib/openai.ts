import OpenAI from "openai";
import { CommitInfo, InterviewQuestion, RepoMeta } from "./types";

// ──────────────────────────────────────────────────────────────
// DevFit — 실제 GitHub 커밋/diff를 근거로 면접 검증 질문을 생성한다.
// 핵심 설계: 커밋을 3개씩 배치로 나눠 Promise.all로 병렬 fan-out.
// ──────────────────────────────────────────────────────────────

const MODEL = "gpt-4o-mini";
const BATCH_SIZE = 3;
const DIFF_CHAR_CAP = 5000;
const MAX_QUESTIONS = 18;
const MAX_TECH_STACK = 12;

/** 배치 단위 모델 호출 결과 (느슨한 타입, 이후 검증/정제). */
interface RawBatchResult {
  questions?: unknown;
  techStack?: unknown;
}

const SYSTEM_PROMPT = [
  "당신은 시니어 기술 면접관입니다. 지원자가 자신이 작성했다고 주장하는 코드를",
  "실제로 이해하고 작성했는지(= AI가 대신 작성한 것이 아닌지) 검증하는 질문을 만듭니다.",
  "",
  "반드시 제공된 실제 diff에만 근거해 질문을 만드세요. diff에 없는 내용을 지어내지 마세요.",
  "모든 질문은 특정 커밋(shortSha)과 파일을 참조해야 합니다.",
  "",
  "질문은 3개 레이어를 섞어서 만듭니다:",
  "- Layer 1 (공유 가능): 주제/개념 질문, 워밍업. 지원자가 미리 준비해도 무방. 예: '왜 Zustand를 선택했나요?'",
  "- Layer 2 (면접관 전용, 위조 불가능): 준비로 막을 수 없는 추궁. 다음 카테고리를 사용:",
  "    '버그 고고학'(이 커밋이 고친 버그는 무엇이고 어떻게 재현하나),",
  "    '반사실'(트래픽이 10배라면 등 가정 뒤집기),",
  "    '라인 의존성'(이 라인을 지우거나 조건을 뒤집으면 어떻게 되나),",
  "    '기각된 대안'(고려했다가 버린 방법),",
  "    '검증 함정'(코드에 없는 사실을 일부러 단정 → 진짜 저자라면 정정함),",
  "    '기술 선택'(왜 이 접근).",
  "- Layer 3 (라이브): 즉석 과제. 예: '이 함수에 이 요구사항을 지금 추가해보세요'.",
  "",
  "전체 질문의 절반 이상은 Layer 2의 위조 불가능 카테고리여야 합니다.",
  "",
  "출력은 반드시 다음 JSON 형식만 따르세요(다른 텍스트 금지):",
  "{",
  '  "questions": [',
  "    {",
  '      "layer": 1 | 2 | 3,',
  '      "category": "버그 고고학 등 카테고리",',
  '      "question": "지원자에게 던질 질문",',
  '      "rationale": "이 질문이 무엇을 검증하는가 (면접관용)",',
  '      "goodAnswer": "채점 신호: 진짜 저자의 답에 담길 내용",',
  '      "evidence": "commit a1f9c2 · path/to/file.ts"',
  "    }",
  "  ],",
  '  "techStack": ["diff/메시지에서 추론한 기술 스택 문자열"]',
  "}",
].join("\n");

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function buildBatchUserPrompt(commits: CommitInfo[]): string {
  const sections = commits.map((c, idx) => {
    const diff = (c.diff || "").slice(0, DIFF_CHAR_CAP);
    return [
      `### 커밋 ${idx + 1}`,
      `repo: ${c.repoFullName}`,
      `shortSha: ${c.shortSha}`,
      `message: ${c.message}`,
      "diff (핵심 신호, 잘렸을 수 있음):",
      "```diff",
      diff,
      "```",
    ].join("\n");
  });

  return [
    "다음은 한 지원자의 실제 커밋과 diff입니다. 이 diff들에만 근거해",
    "검증 질문을 생성하세요. 각 질문의 evidence에는 반드시 해당 커밋의",
    "shortSha와 diff에 등장한 실제 파일 경로를 적으세요.",
    "또한 diff/메시지에서 추론되는 기술 스택을 techStack 배열로 함께 반환하세요.",
    "",
    sections.join("\n\n"),
  ].join("\n");
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function asString(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return fallback;
}

function clampLayer(v: unknown): 1 | 2 | 3 {
  const n = typeof v === "number" ? v : parseInt(asString(v), 10);
  if (n <= 1) return 1;
  if (n >= 3) return 3;
  return 2;
}

/** 모델이 돌려준 raw 질문 1건을 InterviewQuestion으로 정제. 불량이면 null. */
function coerceQuestion(raw: unknown): InterviewQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!isNonEmptyString(r.question)) return null;
  return {
    layer: clampLayer(r.layer),
    category: asString(r.category, "기술 선택"),
    question: asString(r.question),
    rationale: asString(r.rationale),
    goodAnswer: asString(r.goodAnswer),
    evidence: asString(r.evidence),
  };
}

function dedupeStrings(values: string[], cap: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (!isNonEmptyString(v)) continue;
    const key = v.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v.trim());
    if (out.length >= cap) break;
  }
  return out;
}

/**
 * 질문들을 Layer 2 우선으로 균형 있게 추려 cap개로 제한.
 * Layer 2 → Layer 1 → Layer 3 순으로 채우되 라운드로빈으로 다양성 유지.
 */
function balanceQuestions(
  questions: InterviewQuestion[],
  cap: number
): InterviewQuestion[] {
  if (questions.length <= cap) return questions;

  const byLayer: Record<1 | 2 | 3, InterviewQuestion[]> = { 1: [], 2: [], 3: [] };
  for (const q of questions) byLayer[q.layer].push(q);

  const out: InterviewQuestion[] = [];
  // Layer 2가 최소 절반을 차지하도록 먼저 확보.
  const layer2Target = Math.min(byLayer[2].length, Math.ceil(cap / 2));
  out.push(...byLayer[2].slice(0, layer2Target));

  // 나머지는 1 → 3 → 남은 2 순으로 채움.
  const rest = [
    ...byLayer[1],
    ...byLayer[3],
    ...byLayer[2].slice(layer2Target),
  ];
  for (const q of rest) {
    if (out.length >= cap) break;
    out.push(q);
  }
  return out.slice(0, cap);
}

export async function generateQuestions(
  repos: RepoMeta[],
  commits: CommitInfo[]
): Promise<{ techStack: string[]; questions: InterviewQuestion[] }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
  }

  // 레포 언어에서 기본 기술 스택 추출.
  const repoLanguages = repos
    .map((r) => r.language)
    .filter((l): l is string => isNonEmptyString(l));

  // 커밋이 없으면 모델 호출 없이 레포 언어만 반환.
  if (commits.length === 0) {
    return {
      techStack: dedupeStrings(repoLanguages, MAX_TECH_STACK),
      questions: [],
    };
  }

  const client = new OpenAI({ apiKey });
  const batches = chunk(commits, BATCH_SIZE);

  // 각 배치를 병렬로 호출. 실패한 배치는 에러를 담아 격리.
  const settled = await Promise.all(
    batches.map(async (batch): Promise<{ data: RawBatchResult | null; error: unknown }> => {
      try {
        const completion = await client.chat.completions.create({
          model: MODEL,
          temperature: 0.4,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildBatchUserPrompt(batch) },
          ],
        });
        const content = completion.choices[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(content) as RawBatchResult;
        return { data: parsed, error: null };
      } catch (error) {
        return { data: null, error };
      }
    })
  );

  const succeeded = settled.filter((s) => s.data !== null);

  // 모든 배치가 실패하면 마지막 에러를 throw.
  if (succeeded.length === 0) {
    const lastError = settled[settled.length - 1]?.error;
    throw lastError instanceof Error
      ? lastError
      : new Error("모든 배치 분석에 실패했습니다.");
  }

  // 질문 평탄화 + 정제.
  const rawQuestions: unknown[] = [];
  const inferredTech: string[] = [];
  for (const s of succeeded) {
    const data = s.data as RawBatchResult;
    if (Array.isArray(data.questions)) rawQuestions.push(...data.questions);
    if (Array.isArray(data.techStack)) {
      for (const t of data.techStack) inferredTech.push(asString(t));
    }
  }

  const cleaned = rawQuestions
    .map(coerceQuestion)
    .filter((q): q is InterviewQuestion => q !== null);

  const questions = balanceQuestions(cleaned, MAX_QUESTIONS);

  const techStack = dedupeStrings(
    [...repoLanguages, ...inferredTech],
    MAX_TECH_STACK
  );

  return { techStack, questions };
}
