import { getDb } from "@/lib/db";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { Pill } from "@/components/ui/Pill";
import { Seal } from "@/components/ui/Seal";
import { SubmitForm } from "@/components/submit/SubmitForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SubmitPage({
  params,
}: {
  params: { linkId: string };
}) {
  const db = getDb();
  const link = await db.getLink(params.linkId);

  // ── Invalid / expired link ────────────────────────────────────
  if (!link) {
    return (
      <div className="min-h-screen bg-canvas">
        <SiteHeader variant="app" />
        <main className="mx-auto flex max-w-2xl flex-col px-5 py-24">
          <section
            aria-labelledby="invalid-title"
            className="card p-8 text-center"
          >
            <p className="eyebrow mb-3">면접 과제 제출</p>
            <h1
              id="invalid-title"
              className="text-2xl font-bold tracking-tight text-ink"
            >
              유효하지 않은 링크입니다
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-charcoal">
              링크가 만료되었거나 주소가 잘못되었을 수 있습니다. 면접 담당자에게
              받은 링크를 다시 확인해 주세요.
            </p>
          </section>
        </main>
      </div>
    );
  }

  const existing = await db.getSubmission(params.linkId);

  // ── Already submitted ─────────────────────────────────────────
  if (existing) {
    return (
      <div className="min-h-screen bg-canvas">
        <SiteHeader variant="app" />
        <main className="mx-auto flex max-w-2xl flex-col px-5 py-24">
          <section
            aria-labelledby="done-title"
            className="card p-8"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="eyebrow">면접 과제 제출</p>
              <Seal label="제출 완료" />
            </div>
            <h1
              id="done-title"
              className="text-2xl font-bold tracking-tight text-ink"
            >
              제출이 완료되었습니다
            </h1>
            <p className="mt-3 text-sm text-charcoal">
              <span className="font-medium text-ink">{existing.name}</span> 님
            </p>
            <p className="mt-4 text-sm leading-relaxed text-charcoal">
              분석이 진행 중이거나 완료되었습니다. 이 창은 닫으셔도 됩니다.
            </p>
          </section>
        </main>
      </div>
    );
  }

  // ── Intro + form ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-canvas">
      <SiteHeader variant="app" />
      <main className="mx-auto flex max-w-2xl flex-col px-5 py-16 sm:py-24">
        <section aria-labelledby="intro-title">
          <p className="eyebrow mb-3">면접 과제 제출</p>
          <h1
            id="intro-title"
            className="text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl"
          >
            코드로 증명할 시간입니다.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-charcoal">
            제출해 주신 공개 GitHub의 커밋 기록을 분석해, 면접에서 함께 이야기할
            기술 주제를 준비합니다. 분석은 공개된 저장소만을 대상으로 하며, 코드를
            평가하기 위한 것이 아니라 여러분이 직접 풀어낸 문제를 면접에서 제대로
            설명할 기회를 드리기 위한 것입니다.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-label text-graphite">
              지원 포지션
            </span>
            <Pill tone="primary">{link.positionLabel}</Pill>
          </div>
        </section>

        <div className="mt-10">
          <SubmitForm
            linkId={params.linkId}
            positionLabel={link.positionLabel}
          />
        </div>
      </main>
    </div>
  );
}
