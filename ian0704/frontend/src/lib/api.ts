export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

/* ---------- types ---------- */

export type Role = "APPLICANT" | "INTERVIEWER";

export type AppUser = {
  id: number;
  email: string;
  name: string;
  role: Role;
  githubUsername: string | null;
};

export type Session = { token: string; user: AppUser };

export type Question = { layer: string; text: string; rationale: string };

export type SnippetResult = {
  commitSha: string;
  shortSha: string;
  commitMessage: string;
  fileName: string;
  patch: string;
  additions: number;
  deletions: number;
  htmlUrl: string;
  authorName: string;
  date: string;
  title: string;
  explanation: string;
  questions: Question[];
};

export type RepoInfo = {
  fullName: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  topics: string[];
  htmlUrl: string;
  readmeExcerpt: string;
};

export type AnalyzeResponse = {
  repo: string;
  repoInfo?: RepoInfo | null;
  repoSummary?: string | null;
  snippetCount: number;
  snippets: SnippetResult[];
  warning?: string | null;
};

export type GhUser = {
  login: string;
  name: string;
  bio: string;
  avatarUrl: string;
  htmlUrl: string;
  followers: number;
  publicRepos: number;
  company: string;
  location: string;
};

export type DeepProject = {
  name: string;
  description: string;
  htmlUrl: string;
  stars: number;
  language: string;
  languages: { name: string; bytes: number }[];
  summary: string;
  howBuilt: string[];
  highlights: string[];
};

export type Portfolio = {
  user: GhUser;
  totalStars: number;
  topLanguage: string;
  languages: { name: string; count: number }[];
  topProjects: {
    name: string;
    description: string;
    language: string;
    stars: number;
    forks: number;
    htmlUrl: string;
    topics: string[];
  }[];
  deepProjects: DeepProject[];
  aiIntro: string | null;
};

export type PrepTopic = { topic: string; why: string };
export type PrepSnippet = {
  commitSha: string;
  shortSha: string;
  commitMessage: string;
  fileName: string;
  patch: string;
  additions: number;
  deletions: number;
  htmlUrl: string;
  title: string;
  explanation: string;
  question: string;
  answerGuide: string;
};
export type PrepResponse = {
  repo: string;
  repoInfo?: RepoInfo | null;
  topics: PrepTopic[];
  snippetCount: number;
  snippets: PrepSnippet[];
  warning?: string | null;
};

/* ---------- low-level fetch ---------- */

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "요청에 실패했습니다.");
  return data as T;
}

async function get<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "요청에 실패했습니다.");
  return data as T;
}

/* ---------- auth ---------- */

export async function signup(payload: {
  email: string;
  password: string;
  name: string;
  role: "applicant" | "interviewer";
  githubUsername?: string;
}): Promise<Session> {
  const d = await post<{ token: string; user: AppUser }>("/api/auth/signup", payload);
  return { token: d.token, user: d.user };
}

export async function login(email: string, password: string): Promise<Session> {
  const d = await post<{ token: string; user: AppUser }>("/api/auth/login", { email, password });
  return { token: d.token, user: d.user };
}

export async function setGithub(token: string, githubUsername: string): Promise<AppUser> {
  const d = await post<{ user: AppUser }>("/api/auth/github", { githubUsername }, token);
  return d.user;
}

/* ---------- features ---------- */

export type Candidate = {
  id: number;
  name: string;
  githubUsername: string;
  languages: string[];
};

export function listApplicants(): Promise<Candidate[]> {
  return get<Candidate[]>("/api/applicants");
}

export function getPortfolio(username: string): Promise<Portfolio> {
  return get<Portfolio>(`/api/portfolio?username=${encodeURIComponent(username)}`);
}

export function prep(repoUrl: string, maxSnippets = 3): Promise<PrepResponse> {
  return post<PrepResponse>("/api/prep", { repoUrl, maxSnippets });
}

export function analyze(repoUrl: string, maxSnippets = 3): Promise<AnalyzeResponse> {
  return post<AnalyzeResponse>("/api/analyze", { repoUrl, maxSnippets });
}

/**
 * SSE로 실제 진행 단계를 받으며 분석한다.
 * onProgress(done): done번째(0-based) 단계가 실제로 끝났을 때 호출.
 * 반환값을 호출하면 스트림을 닫는다.
 */
export function analyzeStream(
  repoUrl: string,
  maxSnippets: number,
  on: {
    onProgress: (done: number) => void;
    onResult: (r: AnalyzeResponse) => void;
    onError: (msg: string) => void;
  }
): () => void {
  const url = `${API_BASE}/api/analyze/stream?repoUrl=${encodeURIComponent(
    repoUrl
  )}&maxSnippets=${maxSnippets}`;
  const es = new EventSource(url);
  let finished = false;
  const close = () => {
    finished = true;
    es.close();
  };
  es.addEventListener("progress", (e) => {
    on.onProgress(JSON.parse((e as MessageEvent).data).done);
  });
  es.addEventListener("result", (e) => {
    on.onResult(JSON.parse((e as MessageEvent).data) as AnalyzeResponse);
    close();
  });
  es.addEventListener("failed", (e) => {
    on.onError(JSON.parse((e as MessageEvent).data).error ?? "분석에 실패했습니다.");
    close();
  });
  es.onerror = () => {
    if (!finished) {
      on.onError("연결이 끊겼습니다. 다시 시도해 주세요.");
      close();
    }
  };
  return close;
}

/* ---------- session storage ---------- */

const KEY = "gitproof_session";

export function saveSession(s: Session) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
}
export function clearSession() {
  localStorage.removeItem(KEY);
}
export function homeFor(role: Role): string {
  return role === "INTERVIEWER" ? "/dashboard" : "/profile";
}
