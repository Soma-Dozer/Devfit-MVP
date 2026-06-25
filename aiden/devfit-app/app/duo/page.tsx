"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { Seal } from "@/components/ui/Seal";
import { Pill } from "@/components/ui/Pill";
import { DiffHunk } from "@/components/ui/DiffHunk";
import type {
  AnalyzedRepo,
  DuoResponse,
  FrequencyItem,
  GitHubReport,
  IntentId,
  InterviewerQuestion,
  InterviewerView,
  JobseekerView,
  Persona,
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

export default function DuoPage() {
  const [url, setUrl] = useState("");
  const [persona, setPersona] = useState<Persona>("interviewer");
  const [intent, setIntent] = useState<IntentId>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewer, setInterviewer] = useState<InterviewerView | null>(null);
  const [jobseeker, setJobseeker] = useState<JobseekerView | null>(null);
  const [ranUrl, setRanUrl] = useState<string>("");

  async function run(p: Persona, it: IntentId, overrideUrl?: string) {
    const target = (overrideUrl ?? url).trim();
    if (!target || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/duo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target, persona: p, intent: it }),
      });
      const data: DuoResponse = await res.json();
      if (!data.ok) {
        setError(data.error ?? "알 수 없는 오류가 발생했습니다.");
        return;
      }
      if (p === "interviewer" && data.interviewer) {
        setInterviewer(data.interviewer);
      } else if (p === "jobseeker" && data.jobseeker) {
        setJobseeker(data.jobseeker);
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
    setJobseeker(null);
    run(persona, intent);
  }

  // 페르소나 전환 — 같은 URL을 이미 돌렸으면 즉시 반대편 뷰를 가져온다(비대칭 시연).
  function switchPersona(p: Persona) {
    setPersona(p);
    if (ranUrl && ranUrl === url.trim()) {
      if (p === "interviewer" && !interviewer) run("interviewer", intent);
      else if (p === "jobseeker" && !jobseeker) run("jobseeker", intent);
    }
  }

  // 의도 전환 — 면접관 뷰에서 같은 URL로 질문 성향만 바꿔 재조회.
  function switchIntent(it: IntentId) {
    setIntent(it);
    if (ranUrl && ranUrl === url.trim()) run("interviewer", it);
  }

  return (
    <>
      <SiteHeader variant="app" />
      <main className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        {/* Title */}
        <div className="mb-8 animate-fade-up">
          <p className="eyebrow">ONE REPO · TWO PERSONAS</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            같은 GitHub, 다른 결과
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-charcoal">
            하나의 레포 분석에서 <strong className="font-semibold text-ink">면접관</strong>은 원하는 질문
            성향(킬러·기본기·CS)으로 검증 질문을 뽑고,{" "}
            <strong className="font-semibold text-ink">취준생</strong>은 실제 면접 데이터 기반 빈출
            영역으로 대비합니다. 같은 커밋, 비대칭 노출.
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

        {/* Persona toggle — 세그먼트 */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-button text-graphite">
            페르소나
          </span>
          {(["interviewer", "jobseeker"] as Persona[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => switchPersona(p)}
              aria-pressed={persona === p}
              className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-button transition-colors ${
                persona === p
                  ? "border-ink bg-ink text-white"
                  : "border-hairline bg-canvas text-charcoal hover:border-steel"
              }`}
            >
              {p === "interviewer" ? "면접관 (B2B)" : "취준생 (B2C)"}
            </button>
          ))}
        </div>

        {/* Intent presets — interviewer only */}
        {persona === "interviewer" && (
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
                  <span className="block text-sm font-bold tracking-tight">
                    {it.label}
                  </span>
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
        )}

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

        {/* Results */}
        {!loading && !error && persona === "interviewer" && interviewer && (
          <InterviewerResult view={interviewer} intent={intent} />
        )}
        {!loading && !error && persona === "jobseeker" && jobseeker && (
          <JobseekerResult view={jobseeker} />
        )}

        {/* Empty */}
        {!loading && !error && !interviewer && !jobseeker && <EmptyState />}
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

      {/* 면접관 노트: 채점 신호 (B2C 비노출) */}
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

// ── 취준생 결과 ──────────────────────────────────────────────────────────
function JobseekerResult({ view }: { view: JobseekerView }) {
  return (
    <div className="space-y-6 animate-fade-up">
      <AnalysisReport report={view.report} />
      <StatStrip
        repoFullName={view.repoFullName}
        repoUrl={view.repoUrl}
        primaryLanguage={view.primaryLanguage}
        fileCount={view.summary.fileCount}
        right={`레포 ${view.repos.length} · 빈출 ${view.frequencyItems.length}`}
      />
      <ReposAnalyzed repos={view.repos} />

      <div className="rounded-xl border border-primary/30 bg-primary-soft/40 p-4">
        <p className="text-sm font-bold tracking-tight text-primary-deep">
          면접관이 자주 캐묻는 순서대로 대비하세요
        </p>
        <p className="mt-1 text-xs leading-relaxed text-charcoal">
          빈출도는 실제 면접관 라벨이 쌓일수록 정확해집니다(federated calibration).
          심화 추궁 질문과 채점 기준은{" "}
          <strong className="font-semibold text-ink">면접관 전용</strong>이라 공개되지 않습니다 —
          그래서 외워도 위조되지 않습니다.
        </p>
      </div>

      {view.coverage.note && <CoverageNote note={view.coverage.note} />}

      {view.frequencyItems.length === 0 ? (
        <p className="card p-6 text-sm leading-relaxed text-charcoal">
          빈출 영역을 충분히 찾지 못했습니다. 커밋이 더 많은 레포를 시도해 보세요.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {view.frequencyItems.map((item, i) => (
            <FrequencyCard key={`${item.category}-${i}`} item={item} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function FrequencyCard({ item, rank }: { item: FrequencyItem; rank: number }) {
  return (
    <article className="card flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs font-bold text-graphite">#{rank}</span>
          <span>
            <span className="block text-base font-bold tracking-tight text-ink">
              {item.label}
            </span>
            <span className="block font-mono text-[11px] text-graphite">{item.area}</span>
          </span>
        </div>
        <div className="text-right">
          <span className="font-mono text-lg font-bold text-primary">
            {item.frequencyPct}%
          </span>
          <span className="block text-[10px] uppercase tracking-button text-graphite">
            빈출도
          </span>
        </div>
      </div>

      {/* frequency bar */}
      <div
        className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-fog"
        role="img"
        aria-label={`빈출도 ${item.frequencyPct} 퍼센트`}
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${item.frequencyPct}%` }}
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Pill tone={item.fromRealLabels ? "primary" : "default"}>
          {item.fromRealLabels ? "실측 라벨" : "추정치(시드)"}
        </Pill>
        {item.repoNames && item.repoNames.length > 0 && (
          <span className="font-mono text-[11px] text-graphite">
            {item.repoNames.length > 1
              ? `레포 ${item.repoNames.length}곳`
              : item.repoNames[0]}
          </span>
        )}
      </div>

      {/* prep topics */}
      <div className="mt-3">
        <p className="text-[10px] font-bold uppercase tracking-button text-graphite">
          준비할 주제
        </p>
        <ul className="mt-1.5 space-y-1">
          {item.prepTopics.map((t, idx) => (
            <li key={idx} className="text-xs leading-relaxed text-ink">
              · {t}
            </li>
          ))}
        </ul>
      </div>

      {/* self-check */}
      <div className="mt-3 rounded-lg border border-primary/20 bg-primary-soft/40 p-3">
        <p className="text-[10px] font-bold uppercase tracking-button text-primary-deep">
          스스로 답해보기 (self-check)
        </p>
        <p className="mt-1 text-xs leading-relaxed text-ink">
          {item.selfCheckPrompt}
        </p>
      </div>

      <p className="mt-2.5 text-[11px] italic leading-relaxed text-graphite">
        {item.discriminatorNote}
      </p>

      <div className="mt-auto border-t border-hairline pt-2 font-mono text-[11px] text-graphite">
        근거: {item.evidenceFile ? `파일 ${item.evidenceFile}` : `영역 ${item.area}`}
        {item.evidenceCommits.length > 0 && (
          <>
            {" · 계기 "}
            <a
              href={item.evidenceCommits[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              title={item.evidenceCommits[0].message}
            >
              {item.evidenceCommits[0].sha7}
            </a>
          </>
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
      <p className="eyebrow">한 분석, 두 얼굴</p>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">
        같은 커밋을 양쪽이 다르게 본다
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-base font-bold tracking-tight text-ink">면접관 (B2B)</p>
          <p className="mt-1.5 text-sm leading-relaxed text-charcoal">
            성향을 골라(킬러·기본기·CS) 코드 영역에 대한 위조 불가능한 검증 질문 +
            채점 신호를 받습니다. 커밋·diff는 근거(계기)로 첨부됩니다.
          </p>
        </div>
        <div className="card p-5">
          <p className="text-base font-bold tracking-tight text-ink">취준생 (B2C)</p>
          <p className="mt-1.5 text-sm leading-relaxed text-charcoal">
            면접관이 자주 캐묻는 빈출 영역을 빈도순으로 보고, 스스로 답해보며
            대비합니다. 정답·추궁은 비공개.
          </p>
        </div>
      </div>
      <p className="mt-5 text-xs text-graphite">
        위에 GitHub URL을 넣고 페르소나·성향을 바꿔 보세요. 예:
        github.com/facebook/react
      </p>
    </section>
  );
}
