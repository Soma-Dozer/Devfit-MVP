import {
  parseGitHubUrl,
  fetchProfileRepos,
  fetchRepoMeta,
  fetchSignificantCommits,
} from "./github";
import { generateQuestions } from "./openai";
import type { AnalysisResult, CommitInfo, RepoMeta } from "./types";

/**
 * Core analysis orchestration, extracted so both the standalone
 * `/api/analyze` route and the candidate-submission analyzer reuse it.
 * Throws Error (with a user-facing Korean message) on any failure.
 */
export async function runAnalysis(url: string): Promise<AnalysisResult> {
  const trimmed = url.trim();
  if (!trimmed) throw new Error("URL을 입력해 주세요.");

  const parsed = parseGitHubUrl(trimmed); // throws on invalid

  let repos: RepoMeta[];
  if (parsed.kind === "repo" && parsed.repo) {
    repos = [await fetchRepoMeta(parsed.owner, parsed.repo)];
  } else {
    repos = await fetchProfileRepos(parsed.owner, 3);
  }
  if (repos.length === 0) {
    throw new Error("분석할 공개 레포지토리를 찾지 못했습니다.");
  }

  // Fetch significant commits for every repo in parallel.
  const perRepoLimit = repos.length === 1 ? 10 : 4;
  const batches = await Promise.all(
    repos.map((r) =>
      fetchSignificantCommits(r, perRepoLimit).catch(() => [] as CommitInfo[]),
    ),
  );
  const commits = batches.flat();
  if (commits.length === 0) {
    throw new Error(
      "분석할 의미 있는 커밋을 찾지 못했습니다. 다른 레포/프로필을 시도해 보세요.",
    );
  }

  const { techStack, questions } = await generateQuestions(repos, commits);

  return {
    input: { kind: parsed.kind, raw: trimmed },
    repos,
    commitsAnalyzed: commits.length,
    techStack,
    questions,
  };
}
