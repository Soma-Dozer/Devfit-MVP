import { CommitInfo, ParsedInput, RepoMeta } from "./types";

// ──────────────────────────────────────────────────────────────
// GitHub REST API client. Server-side only (uses global fetch).
// ──────────────────────────────────────────────────────────────

const API_BASE = "https://api.github.com";
const DEFAULT_ACCEPT = "application/vnd.github+json";

/** First path segments that are not GitHub usernames but reserved routes. */
const RESERVED_OWNER_WORDS = new Set([
  "orgs",
  "sponsors",
  "settings",
  "marketplace",
  "explore",
  "topics",
  "trending",
  "notifications",
  "search",
  "about",
  "pricing",
  "features",
  "login",
  "join",
]);

/** Lockfile / generated-artifact filename patterns to ignore for significance. */
const GENERATED_PATTERNS: RegExp[] = [
  /(^|\/)package-lock\.json$/,
  /(^|\/)yarn\.lock$/,
  /(^|\/)pnpm-lock\.yaml$/,
  /\.min\.js$/,
  /(^|\/)dist\//,
  /(^|\/)build\//,
];

const DIFF_MAX_CHARS = 6000;
const MESSAGE_MAX_CHARS = 500;

// ── URL parsing ────────────────────────────────────────────────

export function parseGitHubUrl(url: string): ParsedInput {
  if (!url || typeof url !== "string") {
    throw new Error("유효한 GitHub URL이 아닙니다.");
  }

  let raw = url.trim();
  if (raw.length === 0) {
    throw new Error("유효한 GitHub URL이 아닙니다.");
  }

  // Strip a leading scheme if present.
  raw = raw.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, "");

  // Strip a leading github.com host (with optional www.).
  raw = raw.replace(/^www\./i, "");
  raw = raw.replace(/^github\.com\//i, "");
  // If the whole thing was just "github.com" with no path, nothing left.
  raw = raw.replace(/^github\.com$/i, "");

  // Drop query string and fragment.
  raw = raw.split(/[?#]/)[0];

  // Trim slashes.
  raw = raw.replace(/^\/+/, "").replace(/\/+$/, "");

  if (raw.length === 0) {
    throw new Error("유효한 GitHub URL이 아닙니다.");
  }

  const segments = raw.split("/").filter((s) => s.length > 0);
  if (segments.length === 0) {
    throw new Error("유효한 GitHub URL이 아닙니다.");
  }

  const owner = segments[0];
  // Validate owner against GitHub username charset.
  if (!/^[A-Za-z0-9-]+$/.test(owner)) {
    throw new Error("유효한 GitHub URL이 아닙니다.");
  }

  // If the first segment is a reserved route word, treat it as owner anyway
  // (per spec) but do not attempt to read a repo from the remainder.
  const isReserved = RESERVED_OWNER_WORDS.has(owner.toLowerCase());

  if (segments.length >= 2 && !isReserved) {
    let repo = segments[1];
    repo = repo.replace(/\.git$/i, "");
    if (repo.length > 0 && /^[A-Za-z0-9._-]+$/.test(repo)) {
      return { kind: "repo", owner, repo };
    }
  }

  return { kind: "profile", owner };
}

// ── Low-level fetch ────────────────────────────────────────────

interface GhErrorBody {
  message?: string;
}

async function ghFetch<T>(path: string, accept: string = DEFAULT_ACCEPT): Promise<T> {
  const headers: Record<string, string> = {
    Accept: accept,
    "User-Agent": "devfit-app",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token && token.length > 0) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { headers });

  if (!res.ok) {
    if (res.status === 403) {
      const remaining = res.headers.get("x-ratelimit-remaining");
      if (remaining === "0") {
        throw new Error(
          "GitHub API 요청 한도를 초과했습니다. GITHUB_TOKEN을 설정해 보세요.",
        );
      }
      // 403 can also be a secondary rate limit; treat those similarly.
      let bodyText = "";
      try {
        bodyText = await res.text();
      } catch {
        bodyText = "";
      }
      if (/rate limit/i.test(bodyText)) {
        throw new Error(
          "GitHub API 요청 한도를 초과했습니다. GITHUB_TOKEN을 설정해 보세요.",
        );
      }
      throw new Error(`GitHub API 오류: ${res.status} ${res.statusText}`);
    }

    if (res.status === 404) {
      throw new Error("GitHub에서 찾을 수 없습니다 (404).");
    }

    throw new Error(`GitHub API 오류: ${res.status} ${res.statusText}`);
  }

  // The diff media type returns text, not JSON. Callers that request the diff
  // accept type expect a string back.
  if (accept.includes("diff") || accept.includes("patch")) {
    return (await res.text()) as unknown as T;
  }

  return (await res.json()) as T;
}

// ── Raw GitHub API shapes (only the fields we use) ─────────────

interface GhRepo {
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  fork: boolean;
  archived: boolean;
  pushed_at: string | null;
  default_branch?: string;
  owner: { login: string };
}

interface GhCommitFile {
  filename: string;
  additions?: number;
  deletions?: number;
  patch?: string;
}

interface GhCommitListItem {
  sha: string;
  html_url: string;
  parents: { sha: string }[];
  commit: {
    message: string;
    author: { name?: string; date?: string } | null;
  };
  author: { login?: string } | null;
}

interface GhCommitDetail extends GhCommitListItem {
  stats?: { additions?: number; deletions?: number; total?: number };
  files?: GhCommitFile[];
}

// ── Mapping helpers ────────────────────────────────────────────

function toRepoMeta(r: GhRepo): RepoMeta {
  return {
    owner: r.owner.login,
    name: r.name,
    fullName: r.full_name,
    description: r.description,
    language: r.language,
    stars: r.stargazers_count,
    url: r.html_url,
    defaultBranch: r.default_branch ?? "HEAD",
  };
}

// ── Public API ─────────────────────────────────────────────────

export async function fetchProfileRepos(
  owner: string,
  max: number = 3,
): Promise<RepoMeta[]> {
  const repos = await ghFetch<GhRepo[]>(
    `/users/${encodeURIComponent(owner)}/repos?sort=pushed&per_page=30&type=owner`,
  );

  const filtered = repos.filter((r) => !r.fork && !r.archived);

  filtered.sort((a, b) => {
    if (b.stargazers_count !== a.stargazers_count) {
      return b.stargazers_count - a.stargazers_count;
    }
    const ad = a.pushed_at ? Date.parse(a.pushed_at) : 0;
    const bd = b.pushed_at ? Date.parse(b.pushed_at) : 0;
    return bd - ad;
  });

  return filtered.slice(0, Math.max(0, max)).map(toRepoMeta);
}

export async function fetchRepoMeta(owner: string, repo: string): Promise<RepoMeta> {
  const r = await ghFetch<GhRepo>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
  );
  return toRepoMeta(r);
}

interface CommitCandidate {
  info: CommitInfo;
  score: number;
}

export async function fetchSignificantCommits(
  repo: RepoMeta,
  limit: number = 8,
): Promise<CommitInfo[]> {
  const list = await ghFetch<GhCommitListItem[]>(
    `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/commits?per_page=30`,
  );

  // Drop merge commits up front.
  const nonMerge = list.filter((c) => {
    const parents = c.parents ?? [];
    if (parents.length > 1) return false;
    const msg = c.commit?.message ?? "";
    if (/^Merge /.test(msg)) return false;
    return true;
  });

  // Fetch all candidate details in parallel; tolerate individual failures.
  const details = await Promise.all(
    nonMerge.map(async (c): Promise<GhCommitDetail | null> => {
      try {
        return await ghFetch<GhCommitDetail>(
          `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/commits/${c.sha}`,
        );
      } catch {
        return null;
      }
    }),
  );

  const candidates: CommitCandidate[] = [];

  for (const detail of details) {
    if (!detail) continue;

    const files = detail.files ?? [];

    // Determine whether every changed file is a lockfile/generated artifact.
    if (files.length > 0) {
      const allGenerated = files.every((f) =>
        GENERATED_PATTERNS.some((re) => re.test(f.filename)),
      );
      if (allGenerated) continue;
    }

    // Build concatenated diff from file patches (skip binaries with no patch).
    let diff = "";
    for (const f of files) {
      if (!f.patch) continue;
      diff += `diff --git a/${f.filename} b/${f.filename}\n`;
      diff += `--- a/${f.filename}\n+++ b/${f.filename}\n`;
      diff += f.patch;
      if (!f.patch.endsWith("\n")) diff += "\n";
    }

    if (diff.length > DIFF_MAX_CHARS) {
      diff = diff.slice(0, DIFF_MAX_CHARS) + "\n…(truncated)";
    }

    const additions = detail.stats?.additions ?? 0;
    const deletions = detail.stats?.deletions ?? 0;
    const score = additions + deletions;

    const message = formatMessage(detail.commit?.message ?? "");
    const author =
      detail.commit?.author?.name ?? detail.author?.login ?? "unknown";
    const date = detail.commit?.author?.date ?? "";

    candidates.push({
      score,
      info: {
        sha: detail.sha,
        shortSha: detail.sha.slice(0, 7),
        message,
        author,
        date,
        url: detail.html_url,
        additions,
        deletions,
        filesChanged: files.length,
        repoFullName: repo.fullName,
        diff,
      },
    });
  }

  candidates.sort((a, b) => b.score - a.score);

  return candidates.slice(0, Math.max(0, limit)).map((c) => c.info);
}

/** 코드베이스 파일(경로·크기). 트리 1콜로 레포 구조를 파악(코드베이스 가중치). */
export interface RepoTreeFile {
  path: string;
  size: number;
}

/**
 * 레포 파일 트리(재귀)를 1콜로 가져온다 — 코드베이스 구조 분석용(최상위 가중치).
 * 실패(빈 레포·권한 등) 시 빈 배열.
 */
export async function fetchRepoTree(
  owner: string,
  repo: string,
  branch: string,
): Promise<RepoTreeFile[]> {
  try {
    const data = await ghFetch<{
      tree?: { path: string; type: string; size?: number }[];
    }>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    );
    return (data.tree ?? [])
      .filter((t) => t.type === "blob")
      .map((t) => ({ path: t.path, size: t.size ?? 0 }));
  } catch {
    return [];
  }
}

/** 한 커밋의 변경 파일·패치(diff 가중치). 상세 1콜. */
export interface CommitDiff {
  sha: string;
  sha7: string;
  message: string;
  url: string;
  additions: number;
  deletions: number;
  files: { filename: string; additions: number; deletions: number; patch?: string }[];
}

/** 지정 sha의 diff(파일 목록+패치)를 1콜로 가져온다. 실패 시 null. */
export async function fetchCommitDiff(
  owner: string,
  repo: string,
  sha: string,
): Promise<CommitDiff | null> {
  try {
    const d = await ghFetch<GhCommitDetail>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${sha}`,
    );
    return {
      sha: d.sha,
      sha7: d.sha.slice(0, 7),
      message: formatMessage(d.commit?.message ?? ""),
      url: d.html_url,
      additions: d.stats?.additions ?? 0,
      deletions: d.stats?.deletions ?? 0,
      files: (d.files ?? []).map((f) => ({
        filename: f.filename,
        additions: f.additions ?? 0,
        deletions: f.deletions ?? 0,
        patch: f.patch,
      })),
    };
  } catch {
    return null;
  }
}

/** 가벼운 커밋(메시지·시점·sha·url만). 결정론 엔진용 — diff/상세 호출 없이 목록 1콜. */
export interface RecentCommit {
  sha: string;
  message: string;
  date: string; // ISO
  url: string;
}

/**
 * 레포 최근 커밋을 목록 엔드포인트 1콜로만 가져온다(상세/디프 미조회).
 * 결정론 조준 엔진은 커밋 메시지·시점만 쓰므로 충분하며, 멀티레포 분석을
 * GitHub 레이트리밋(미인증 60/h) 안에서 가능하게 한다(레포당 1콜).
 */
export async function fetchRecentCommits(
  owner: string,
  repo: string,
  perPage: number = 30,
): Promise<RecentCommit[]> {
  const list = await ghFetch<GhCommitListItem[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=${Math.min(Math.max(perPage, 1), 100)}`,
  );
  return list
    .filter((c) => {
      const parents = c.parents ?? [];
      if (parents.length > 1) return false; // 머지 커밋 제외
      if (/^Merge /.test(c.commit?.message ?? "")) return false;
      return true;
    })
    .map((c) => ({
      sha: c.sha,
      message: formatMessage(c.commit?.message ?? ""),
      date: c.commit?.author?.date ?? "",
      url: c.html_url,
    }));
}

/** First line + trimmed body, capped at MESSAGE_MAX_CHARS. */
function formatMessage(raw: string): string {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (normalized.length === 0) return "";
  const lines = normalized.split("\n");
  const subject = lines[0].trim();
  const body = lines.slice(1).join("\n").trim();
  const combined = body.length > 0 ? `${subject}\n\n${body}` : subject;
  if (combined.length > MESSAGE_MAX_CHARS) {
    return combined.slice(0, MESSAGE_MAX_CHARS);
  }
  return combined;
}
