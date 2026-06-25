import {
  parseGitHubUrl,
  fetchProfileRepos,
  fetchRepoMeta,
  fetchRecentCommits,
  fetchRepoTree,
  fetchCommitDiff,
} from "../github";
import type { RecentCommit, CommitDiff } from "../github";
import type { RepoMeta } from "../types";
import { buildAnalysis } from "./aim";
import { categorize } from "./categorize";
import { interviewerQuestionsForCard } from "./intent";
import { buildFrequencyItems } from "./frequency";
import { buildReport } from "./report";
import { HIGH_SIGNAL_CATEGORIES } from "./types";
import type {
  AimCard,
  AnalysisSummary,
  AnalyzedRepo,
  Category,
  CommitDiffInput,
  Coverage,
  EngineRepo,
  FrequencyItem,
  IntentId,
  InterviewerQuestion,
  InterviewerView,
  JobseekerView,
  RepoFile,
} from "./types";

/**
 * 양면 결정론 분석 오케스트레이션 (LLM 0회, 멀티레포).
 *
 * 가중치: **코드베이스(트리) > diff(상위 커밋) > commit(계기)**.
 * 레포당 콜: 트리 1 + 커밋목록 1 + 상위 커밋 diff K. 미인증 60/h 안에서 멀티레포 가능.
 */

const PROFILE_REPO_LIMIT = 5;
const SINGLE_DIFF_K = 6;
const PROFILE_DIFF_K = 3;
const MAX_INTERVIEWER_QUESTIONS = 30;

const LOW_SIGNAL_NOTE =
  "분석할 만한 코드를 찾지 못했습니다. 공개 코드가 거의 없거나(빈 레포·private) 빌드 산출물만 있을 수 있습니다. 이 경우 면접에서는 실제 코드를 즉석에서 설명/수정하는 라이브 검증(Layer 3) 비중이 커집니다.";

function toEngineRepo(r: RepoMeta): EngineRepo {
  return { fullName: r.fullName, primaryLanguage: r.language, htmlUrl: r.url };
}

function toCommitDiffInput(d: CommitDiff): CommitDiffInput {
  return {
    sha: d.sha,
    sha7: d.sha7,
    message: d.message,
    url: d.url,
    churn: d.additions + d.deletions,
    files: d.files.map((f) => ({
      filename: f.filename,
      churn: f.additions + f.deletions,
      patch: f.patch,
    })),
  };
}

/** 커밋 메시지 신호로 diff를 조회할 상위 K개를 고른다(고신호 우선). */
function pickSignificantShas(commits: RecentCommit[], k: number): string[] {
  const scored = commits.map((c, i) => {
    const cat = categorize(c.message);
    let score = HIGH_SIGNAL_CATEGORIES.includes(cat)
      ? 3
      : cat === "feature" || cat === "test" || cat === "revert"
        ? 1
        : 0;
    if (/^\s*(wip|tmp|update|\.+)\s*$/i.test(c.message.split("\n")[0])) score -= 2;
    return { sha: c.sha, score, i };
  });
  scored.sort((a, b) => b.score - a.score || a.i - b.i);
  return scored.slice(0, k).map((s) => s.sha);
}

interface RepoAnalysis {
  repo: RepoMeta;
  analysis: ReturnType<typeof buildAnalysis>;
}

async function analyzeOneRepo(
  r: RepoMeta,
  diffK: number,
  maxCards: number,
): Promise<RepoAnalysis> {
  const [tree, commits] = await Promise.all([
    fetchRepoTree(r.owner, r.name, r.defaultBranch),
    fetchRecentCommits(r.owner, r.name, 30).catch(() => [] as RecentCommit[]),
  ]);
  const shas = pickSignificantShas(commits, diffK);
  const diffs = (
    await Promise.all(shas.map((sha) => fetchCommitDiff(r.owner, r.name, sha)))
  ).filter((d): d is CommitDiff => d !== null);

  const files: RepoFile[] = tree.map((t) => ({ path: t.path, size: t.size }));
  const analysis = buildAnalysis(toEngineRepo(r), files, diffs.map(toCommitDiffInput), {
    maxCards,
  });
  return { repo: r, analysis };
}

/** URL → 레포별 Analysis 목록 + 대표 레포(멀티레포). */
async function analyzePerRepo(
  url: string,
): Promise<{ analyses: RepoAnalysis[]; primary: RepoMeta }> {
  const trimmed = url.trim();
  if (!trimmed) throw new Error("URL을 입력해 주세요.");

  const parsed = parseGitHubUrl(trimmed);

  let repos: RepoMeta[];
  if (parsed.kind === "repo" && parsed.repo) {
    repos = [await fetchRepoMeta(parsed.owner, parsed.repo)];
  } else {
    repos = await fetchProfileRepos(parsed.owner, PROFILE_REPO_LIMIT);
  }
  if (repos.length === 0) throw new Error("분석할 공개 레포지토리를 찾지 못했습니다.");

  const multi = repos.length > 1;
  const built = await Promise.all(
    repos.map((r) =>
      analyzeOneRepo(r, multi ? PROFILE_DIFF_K : SINGLE_DIFF_K, multi ? 4 : 6).catch(
        () => null,
      ),
    ),
  );
  const ok = built.filter((b): b is RepoAnalysis => b !== null);
  if (ok.length === 0) throw new Error("분석할 의미 있는 코드를 찾지 못했습니다.");

  const withCards = ok.filter((b) => b.analysis.cards.length > 0);
  const analyses = (withCards.length > 0 ? withCards : ok.slice(0, 1)).sort(
    (a, b) => b.analysis.cards.length - a.analysis.cards.length,
  );
  return { analyses, primary: analyses[0]?.repo ?? repos[0] };
}

function aggregateSummary(analyses: RepoAnalysis[]): AnalysisSummary {
  return {
    commitCount: analyses.reduce((s, a) => s + a.analysis.summary.commitCount, 0),
    fileCount: analyses.reduce((s, a) => s + a.analysis.summary.fileCount, 0),
    firstCommitDate: null,
    lastCommitDate: null,
    spanDays: null,
  };
}

function toAnalyzedRepos(analyses: RepoAnalysis[]): AnalyzedRepo[] {
  return analyses.map(({ repo, analysis }) => ({
    fullName: repo.fullName,
    url: repo.url,
    commitCount: analysis.summary.fileCount, // 표시는 파일수(코드베이스) 기준
    cardCount: analysis.cards.length,
  }));
}

/** 면접관 뷰(B2B): 영역별 질문 + 채점 신호 + 근거(파일·diff·계기커밋). */
export async function analyzeForInterviewer(
  url: string,
  intent: IntentId,
): Promise<InterviewerView> {
  const { analyses, primary } = await analyzePerRepo(url);

  const questions: InterviewerQuestion[] = analyses
    .flatMap(({ analysis }) =>
      analysis.cards.flatMap((card) =>
        interviewerQuestionsForCard(card, intent, analysis.repo.primaryLanguage),
      ),
    )
    .slice(0, MAX_INTERVIEWER_QUESTIONS);

  const summary = aggregateSummary(analyses);
  const coverage: Coverage = {
    analyzedCommits: summary.commitCount,
    lowSignal: questions.length === 0,
    note: questions.length === 0 ? LOW_SIGNAL_NOTE : null,
  };

  return {
    persona: "interviewer",
    intent,
    repoFullName: primary.fullName,
    repoUrl: primary.url,
    primaryLanguage: primary.language,
    repos: toAnalyzedRepos(analyses),
    report: buildReport(analyses, primary),
    summary,
    coverage,
    questions,
  };
}

/** 취준생 뷰(B2C): 계정 전체 빈출 영역(카테고리 병합) + self-check. */
export async function analyzeForJobseeker(url: string): Promise<JobseekerView> {
  const { analyses, primary } = await analyzePerRepo(url);

  const cardByCat = new Map<Category, AimCard>();
  const reposByCat = new Map<Category, Set<string>>();
  for (const { analysis } of analyses) {
    for (const card of analysis.cards) {
      const set = reposByCat.get(card.category) ?? new Set<string>();
      set.add(card.repoFullName);
      reposByCat.set(card.category, set);
      const cur = cardByCat.get(card.category);
      if (!cur || card.aimDensity > cur.aimDensity) cardByCat.set(card.category, card);
    }
  }
  const mergedCards = Array.from(cardByCat.values());
  const frequencyItems: FrequencyItem[] = buildFrequencyItems(mergedCards);
  for (const it of frequencyItems) {
    it.repoNames = Array.from(reposByCat.get(it.category) ?? []);
  }

  const summary = aggregateSummary(analyses);
  const coverage: Coverage = {
    analyzedCommits: summary.commitCount,
    lowSignal: frequencyItems.length === 0,
    note: frequencyItems.length === 0 ? LOW_SIGNAL_NOTE : null,
  };

  return {
    persona: "jobseeker",
    repoFullName: primary.fullName,
    repoUrl: primary.url,
    primaryLanguage: primary.language,
    repos: toAnalyzedRepos(analyses),
    report: buildReport(analyses, primary),
    summary,
    coverage,
    frequencyItems,
    labelMeta: {
      totalSeedLabels: 0,
      kAnonGate: "k-익명성(라벨 3건·조직 2곳) 통과 시 실측으로 대체",
    },
  };
}
