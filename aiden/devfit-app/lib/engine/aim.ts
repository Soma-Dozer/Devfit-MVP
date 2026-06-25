import type {
  AimCard,
  AimSignals,
  Analysis,
  Category,
  CommitDiffInput,
  EngineRepo,
  GroundCommit,
  RepoFile,
} from "./types";
import { categorize, categorizeByPath } from "./categorize";
import { buildPrepTopics, CATEGORY_LABEL } from "./topics";

/**
 * 결정론 조준 엔진 (LLM 0회) — **코드 영역(모듈/파일) 중심**.
 *
 * 핵심 원칙(사용자 피드백): 실제 면접은 "이 커밋 왜 이렇게 했어요?"가 아니라
 * **코드/기능/설계**를 묻는다. 그래서 분석의 주체는 코드 영역이고, 커밋은 그 코드를
 * 짜게 된 *계기·근거*로만 붙는다. 가중치: **코드베이스 > diff > commit**.
 *  - 코드베이스(0.5): 트리에서 본 영역의 파일 규모 — "무엇을 만든 코드인가".
 *  - diff(0.3): 그 영역에서 실제 변경된 코드량 — "어디를 실제로 손댔나".
 *  - commit(0.2): 영역을 건드린 커밋 수 — "계기"의 약한 근거.
 */

// 분석에서 제외할 경로(빌드 산출물·잠금파일·바이너리 등).
const NOISE_RE =
  /(^|\/)(node_modules|dist|build|out|\.next|\.git|vendor|coverage|target|bin|obj|\.venv|venv|__pycache__|\.idea|\.vscode)(\/|$)|\.(min\.js|min\.css|map|png|jpe?g|gif|svg|ico|webp|woff2?|ttf|eot|pdf|lock|snap)$|(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|poetry\.lock|go\.sum|cargo\.lock|composer\.lock)$/i;

// 코드 파일 확장자(코드베이스 규모 산정용).
const CODE_EXT_RE =
  /\.(ts|tsx|js|jsx|mjs|cjs|py|go|java|kt|kts|rb|rs|c|cc|cpp|cxx|h|hpp|cs|php|swift|scala|vue|svelte|sql|sh|bash|gradle|ex|exs|dart|m|mm|lua|r|jl|clj|hs|ml|astro)$/i;

// 2-레벨 모듈로 묶을 흔한 소스 루트.
const SRC_ROOTS = new Set([
  "src", "lib", "app", "apps", "packages", "server", "client", "api",
  "components", "services", "pages", "modules", "internal", "cmd", "core",
  "backend", "frontend", "web",
]);

function moduleKey(path: string): string {
  const segs = path.split("/").filter(Boolean);
  if (segs.length <= 1) return "(루트)";
  const top = segs[0].toLowerCase();
  if (SRC_ROOTS.has(top) && segs.length >= 3) return `${segs[0]}/${segs[1]}`;
  return segs[0];
}

function areaName(key: string): string {
  return key === "(루트)" ? "프로젝트 전반" : key;
}

function trimPatch(patch: string, maxLines = 14): string {
  const lines = patch.split("\n");
  return lines.length > maxLines ? lines.slice(0, maxLines).join("\n") + "\n…" : patch;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

interface ModuleAcc {
  files: string[];
  size: number;
  churn: number;
  commits: Map<string, GroundCommit>;
  best: { file: string; patch: string; churn: number } | null;
}

/**
 * 메인: 코드베이스 파일 + 상위 커밋 diff → 영역 카드.
 */
export function buildAnalysis(
  repo: EngineRepo,
  files: RepoFile[],
  diffs: CommitDiffInput[],
  opts: { maxCards?: number } = {},
): Analysis {
  const maxCards = opts.maxCards ?? 6;
  const acc = new Map<string, ModuleAcc>();
  const ensure = (k: string): ModuleAcc => {
    let a = acc.get(k);
    if (!a) {
      a = { files: [], size: 0, churn: 0, commits: new Map(), best: null };
      acc.set(k, a);
    }
    return a;
  };

  // 1) 코드베이스(트리) → 모듈별 파일.
  const codeFiles = files.filter(
    (f) => !NOISE_RE.test(f.path) && CODE_EXT_RE.test(f.path),
  );
  for (const f of codeFiles) {
    const a = ensure(moduleKey(f.path));
    if (a.files.length < 12) a.files.push(f.path);
    a.size += f.size;
  }

  // 2) diff → 모듈별 churn·계기커밋·대표 패치.
  for (const d of diffs) {
    const commit: GroundCommit = { sha: d.sha, sha7: d.sha7, message: d.message, url: d.url };
    for (const file of d.files) {
      if (NOISE_RE.test(file.filename)) continue;
      const a = ensure(moduleKey(file.filename));
      a.churn += file.churn;
      a.commits.set(d.sha, commit);
      if (file.patch && (!a.best || file.churn > a.best.churn)) {
        a.best = { file: file.filename, patch: file.patch, churn: file.churn };
      }
      if (!a.files.includes(file.filename) && a.files.length < 12) a.files.push(file.filename);
    }
  }

  // 3) 모듈 → 카드.
  const cards: AimCard[] = [];
  for (const [key, a] of Array.from(acc.entries())) {
    const fileCount = a.files.length;
    const commitCount = a.commits.size;
    if (fileCount === 0 && commitCount === 0) continue;

    // 카테고리: 경로 우선 → 계기 커밋 메시지 다수결 → feature.
    let category: Category | null =
      categorizeByPath(key) ?? categorizeByPath(a.best?.file ?? a.files[0] ?? "");
    if (!category) category = majorityCommitCategory(a.commits);
    if (!category) category = "feature";

    const signals: AimSignals = { fileCount, churn: a.churn, commitCount };
    const density = clamp01(
      0.5 * Math.min(fileCount / 8, 1) +
        0.3 * Math.min(a.churn / 300, 1) +
        0.2 * Math.min(commitCount / 4, 1),
    );

    const evidenceCommits = Array.from(a.commits.values()).slice(0, 3);
    const displayFiles = dedupe([
      ...(a.best ? [a.best.file] : []),
      ...a.files,
    ]).slice(0, 4);

    cards.push({
      id: `${repo.fullName}__${key}`,
      repoFullName: repo.fullName,
      repoUrl: repo.htmlUrl,
      category,
      area: areaName(key),
      areaPath: key,
      files: displayFiles,
      changedFile: a.best?.file,
      changedCode: a.best ? trimPatch(a.best.patch) : undefined,
      evidenceCommits,
      whyProbed: whyProbed(signals),
      signals,
      aimDensity: density,
    });
  }

  cards.sort((x, y) => y.aimDensity - x.aimDensity);
  const top = cards.slice(0, maxCards);

  const prepTopics = buildPrepTopics(top.map((c) => c.category));
  const fileTotal = codeFiles.length;
  const lowSignal = top.length === 0;

  return {
    repo,
    summary: {
      commitCount: diffs.length,
      fileCount: fileTotal,
      firstCommitDate: null,
      lastCommitDate: null,
      spanDays: null,
    },
    cards: top,
    prepTopics,
    coverage: {
      analyzedCommits: diffs.length,
      lowSignal,
      note: lowSignal
        ? "분석할 만한 코드를 찾지 못했습니다. 공개 코드가 거의 없거나(빈 레포·private) 빌드 산출물만 있을 수 있습니다. 이 경우 면접에서는 실제 코드를 즉석에서 설명/수정하는 라이브 검증(Layer 3) 비중이 커집니다."
        : null,
    },
  };
}

function majorityCommitCategory(commits: Map<string, GroundCommit>): Category | null {
  const counts = new Map<Category, number>();
  for (const c of Array.from(commits.values())) {
    const cat = categorize(c.message);
    if (cat === "chore") continue;
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  let best: Category | null = null;
  let max = 0;
  for (const [cat, n] of Array.from(counts.entries())) {
    if (n > max) {
      max = n;
      best = cat;
    }
  }
  return best;
}

function whyProbed(sig: AimSignals): string {
  const parts: string[] = [];
  if (sig.fileCount > 0) parts.push(`파일 ${sig.fileCount}개(코드베이스)`);
  if (sig.churn > 0) parts.push(`변경 ${sig.churn}줄(diff)`);
  if (sig.commitCount > 0) parts.push(`관련 커밋 ${sig.commitCount}개(계기)`);
  return parts.join(" · ") || "코드 영역";
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

/** 카테고리 한국어 라벨 재노출(소비자). */
export { CATEGORY_LABEL };
