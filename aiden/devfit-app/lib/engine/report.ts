import type { RepoMeta } from "../types";
import type {
  AccountReport,
  Analysis,
  Category,
  GitHubReport,
  RepoReport,
} from "./types";
import { CATEGORY_LABEL } from "./topics";

/**
 * 상단 분석 리포트 빌더 — 결정론(LLM 0회).
 *
 * 분석 결과(영역 카드·요약)와 레포 메타만으로, 지원자 GitHub 전체(account)와
 * 대표 레포(primary)의 요약을 수치 기반으로 조립한다. headline은 템플릿 문자열이며
 * 과장 없이 관측된 수치/카테고리만 말한다.
 */

interface RepoAnalysisLike {
  repo: RepoMeta;
  analysis: Analysis;
}

/** 1200 → "1.2k", 980 → "980". */
function fmtCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/** 빈도순 distinct (null/빈값 제거). */
function rankDistinct(values: (string | null | undefined)[]): string[] {
  const count = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    count.set(v, (count.get(v) ?? 0) + 1);
  }
  return Array.from(count.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
}

/** 카드 카테고리 집계 상위 N. */
function topCategories(
  cards: { category: Category }[],
  n: number,
): { category: Category; label: string; count: number }[] {
  const count = new Map<Category, number>();
  for (const c of cards) count.set(c.category, (count.get(c.category) ?? 0) + 1);
  return Array.from(count.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([category, cnt]) => ({ category, label: CATEGORY_LABEL[category], count: cnt }));
}

function buildAccount(analyses: RepoAnalysisLike[]): AccountReport {
  const reposAnalyzed = analyses.length;
  const languages = rankDistinct(analyses.map((a) => a.repo.language));
  const totalFiles = analyses.reduce((s, a) => s + a.analysis.summary.fileCount, 0);
  const allCards = analyses.flatMap((a) => a.analysis.cards);
  const topAreas = topCategories(allCards, 4);

  const langPart = languages.length
    ? `주 언어 ${languages.slice(0, 2).join("·")}`
    : "주 언어 미상";
  const areaPart = topAreas.length
    ? `${topAreas.slice(0, 3).map((t) => t.label).join("·")} 작업이 두드러집니다`
    : "캐물 만한 코드 영역이 빈약합니다";
  const scope =
    reposAnalyzed > 1
      ? `${reposAnalyzed}개 레포·${fmtCount(totalFiles)} 파일 분석`
      : `${fmtCount(totalFiles)} 파일 분석`;
  const headline = `${scope} — ${langPart}, ${areaPart}.`;

  return { reposAnalyzed, languages, totalFiles, topAreas, headline };
}

function buildPrimary(
  analyses: RepoAnalysisLike[],
  primaryRepo: RepoMeta,
): RepoReport {
  const found =
    analyses.find((a) => a.repo.fullName === primaryRepo.fullName) ?? analyses[0];
  const repo = found?.repo ?? primaryRepo;
  const cards = found?.analysis.cards ?? [];
  const fileCount = found?.analysis.summary.fileCount ?? 0;

  const topAreas = cards.slice(0, 3).map((c) => ({
    area: c.area,
    category: c.category,
    label: CATEGORY_LABEL[c.category],
  }));

  const desc = repo.description?.trim() || null;
  const lead = desc ? trimDesc(desc) : "대표 레포지토리";
  const areaPart = topAreas.length
    ? `핵심 영역은 ${topAreas
        .slice(0, 2)
        .map((t) => t.area)
        .join("·")}, ${Array.from(new Set(topAreas.map((t) => t.label))).join("·")} 작업이 많습니다`
    : "캐물 만한 코드 영역이 빈약합니다";
  const headline = `${lead}. ${areaPart}.`;

  return {
    fullName: repo.fullName,
    url: repo.url,
    description: desc,
    primaryLanguage: repo.language,
    fileCount,
    stars: repo.stars,
    topAreas,
    headline,
  };
}

function trimDesc(s: string): string {
  const oneLine = s.replace(/\s+/g, " ").trim();
  return oneLine.length > 120 ? oneLine.slice(0, 119) + "…" : oneLine;
}

export function buildReport(
  analyses: RepoAnalysisLike[],
  primaryRepo: RepoMeta,
): GitHubReport {
  return {
    account: buildAccount(analyses),
    primary: buildPrimary(analyses, primaryRepo),
  };
}
