import Link from "next/link";
import { headers } from "next/headers";
import type { InterviewQuestion } from "@/lib/types";
import { getDb } from "@/lib/db";
import { readOwnerToken } from "@/lib/owner";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { Seal } from "@/components/ui/Seal";
import { Pill } from "@/components/ui/Pill";
import { QuestionCard } from "@/components/QuestionCard";

// Re-read the DB on every request so analysis status / results reflect the
// latest state when the interviewer hits 새로고침.
export const dynamic = "force-dynamic";

type Layer = 1 | 2 | 3;

const CLEARANCE: Record<Layer, { title: string; blurb: string; sealed: boolean }> = {
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

function originFromHeaders(): string {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "";
}

/** Quiet centered panel used for not-found / access-denied states. */
function Notice({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <>
      <SiteHeader variant="app" />
      <main className="mx-auto max-w-6xl px-5 py-16">
        <div className="card p-8 animate-fade-up">
          <h1 className="text-xl font-bold tracking-tight text-ink">
            {title}
          </h1>
          <div className="mt-2 text-sm leading-relaxed text-charcoal">
            {body}
          </div>
          <Link href="/dashboard" className="btn-outline-ink mt-6 h-9 px-4 text-xs">
            ← 면접 콘솔로
          </Link>
        </div>
      </main>
    </>
  );
}

export default async function LinkDetailPage({
  params,
}: {
  params: { linkId: string };
}) {
  const db = getDb();
  const token = readOwnerToken();
  const link = await db.getLink(params.linkId);

  if (!link) {
    return <Notice title="존재하지 않는 링크" body="요청하신 면접 링크를 찾을 수 없습니다." />;
  }

  if (!token || link.ownerToken !== token) {
    return (
      <Notice
        title="접근 권한 없음"
        body="이 면접 링크에 접근할 권한이 없습니다."
      />
    );
  }

  const sub = await db.getSubmission(params.linkId);
  const origin = originFromHeaders();
  const submitUrl = `${origin}/submit/${link.id}`;

  // Group analysis questions by clearance level (mirrors /app).
  const grouped: Record<Layer, InterviewQuestion[]> = { 1: [], 2: [], 3: [] };
  if (sub?.analysisStatus === "done" && sub.analysis) {
    for (const q of sub.analysis.questions) {
      grouped[q.layer as Layer].push(q);
    }
  }

  return (
    <>
      <SiteHeader variant="app" />

      <main className="mx-auto max-w-6xl px-5 py-16">
        {/* Header — dark slab anchors the candidate */}
        <div className="mb-12 animate-fade-up">
          <Link
            href="/dashboard"
            className="inline-block text-xs font-semibold uppercase tracking-button text-graphite transition-colors hover:text-ink"
          >
            ← 면접 콘솔
          </Link>
          <div className="slab mt-4 rounded-xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {link.positionLabel}
              </h1>
              <Pill tone={link.status === "submitted" ? "primary" : "default"}>
                {link.status === "submitted" ? "제출됨" : "대기 중"}
              </Pill>
            </div>
            <code className="mt-4 inline-block max-w-full truncate rounded-md border border-white/15 bg-white/[0.06] px-3 py-2 font-mono text-xs text-white/70">
              {submitUrl}
            </code>
          </div>
        </div>

        {/* No submission yet */}
        {!sub && (
          <section className="card p-8 animate-fade-up">
            <p className="eyebrow">AWAITING SUBMISSION</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">
              아직 후보가 제출하지 않았습니다.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal">
              아래 공유 링크를 후보에게 보내세요. 제출되면 이 페이지에 표시됩니다.
            </p>
            <code className="mt-4 block max-w-full truncate rounded-md border border-hairline bg-cloud px-3 py-2 font-mono text-xs text-ink">
              {submitUrl}
            </code>
            <Link
              href={`/dashboard/${link.id}`}
              className="btn-outline mt-6 h-9 px-4 text-xs"
            >
              새로고침
            </Link>
          </section>
        )}

        {/* Submission present */}
        {sub && (
          <div className="space-y-16">
            {/* Candidate submission */}
            <section aria-labelledby="sub-heading" className="animate-fade-up">
              <h2
                id="sub-heading"
                className="mb-4 text-xs font-semibold uppercase tracking-button text-graphite"
              >
                제출 정보
              </h2>
              <dl className="grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline shadow-lift sm:grid-cols-2">
                <Field label="이름" value={sub.name} />
                <Field label="이메일" value={sub.email} />
                <Field label="지원 포지션" value={sub.position} />
                <Field
                  label="GitHub"
                  value={
                    <a
                      href={sub.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-primary transition-colors hover:text-primary-deep hover:underline"
                    >
                      {sub.githubUrl}
                    </a>
                  }
                />
                <div className="bg-canvas p-5 sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-button text-graphite">
                    강조한 점
                  </dt>
                  <dd className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                    {sub.claims || "—"}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Analysis lifecycle */}
            <section aria-labelledby="analysis-heading" className="space-y-10">
              <h2
                id="analysis-heading"
                className="text-2xl font-bold tracking-tight text-ink"
              >
                코드 분석
              </h2>

              {(sub.analysisStatus === "pending" ||
                sub.analysisStatus === "running" ||
                sub.analysisStatus === "empty") && (
                <div
                  role="status"
                  aria-live="polite"
                  className="card p-8 animate-fade-up"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
                    />
                    <Seal label="분석 중" />
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-charcoal">
                    코드 분석이 진행 중입니다. 보통 10~40초 걸립니다.
                  </p>
                  <Link
                    href={`/dashboard/${link.id}`}
                    className="btn-outline mt-6 h-9 px-4 text-xs"
                  >
                    새로고침
                  </Link>
                </div>
              )}

              {sub.analysisStatus === "error" && (
                <div
                  role="alert"
                  className="rounded-xl border border-error/30 bg-error/[0.08] p-5 text-error animate-fade-up"
                >
                  <p className="text-base font-bold">분석에 실패했습니다</p>
                  <p className="mt-1 text-sm leading-relaxed">
                    {sub.analysisError ?? "알 수 없는 오류가 발생했습니다."}
                  </p>
                </div>
              )}

              {sub.analysisStatus === "done" && sub.analysis && (
                <div className="space-y-12 animate-fade-up">
                  {/* Stat strip */}
                  <p className="text-xs font-semibold uppercase tracking-button text-graphite">
                    <span className="text-ink">레포 {sub.analysis.repos.length}</span>
                    <span className="mx-2 text-steel">·</span>
                    <span className="text-ink">커밋 {sub.analysis.commitsAnalyzed}</span>
                    <span className="mx-2 text-steel">·</span>
                    <span className="text-ink">스택 {sub.analysis.techStack.length}</span>
                  </p>

                  {/* Tech stack */}
                  {sub.analysis.techStack.length > 0 && (
                    <section aria-labelledby="tech-heading">
                      <h3
                        id="tech-heading"
                        className="mb-4 text-xs font-semibold uppercase tracking-button text-graphite"
                      >
                        기술 스택
                      </h3>
                      <ul className="flex flex-wrap gap-2">
                        {sub.analysis.techStack.map((t) => (
                          <li key={t}>
                            <Pill>{t}</Pill>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Repos */}
                  {sub.analysis.repos.length > 0 && (
                    <section aria-labelledby="repos-heading">
                      <h3
                        id="repos-heading"
                        className="mb-4 text-xs font-semibold uppercase tracking-button text-graphite"
                      >
                        분석한 레포지토리
                      </h3>
                      <ul className="space-y-3">
                        {sub.analysis.repos.map((repo) => (
                          <li
                            key={repo.fullName}
                            className="card p-5"
                          >
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
                                ⭐ {repo.stars.toLocaleString()}
                              </span>
                            </div>
                            {repo.description && (
                              <p className="mt-2 text-sm leading-relaxed text-charcoal">
                                {repo.description}
                              </p>
                            )}
                            {repo.language && (
                              <div className="mt-3">
                                <Pill>{repo.language}</Pill>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Exhibits by clearance level */}
                  <section aria-labelledby="exhibits-heading" className="space-y-10">
                    <h3
                      id="exhibits-heading"
                      className="text-2xl font-bold tracking-tight text-ink"
                    >
                      증거 목록
                    </h3>

                    {([1, 2, 3] as Layer[]).map((layer) => {
                      const items = grouped[layer];
                      if (items.length === 0) return null;
                      const meta = CLEARANCE[layer];
                      return (
                        <div key={layer}>
                          <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                            <h4 className="text-sm font-semibold uppercase tracking-button text-primary">
                              CLEARANCE L{layer}
                            </h4>
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
                                highlight={q.layer === 2}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </section>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-canvas p-5">
      <dt className="text-xs font-semibold uppercase tracking-button text-graphite">{label}</dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-ink">{value}</dd>
    </div>
  );
}
