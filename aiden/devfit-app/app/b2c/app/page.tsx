"use client";

import { useState } from "react";
import { B2CHeader } from "@/components/b2c/B2CHeader";
import { B2CFooter } from "@/components/b2c/B2CFooter";
import type {
  AnalyzedRepo,
  DuoResponse,
  FrequencyItem,
  GitHubReport,
  JobseekerView,
} from "@/lib/engine/types";

export default function B2CAppPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<JobseekerView | null>(null);
  const [touched, setTouched] = useState(false);

  async function run(target: string) {
    if (!target || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/duo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target, persona: "jobseeker" }),
      });
      const data: DuoResponse = await res.json();
      if (!data.ok || !data.jobseeker) {
        setError(data.error ?? "분석 결과를 가져오지 못했어요.");
        setView(null);
        return;
      }
      setView(data.jobseeker);
    } catch {
      setError("요청에 실패했어요. 네트워크 상태를 확인해 주세요.");
      setView(null);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setView(null);
    setError(null);
    run(url.trim());
  }

  return (
    <>
      <B2CHeader />
      <main className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
        {/* Title */}
        <div className="mb-8">
          <p className="ab-eyebrow">내 깃허브로 면접 준비</p>
          <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-tight text-warmink sm:text-[34px]">
            내 코드에서 면접관이 가장 자주 캐묻는 곳
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-warmbody">
            GitHub 프로필이나 레포 주소만 넣으면, 실제 면접 데이터를 바탕으로{" "}
            <strong className="font-semibold text-warmink">빈출 영역</strong>을 빈도순으로
            정리해 드려요. 외우는 정답집이 아니라, 직접 답해보며 대비하는 도구예요.
          </p>
        </div>

        {/* Input */}
        <form onSubmit={onSubmit} className="mb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              inputMode="url"
              autoComplete="off"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              placeholder="https://github.com/내아이디 또는 내아이디/레포"
              aria-label="GitHub URL 또는 프로필"
              className="ab-input flex-1 font-mono text-[15px] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || url.trim().length === 0}
              className="ab-btn-primary shrink-0 disabled:opacity-50"
            >
              {loading ? "분석 중…" : "분석하기"}
            </button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-warmmuted">
            공개 GitHub API만 사용해요(키 불필요). 커밋과 코드 영역을 결정론으로
            분석합니다 · 예: github.com/내아이디
          </p>
        </form>

        {/* Loading */}
        {loading && (
          <div role="status" className="ab-card p-6">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="h-5 w-5 animate-spin rounded-full border-2 border-rausch/30 border-t-rausch"
              />
              <p className="text-sm font-semibold text-rausch">
                내 코드를 살펴보는 중이에요…
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            role="alert"
            className="ab-card border border-rausch/30 p-6"
          >
            <p className="text-lg font-bold tracking-tight text-warmink">
              분석에 실패했어요
            </p>
            <p className="mt-1 text-sm leading-relaxed text-warmbody">{error}</p>
          </div>
        )}

        {/* Results */}
        {!loading && !error && view && <JobseekerResult view={view} />}

        {/* Empty */}
        {!loading && !error && !view && <EmptyState touched={touched} />}
      </main>
      <B2CFooter />
    </>
  );
}

// ── 상단 분석 리포트 (내 GitHub 전체 + 대표 레포) ─────────────────────────
function AnalysisReport({ report }: { report: GitHubReport }) {
  const { account, primary } = report;
  return (
    <section
      aria-label="GitHub 분석 리포트"
      className="grid grid-cols-1 gap-4 lg:grid-cols-2"
    >
      {/* 내 GitHub 전체 */}
      <div className="ab-card p-6">
        <p className="ab-eyebrow">내 GitHub 한눈에</p>
        <p className="mt-2 text-[15px] font-medium leading-relaxed text-warmink">
          {account.headline}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-warmmuted">
          <span>레포 {account.reposAnalyzed}</span>
          <span className="text-warmline">·</span>
          <span>파일 {account.totalFiles.toLocaleString()}</span>
          {account.languages.length > 0 && (
            <>
              <span className="text-warmline">·</span>
              <span>{account.languages.slice(0, 3).join(" / ")}</span>
            </>
          )}
        </div>
        {account.topAreas.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-warmmuted">
              두드러진 작업
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {account.topAreas.map((t) => (
                <li key={t.category}>
                  <span className="ab-pill-primary">
                    {t.label} · {t.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 대표 레포지토리 */}
      <div className="ab-card p-6">
        <p className="ab-eyebrow">대표 레포지토리</p>
        <a
          href={primary.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block font-mono text-[15px] font-semibold text-rausch hover:underline"
        >
          {primary.fullName}
        </a>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-warmmuted">
          {primary.primaryLanguage && (
            <>
              <span>{primary.primaryLanguage}</span>
              <span className="text-warmline">·</span>
            </>
          )}
          <span>파일 {primary.fileCount.toLocaleString()}</span>
          <span className="text-warmline">·</span>
          <span>★ {primary.stars.toLocaleString()}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-warmbody">
          {primary.headline}
        </p>
        {primary.topAreas.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-warmmuted">
              핵심 영역
            </p>
            <ul className="mt-2 space-y-1.5">
              {primary.topAreas.map((t, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-center gap-2 text-sm text-warmink"
                >
                  <span className="font-mono text-warmbody">{t.area}</span>
                  <span className="ab-pill">{t.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

// ── 취준생 결과 ──────────────────────────────────────────────────────────
function JobseekerResult({ view }: { view: JobseekerView }) {
  return (
    <div className="space-y-6">
      <AnalysisReport report={view.report} />

      {/* 요약 스트립 */}
      <section
        aria-label="분석 요약"
        className="flex flex-wrap items-center justify-between gap-2 border-b border-warmline-soft pb-4"
      >
        <a
          href={view.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[15px] font-medium text-rausch hover:underline"
        >
          {view.repoFullName}
        </a>
        <p className="text-sm text-warmmuted">
          {view.primaryLanguage && (
            <>
              <span className="text-warmink">{view.primaryLanguage}</span>
              <span className="mx-2 text-warmline">·</span>
            </>
          )}
          <span className="text-warmink">파일 {view.summary.fileCount}</span>
          <span className="mx-2 text-warmline">·</span>
          <span className="text-warmink">빈출 {view.frequencyItems.length}</span>
        </p>
      </section>

      <ReposAnalyzed repos={view.repos} />

      {/* 안내 배너 (rausch-soft 톤) */}
      <div className="rounded-[16px] border border-rausch/30 bg-rausch-soft/40 p-5">
        <p className="text-base font-bold tracking-tight text-warmink">
          자주 캐묻는 순서대로 대비하세요
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-warmbody">
          실제 면접 데이터가 쌓일수록 빈출도는 더 정확해져요. 정답을 떠먹여 주는
          대신 스스로 설명해보게 해, 외워서가 아니라 직접 해본 실력으로 준비됩니다.
        </p>
      </div>

      {/* 저신호 안내 */}
      {view.coverage.note && <CoverageNote note={view.coverage.note} />}

      {/* 빈출 영역 카드 그리드 */}
      {view.frequencyItems.length === 0 ? (
        <div className="ab-card p-8 text-center">
          <p className="text-base font-semibold text-warmink">
            빈출 영역을 충분히 찾지 못했어요
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-warmmuted">
            커밋이 더 많은 레포나 프로필 전체 주소로 다시 시도해 보세요.
          </p>
        </div>
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
    <article className="ab-card flex h-full flex-col p-6">
      {/* 헤더: 순위 · 라벨 · 빈출도 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-warmsoft font-mono text-sm font-bold text-warmink">
            {rank}
          </span>
          <span>
            <span className="block text-lg font-bold tracking-tight text-warmink">
              {item.label}
            </span>
            <span className="block font-mono text-xs text-warmmuted">
              {item.area}
            </span>
          </span>
        </div>
        <div className="text-right">
          <span className="font-mono text-xl font-bold text-rausch">
            {item.frequencyPct}%
          </span>
          <span className="block text-[10px] uppercase tracking-[0.04em] text-warmmuted">
            빈출도
          </span>
        </div>
      </div>

      {/* 빈출도 막대 (rausch) */}
      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-warmsoft"
        role="img"
        aria-label={`빈출도 ${item.frequencyPct} 퍼센트`}
      >
        <div
          className="h-full rounded-full bg-rausch"
          style={{ width: `${item.frequencyPct}%` }}
        />
      </div>

      {/* 추정치/실측 칩 + 레포 */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={item.fromRealLabels ? "ab-chip-active" : "ab-chip"}>
          {item.fromRealLabels ? "실측 라벨" : "추정치(시드)"}
        </span>
        {item.repoNames && item.repoNames.length > 0 && (
          <span className="font-mono text-xs text-warmmuted">
            {item.repoNames.length > 1
              ? `레포 ${item.repoNames.length}곳`
              : item.repoNames[0]}
          </span>
        )}
      </div>

      {/* 준비할 주제 */}
      {item.prepTopics.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-warmmuted">
            준비할 주제
          </p>
          <ul className="mt-2 space-y-1.5">
            {item.prepTopics.map((t, idx) => (
              <li
                key={idx}
                className="flex gap-2 text-sm leading-relaxed text-warmink"
              >
                <span aria-hidden="true" className="text-rausch">
                  ·
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 스스로 답해보기 (warmsoft 박스) */}
      <div className="mt-4 rounded-[12px] bg-warmsoft p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-rausch">
          스스로 답해보기
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-warmink">
          {item.selfCheckPrompt}
        </p>
      </div>

      {/* 변별 노트 */}
      <p className="mt-3 text-xs italic leading-relaxed text-warmmuted">
        {item.discriminatorNote}
      </p>

      {/* 근거 (파일 + 계기 커밋) */}
      <div className="mt-auto border-t border-warmline-soft pt-3 font-mono text-xs text-warmmuted">
        근거:{" "}
        {item.evidenceFile ? `파일 ${item.evidenceFile}` : `영역 ${item.area}`}
        {item.evidenceCommits.length > 0 && (
          <span className="ml-1 inline-flex flex-wrap items-center gap-x-2">
            <span className="text-warmline">·</span>
            {item.evidenceCommits.slice(0, 3).map((c) => (
              <a
                key={c.sha}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-rausch hover:underline"
                title={c.message}
              >
                ↳ {c.sha7}
              </a>
            ))}
          </span>
        )}
      </div>
    </article>
  );
}

// ── 공용 ────────────────────────────────────────────────────────────────
/** 분석에 포함된 레포 칩 — 멀티레포(프로필)일 때만 표시. */
function ReposAnalyzed({ repos }: { repos: AnalyzedRepo[] }) {
  if (!repos || repos.length <= 1) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-warmmuted">
        분석한 레포 {repos.length}
      </span>
      {repos.map((r) => (
        <a
          key={r.fullName}
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-warmline bg-white px-3 py-1.5 font-mono text-xs text-warmbody transition-colors hover:border-rausch/40"
        >
          {r.fullName}
          <span className="text-warmmuted">· {r.cardCount}영역</span>
        </a>
      ))}
    </div>
  );
}

function CoverageNote({ note }: { note: string }) {
  return (
    <div className="rounded-[16px] border border-warmline bg-warmsoft p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-rausch">
        솔직 보고 · 신호가 적어요
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-warmbody">{note}</p>
    </div>
  );
}

function EmptyState({ touched }: { touched: boolean }) {
  return (
    <section className="ab-card-outline p-8 sm:p-10">
      <p className="ab-eyebrow">시작하기</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-warmink">
        내 커밋이 곧 내 면접 준비
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-warmbody">
        {touched
          ? "주소를 다시 확인해 주세요. GitHub 프로필이나 레포 주소를 넣으면 빈출 영역을 정리해 드려요."
          : "위에 GitHub 주소를 넣고 분석을 눌러보세요. 면접관이 자주 캐묻는 영역을 빈도순으로 보여드려요."}
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[16px] bg-warmsoft p-5">
          <p className="text-base font-semibold tracking-tight text-warmink">
            빈출 영역
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-warmbody">
            면접관이 자주 캐묻는 코드 영역을 빈도순으로 확인해요.
          </p>
        </div>
        <div className="rounded-[16px] bg-warmsoft p-5">
          <p className="text-base font-semibold tracking-tight text-warmink">
            스스로 답해보기
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-warmbody">
            정답집이 아니라, 직접 설명해보며 진짜 이해를 점검해요.
          </p>
        </div>
        <div className="rounded-[16px] bg-warmsoft p-5">
          <p className="text-base font-semibold tracking-tight text-warmink">
            외워서 X · 이해로 O
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-warmbody">
            정답 대신 '스스로 설명해보기'로, 직접 해본 사람만 답할 수 있게.
          </p>
        </div>
      </div>
      <p className="mt-6 text-sm text-warmmuted">예: github.com/내아이디</p>
    </section>
  );
}
