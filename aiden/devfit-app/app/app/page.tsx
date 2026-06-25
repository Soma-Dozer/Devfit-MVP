"use client";

import { useMemo, useState } from "react";
import type {
  AnalyzeResponse,
  AnalysisResult,
  InterviewQuestion,
} from "@/lib/types";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { Seal } from "@/components/ui/Seal";
import { Pill } from "@/components/ui/Pill";
import { QuestionCard } from "@/components/QuestionCard";

type Layer = 1 | 2 | 3;

const CLEARANCE: Record<
  Layer,
  { title: string; blurb: string; sealed: boolean }
> = {
  1: {
    title: "공유 가능",
    blurb: "지원자와 함께 봐도 되는 워밍업 질문으로 대화를 엽니다.",
    sealed: false,
  },
  2: {
    title: "면접관 전용",
    blurb:
      "실제 커밋·Diff에 근거한 면접관 전용 질문 — 사전 준비로 위조할 수 없습니다.",
    sealed: true,
  },
  3: {
    title: "라이브 검증",
    blurb: "현장에서 즉석으로 검증하는 라이브 질문입니다.",
    sealed: true,
  },
};

export default function AppPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const grouped = useMemo(() => {
    const map: Record<Layer, InterviewQuestion[]> = { 1: [], 2: [], 3: [] };
    if (result) {
      for (const q of result.questions) {
        map[q.layer as Layer].push(q);
      }
    }
    return map;
  }, [result]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data: AnalyzeResponse = await res.json();
      if (!data.ok || !data.result) {
        setError(data.error ?? "알 수 없는 오류가 발생했습니다.");
        return;
      }
      setResult(data.result);
    } catch {
      setError("요청에 실패했습니다. 네트워크 상태를 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader variant="app" />

      <main className="mx-auto max-w-6xl px-5 py-16">
        {/* Page title */}
        <div className="mb-10 animate-fade-up">
          <p className="eyebrow">EVIDENCE FROM GIT HISTORY</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            분석 콘솔
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-charcoal">
            GitHub 레포 또는 프로필 URL을 넣으면 커밋·Diff를 증거로 면접 질문을
            엮어냅니다.
          </p>
        </div>

        {/* Console input bar */}
        <form onSubmit={onSubmit} className="mb-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label htmlFor="github-url" className="sr-only">
              GitHub URL
            </label>
            <input
              id="github-url"
              type="text"
              inputMode="url"
              autoComplete="off"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              placeholder="https://github.com/owner 또는 https://github.com/owner/repo"
              className="input w-full flex-1 font-mono text-sm disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || url.trim().length === 0}
              className="btn-primary shrink-0"
            >
              {loading ? "분석 중…" : "분석하기"}
            </button>
          </div>
        </form>

        {/* Loading */}
        {loading && <LoadingState />}

        {/* Error */}
        {!loading && error && (
          <div
            role="alert"
            className="rounded-xl border border-error/30 bg-error/[0.08] p-5 text-error animate-fade-up"
          >
            <p className="text-base font-bold tracking-tight">
              분석에 실패했습니다
            </p>
            <p className="mt-1 text-sm leading-relaxed">{error}</p>
          </div>
        )}

        {/* Empty / initial */}
        {!loading && !error && !result && <EmptyState />}

        {/* Results */}
        {!loading && result && (
          <div className="space-y-16 animate-fade-up">
            {/* Stat strip */}
            <section aria-label="분석 요약">
              <p className="text-xs font-semibold uppercase tracking-button text-graphite">
                <span className="text-ink">레포 {result.repos.length}</span>
                <span className="mx-2 text-steel">·</span>
                <span className="text-ink">커밋 {result.commitsAnalyzed}</span>
                <span className="mx-2 text-steel">·</span>
                <span className="text-ink">스택 {result.techStack.length}</span>
              </p>
            </section>

            {/* Tech stack */}
            {result.techStack.length > 0 && (
              <section aria-labelledby="tech-heading">
                <h2
                  id="tech-heading"
                  className="mb-3 text-xs font-semibold uppercase tracking-button text-graphite"
                >
                  기술 스택
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {result.techStack.map((t) => (
                    <li key={t}>
                      <Pill>{t}</Pill>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Repos */}
            {result.repos.length > 0 && (
              <section aria-labelledby="repos-heading">
                <h2
                  id="repos-heading"
                  className="mb-3 text-xs font-semibold uppercase tracking-button text-graphite"
                >
                  분석한 레포지토리
                </h2>
                <ul className="space-y-3">
                  {result.repos.map((repo) => (
                    <li key={repo.fullName} className="card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm font-medium text-primary transition-colors hover:text-primary-deep hover:underline"
                        >
                          {repo.fullName}
                        </a>
                        <span className="shrink-0 font-mono text-xs text-graphite">
                          ★ {repo.stars.toLocaleString()}
                        </span>
                      </div>
                      {repo.description && (
                        <p className="mt-1.5 text-sm leading-relaxed text-charcoal">
                          {repo.description}
                        </p>
                      )}
                      {repo.language && (
                        <div className="mt-2.5">
                          <Pill>{repo.language}</Pill>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Exhibits by clearance level */}
            <section aria-labelledby="exhibits-heading" className="space-y-12">
              <h2
                id="exhibits-heading"
                className="text-2xl font-bold tracking-tight text-ink"
              >
                증거 목록
              </h2>

              {([1, 2, 3] as Layer[]).map((layer) => {
                const items = grouped[layer];
                if (items.length === 0) return null;
                const meta = CLEARANCE[layer];
                return (
                  <div key={layer}>
                    <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                      <h3 className="text-sm font-semibold uppercase tracking-button text-primary">
                        CLEARANCE L{layer}
                      </h3>
                      <span className="text-base font-semibold text-ink">
                        {meta.title}
                      </span>
                      {meta.sealed && <Seal />}
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-charcoal">
                      {meta.blurb}
                    </p>
                    <div className="space-y-3">
                      {items.map((q, i) => (
                        <QuestionCard
                          key={`${layer}-${i}`}
                          question={q}
                          index={i}
                          highlight={layer === 2}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
        )}
      </main>
    </>
  );
}

function LoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="card p-8 animate-fade-up"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
        />
        <p className="text-sm font-semibold uppercase tracking-button text-primary">
          분석 중…
        </p>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-charcoal">
        GitHub에서 커밋·Diff를 가져오고 GPT가 질문을 생성합니다. 보통 10~40초
        걸립니다.
      </p>
      <div className="mt-6 space-y-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-fog" />
            <div className="h-3 w-full animate-pulse rounded bg-fog" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-fog" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  const levels: { layer: Layer }[] = [{ layer: 1 }, { layer: 2 }, { layer: 3 }];
  return (
    <section className="card p-8 animate-fade-up">
      <p className="eyebrow">CLEARANCE LEVELS</p>
      <h2 className="mt-3 text-xl font-bold tracking-tight text-ink">
        세 단계 클리어런스
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-charcoal">
        velfit은 코드 활동을 증거로 읽어, 누가 볼 수 있는지에 따라 질문을 세
        단계로 봉인합니다.
      </p>
      <ol className="mt-6 space-y-5">
        {levels.map(({ layer }) => {
          const meta = CLEARANCE[layer];
          return (
            <li key={layer} className="flex gap-4">
              <span className="shrink-0 text-xs font-semibold uppercase tracking-button text-primary">
                L{layer}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-base font-semibold text-ink">
                    {meta.title}
                  </p>
                  {meta.sealed && <Seal />}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-charcoal">
                  {meta.blurb}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
