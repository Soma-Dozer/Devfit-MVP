"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { Seal } from "@/components/ui/Seal";
import { Pill } from "@/components/ui/Pill";
import { DiffHunk } from "@/components/ui/DiffHunk";
import type {
  AnalyzedRepo,
  DuoResponse,
  GitHubReport,
  IntentId,
  InterviewerQuestion,
  InterviewerView,
} from "@/lib/engine/types";

// 의도 프리셋(클라이언트 표시용 — 엔진 INTENT_PRESETS와 동일).
const INTENTS: { id: IntentId; label: string; tagline: string }[] = [
  { id: "killer", label: "킬러", tagline: "떨어뜨리는 결정적 추궁" },
  { id: "fundamentals", label: "기본 문법", tagline: "쓴 문법을 이해했는가" },
  { id: "cs", label: "CS 개념", tagline: "구현 뒤의 CS 원리" },
  { id: "all", label: "전체 균형", tagline: "세 결을 고루" },
];

const LAYER_LABEL: Record<"L1" | "L2" | "L3", string> = {
  L1: "공유 가능",
  L2: "면접관 전용",
  L3: "라이브",
};

export default function B2bAppPage() {
  const [url, setUrl] = useState("");
  const [intent, setIntent] = useState<IntentId>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewer, setInterviewer] = useState<InterviewerView | null>(null);
  const [ranUrl, setRanUrl] = useState<string>("");

  async function run(it: IntentId, overrideUrl?: string) {
    const target = (overrideUrl ?? url).trim();
    if (!target || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/duo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target, persona: "interviewer", intent: it }),
      });
      const data: DuoResponse = await res.json();
      if (!data.ok) {
        setError(data.error ?? "알 수 없는 오류가 발생했습니다.");
        return;
      }
      if (data.interviewer) {
        setInterviewer(data.interviewer);
      } else {
        setError("면접관 분석 결과를 받지 못했습니다.");
        return;
      }
      setRanUrl(target);
    } catch {
      setError("요청에 실패했습니다. 네트워크 상태를 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInterviewer(null);
    run(intent);
  }

  // 의도 전환 — 같은 URL을 이미 돌렸으면 질문 성향만 바꿔 재조회.
  function switchIntent(it: IntentId) {
    setIntent(it);
    if (ranUrl && ranUrl === url.trim()) run(it);
  }

  return (
    <>
      <SiteHeader variant="app" />
      <main className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        {/* Title */}
        <div className="mb-8 animate-fade-up">
          <p className="eyebrow">FOR INTERVIEWERS · B2B</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            위조 불가능한 검증 질문을 뽑습니다
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-charcoal">
            지원자의 GitHub를 결정론으로 분석해{" "}
            <strong className="font-semibold text-ink">코드 영역</strong>에 대한 검증 질문과{" "}
            <strong className="font-semibold text-ink">채점 신호</strong>(진짜/위조)를 뽑습니다.
            질문 성향(킬러·기본기·CS)을 골라 무엇을 캐물지 직접 조준하세요. 커밋·diff는
            근거(계기)로 첨부됩니다.
          </p>
        </div>

        {/* Input */}
        <form onSubmit={onSubmit} className="mb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              inputMode="url"
              autoComplete="off"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              placeholder="https://github.com/owner 또는 owner/repo"
              aria-label="GitHub URL"
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
          <p className="mt-2.5 text-xs leading-relaxed text-graphite">
            LLM 0회 · 공개 GitHub API만 사용(키 불필요). 커밋 메시지·시점의 결정론
            함수로 조준합니다.
          </p>
        </form>

        {/* Intent presets */}
        <div className="mb-8">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-button text-graphite">
            질문 성향 커스텀 — 무엇을 캐물까?
          </p>
          <div className="flex flex-wrap gap-2">
            {INTENTS.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => switchIntent(it.id)}
                aria-pressed={intent === it.id}
                title={it.tagline}
                className={`rounded-full border px-4 py-2 text-left transition-colors ${
                  intent === it.id
                    ? "border-ink bg-ink text-white"
                    : "border-hairline bg-canvas hover:border-steel"
                }`}
              >
                <span className="block text-sm font-bold tracking-tight">{it.label}</span>
                <span
                  className={`block text-[11px] ${
                    intent === it.id ? "text-white/70" : "text-graphite"
                  }`}
                >
                  {it.tagline}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading / error */}
        {loading && (
          <div role="status" className="card p-6 animate-fade-up">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
              />
              <p className="text-sm font-semibold uppercase tracking-button text-primary">
                결정론 조준 중…
              </p>
            </div>
          </div>
        )}
        {!loading && error && (
          <div
            role="alert"
            className="rounded-xl border border-error/30 bg-error/[0.08] p-5 text-error animate-fade-up"
          >
            <p className="text-base font-bold tracking-tight">분석에 실패했습니다</p>
            <p className="mt-1 text-sm leading-relaxed text-charcoal">{error}</p>
          </div>
        )}

        {/* Result */}
        {!loading && !error && interviewer && (
          <InterviewerResult view={interviewer} intent={intent} />
        )}

        {/* Empty */}
        {!loading && !error && !interviewer && <EmptyState />}
      </main>
    </>
  );
}

// ── 상단 분석 리포트 (지원자 GitHub 전체 + 대표 레포) ─────────────────────
function AnalysisReport({ report }: { report: GitHubReport }) {
  const { account, primary } = report;
  return (
    <section
      aria-label="GitHub 분석 리포트"
      className="grid grid-cols-1 gap-4 lg:grid-cols-2"
    >
      {/* 지원자 GitHub 전체 */}
      <div className="card p-5">
        <p className="eyebrow">지원자 GitHub 분석</p>
        <p className="mt-2 text-sm font-medium leading-relaxed text-ink">
          {account.headline}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[11px] text-graphite">
          <span>레포 {account.reposAnalyzed}</span>
          <span className="text-steel">·</span>
          <span>파일 {account.totalFiles.toLocaleString()}</span>
          {account.languages.length > 0 && (
            <>
              <span className="text-steel">·</span>
              <span>{account.languages.slice(0, 3).join(" / ")}</span>
            </>
          )}
        </div>
        {account.topAreas.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase tracking-button text-graphite">
              두드러진 작업
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {account.topAreas.map((t) => (
                <li key={t.category}>
                  <Pill tone="primary">
                    {t.label} · {t.count}
                  </Pill>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 대표 레포지토리 */}
      <div className="card p-5">
        <p className="eyebrow">대표 레포지토리</p>
        <a
          href={primary.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block font-mono text-sm font-semibold text-primary hover:underline"
        >
          {primary.fullName}
        </a>
        <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-graphite">
          {primary.primaryLanguage && (
            <>
              <span>{primary.primaryLanguage}</span>
              <span className="text-steel">·</span>
            </>
          )}
          <span>파일 {primary.fileCount.toLocaleString()}</span>
          <span className="text-steel">·</span>
          <span>★ {primary.stars.toLocaleString()}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-charcoal">{primary.headline}</p>
        {primary.topAreas.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase tracking-button text-graphite">
              핵심 영역
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {primary.topAreas.map((t, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2 text-xs text-ink">
                  <span className="font-mono text-charcoal">{t.area}</span>
                  <Pill>{t.label}</Pill>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

// ── 면접관 결과 ──────────────────────────────────────────────────────────
function InterviewerResult({
  view,
  intent,
}: {
  view: InterviewerView;
  intent: IntentId;
}) {
  const intentMeta = INTENTS.find((i) => i.id === intent);
  return (
    <div className="space-y-6 animate-fade-up">
      <AnalysisReport report={view.report} />
      <StatStrip
        repoFullName={view.repoFullName}
        repoUrl={view.repoUrl}
        primaryLanguage={view.primaryLanguage}
        fileCount={view.summary.fileCount}
        right={`레포 ${view.repos.length} · 질문 ${view.questions.length}`}
      />
      <ReposAnalyzed repos={view.repos} />
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="primary">의도: {intentMeta?.label}</Pill>
        <span className="text-xs text-graphite">{intentMeta?.tagline}</span>
      </div>

      {view.coverage.note && <CoverageNote note={view.coverage.note} />}

      {view.questions.length === 0 ? (
        <p className="card p-6 text-sm leading-relaxed text-charcoal">
          이 의도로 만들 질문이 부족합니다. 다른 성향을 선택하거나 커밋이 더 많은
          레포를 시도해 보세요.
        </p>
      ) : (
        <div className="space-y-3">
          {view.questions.map((q, i) => (
            <ExhibitCard key={q.id} q={q} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExhibitCard({ q, index }: { q: InterviewerQuestion; index: number }) {
  return (
    <article className="card relative overflow-hidden p-5 pl-6">
      {/* 좌측 primary 액센트 */}
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-primary" />
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="text-xs font-bold uppercase tracking-button text-primary">
          EXHIBIT {String(index + 1).padStart(2, "0")}
        </span>
        <span className="font-mono text-[11px] text-graphite">{q.repoFullName}</span>
        <Pill>{q.category}</Pill>
        {q.csTopic && <Pill tone="primary">{q.csTopic}</Pill>}
        <span className="text-[11px] text-graphite">
          {q.layer} · {LAYER_LABEL[q.layer]}
        </span>
        {q.layer !== "L1" && <Seal />}
      </div>

      {/* 질문이 향하는 코드 영역(주체) */}
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-button text-graphite">
        코드 영역 · <span className="font-mono normal-case text-charcoal">{q.area}</span>
      </p>
      <p className="text-[15px] font-medium leading-relaxed text-ink">
        {q.questionText}
      </p>

      {/* 면접관 노트: 채점 신호 */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-primary/20 bg-primary/[0.06] p-3">
          <p className="text-[10px] font-bold uppercase tracking-button text-primary-deep">
            ✓ 진짜라면
          </p>
          <p className="mt-1 text-xs leading-relaxed text-charcoal">{q.scoringTrue}</p>
        </div>
        <div className="rounded-lg border border-error/30 bg-error/[0.06] p-3">
          <p className="text-[10px] font-bold uppercase tracking-button text-error">
            ✗ 위조 의심
          </p>
          <p className="mt-1 text-xs leading-relaxed text-charcoal">{q.scoringFake}</p>
        </div>
      </div>

      {/* 근거(계기) — 코드/파일이 주, 커밋은 계기 단서 */}
      <div className="mt-3 border-t border-hairline pt-2">
        <p className="text-[10px] font-bold uppercase tracking-button text-graphite">
          근거 (계기)
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-graphite">
          {q.evidenceFile && <span>파일 {q.evidenceFile}</span>}
          {q.evidenceCommits.map((c) => (
            <a
              key={c.sha}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              title={c.message}
            >
              ↳ 계기 {c.sha7}
            </a>
          ))}
        </div>
        {q.evidenceCode && (
          <details className="mt-2">
            <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-button text-primary">
              변경 코드 보기
            </summary>
            <div className="mt-2">
              <DiffHunk diff={q.evidenceCode} />
            </div>
          </details>
        )}
      </div>
    </article>
  );
}

// ── 공용 ────────────────────────────────────────────────────────────────
/** 분석에 포함된 레포 목록 — 멀티레포(프로필)일 때만 표시. */
function ReposAnalyzed({ repos }: { repos: AnalyzedRepo[] }) {
  if (!repos || repos.length <= 1) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-button text-graphite">
        분석한 레포 {repos.length}
      </span>
      {repos.map((r) => (
        <a
          key={r.fullName}
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-2.5 py-1 font-mono text-[11px] text-charcoal transition-colors hover:border-primary/40"
        >
          {r.fullName}
          <span className="text-graphite">· {r.cardCount}영역</span>
        </a>
      ))}
    </div>
  );
}

function StatStrip({
  repoFullName,
  repoUrl,
  primaryLanguage,
  fileCount,
  right,
}: {
  repoFullName: string;
  repoUrl: string;
  primaryLanguage: string | null;
  fileCount: number;
  right: string;
}) {
  return (
    <section
      aria-label="분석 요약"
      className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3"
    >
      <a
        href={repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-sm font-medium text-primary hover:underline"
      >
        {repoFullName}
      </a>
      <p className="text-xs uppercase tracking-button text-graphite">
        {primaryLanguage && (
          <>
            <span className="text-ink">{primaryLanguage}</span>
            <span className="mx-2 text-steel">·</span>
          </>
        )}
        <span className="text-ink">파일 {fileCount}</span>
        <span className="mx-2 text-steel">·</span>
        <span className="text-ink">{right}</span>
      </p>
    </section>
  );
}

function CoverageNote({ note }: { note: string }) {
  return (
    <div className="rounded-xl border border-error/30 bg-error/[0.08] p-4">
      <p className="text-[10px] font-bold uppercase tracking-button text-error">
        솔직 보고 · 신호 빈약
      </p>
      <p className="mt-1 text-xs leading-relaxed text-charcoal">{note}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-xl border border-hairline bg-cloud p-8 animate-fade-up">
      <p className="eyebrow">면접관 콘솔 · B2B</p>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">
        커밋이 아니라 코드 영역을 캐묻는다
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-base font-bold tracking-tight text-ink">검증 질문 + 채점 신호</p>
          <p className="mt-1.5 text-sm leading-relaxed text-charcoal">
            성향을 골라(킬러·기본기·CS) 코드 영역에 대한 위조 불가능한 질문과 함께
            진짜/위조를 가르는 채점 신호를 받습니다.
          </p>
        </div>
        <div className="card p-5">
          <p className="text-base font-bold tracking-tight text-ink">근거 첨부</p>
          <p className="mt-1.5 text-sm leading-relaxed text-charcoal">
            각 질문에는 근거 파일·변경 코드(diff)·계기 커밋 링크가 붙습니다. 면접관은
            바로 코드를 펼쳐 검증할 수 있습니다.
          </p>
        </div>
      </div>
      <p className="mt-5 text-xs text-graphite">
        위에 GitHub URL을 넣고 질문 성향을 골라 보세요. 예: github.com/facebook/react
      </p>
    </section>
  );
}
