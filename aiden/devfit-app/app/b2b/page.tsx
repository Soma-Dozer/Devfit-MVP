import Link from "next/link";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { Seal } from "@/components/ui/Seal";
import { Pill } from "@/components/ui/Pill";
import { DiffHunk } from "@/components/ui/DiffHunk";
import { ChevronFlank } from "@/components/ui/Chevron";
import { Problem } from "@/components/landing/Problem";
import { Comparison } from "@/components/landing/Comparison";
import { Clearance } from "@/components/landing/Clearance";
import { HowItWorks } from "@/components/landing/HowItWorks";

export const metadata = {
  title: "velfit — 면접관용 검증 질문",
  description:
    "지원자 GitHub를 코드 영역 단위로 분석해, 원하는 성향(킬러·기본기·CS)으로 위조 불가능한 검증 질문과 채점 신호를 뽑습니다.",
};

// 면접관 콘솔(이 솔루션의 앱) — 모든 CTA가 향하는 단일 목적지.
const CONSOLE = "/b2b/app";

const EXHIBIT_DIFF =
  "@@ retryWithBackoff() @@\n- await sleep(1000);\n+ await sleep(2 ** attempt * 100);\n+ if (attempt >= MAX) throw new RetryError();";

const STATS: { value: string; label: string }[] = [
  { value: "71%", label: "‘AI로 역량 평가가 더 어려워졌다’ — 채용 리더" },
  { value: "5×", label: "기술 면접 AI 부정행위 2년간 증가" },
  { value: "5분", label: "지원자별 ‘물어볼 거리’ 확보까지" },
];

// 면접관이 의도(Intent)별로 캐물 수 있는 질문 성향 — 콘솔에서 바로 전환된다.
const INTENTS: { label: string; tagline: string; body: string }[] = [
  {
    label: "킬러",
    tagline: "떨어뜨리는 결정적 추궁",
    body: "코드 영역의 결정적 약점만 골라, 준비해도 위조할 수 없는 반사실·검증 함정 질문을 뽑습니다.",
  },
  {
    label: "기본 문법",
    tagline: "쓴 문법을 이해했는가",
    body: "지원자가 실제로 쓴 문법·API가 무엇을 하는지 본인 코드로 되짚어 묻습니다.",
  },
  {
    label: "CS 개념",
    tagline: "구현 뒤의 CS 원리",
    body: "구현 옆에 깔린 자료구조·동시성·복잡도 같은 CS 원리를 코드 근거와 함께 캐묻습니다.",
  },
];

/**
 * B2B(면접관) 랜딩 — HP 톤(순백 캔버스 · primary 단일 시그널).
 *
 * 공유 랜딩 컴포넌트 중 내부 링크가 /dashboard·/app 등을 가리키는 Hero·FinalCta는
 * 이 페이지에서 자체 섹션으로 대체하고, 모든 CTA·링크를 면접관 콘솔(/b2b/app)로 보낸다.
 * 링크가 없는 Problem·Comparison·Clearance·HowItWorks는 그대로 재사용한다.
 */
export default function B2bLanding() {
  return (
    <>
      <SiteHeader variant="landing" />

      <main>
        {/* ── Hero(면접관 프레이밍) — 자체 구성, CTA는 /b2b/app ── */}
        <section
          id="top"
          className="relative overflow-hidden border-b border-hairline bg-canvas"
        >
          <ChevronFlank />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            {/* Left — thesis */}
            <div className="animate-fade-up">
              <div className="flex items-center gap-2">
                <Pill tone="primary">B2B · 면접관</Pill>
                <span className="text-xs font-semibold uppercase tracking-button text-graphite">
                  EVIDENCE FROM GIT HISTORY
                </span>
              </div>
              <h1 className="mt-5 text-[clamp(40px,7vw,72px)] font-bold leading-[1.05] tracking-tight text-ink">
                AI가 해준게 아닌,
                <br />
                <span className="text-primary">알고 개발했는지</span>를 검증한다.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-charcoal">
                velfit은 지원자의 GitHub를 코드 영역 단위로 분석해,
                원하는 성향(킬러·기본기·CS)으로 준비해도 위조할 수 없는 검증 질문과
                채점 신호를 손에 쥐어 줍니다. 레포를 직접 파헤칠 필요가 없습니다.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={CONSOLE} className="btn-primary">
                  면접 콘솔 시작
                </Link>
                <a href="#how" className="btn-outline-ink">
                  작동 방식 보기
                </a>
              </div>
              <p className="mt-4 text-xs text-graphite">
                공개 GitHub URL 하나로 즉시 분석 ·{" "}
                <Link
                  href={CONSOLE}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  지원자 URL 분석하기 →
                </Link>
              </p>

              {/* Stat strip */}
              <dl className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-3">
                {STATS.map((s) => (
                  <div key={s.value} className="bg-canvas px-4 py-5">
                    <dt className="text-2xl font-bold tracking-tight text-primary">
                      {s.value}
                    </dt>
                    <dd className="mt-1 text-[11px] leading-snug text-graphite">
                      {s.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Right — 면접관에게 가는 Exhibit 견본(채점 신호 포함) */}
            <figure className="card animate-stamp p-5">
              <figcaption className="flex items-center justify-between gap-3 border-b border-hairline pb-3">
                <span className="text-xs font-semibold uppercase tracking-button text-graphite">
                  EXHIBIT · 버그 고고학
                </span>
                <Seal label="지원자 미노출" animate />
              </figcaption>

              <div className="mt-4">
                <DiffHunk diff={EXHIBIT_DIFF} />
              </div>

              <p className="mt-5 text-[15px] leading-relaxed text-ink">
                이 커밋이 고친 버그는 무엇이고 어떻게 재현되나요? 고정 1초 대기 대신
                지수 백오프로 바꾼 이유는?
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-primary/20 bg-primary/[0.06] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-button text-primary-deep">
                    ✓ 진짜라면
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-charcoal">
                    재현 시나리오와 백오프 채택 이유를 자기 말로 설명한다.
                  </p>
                </div>
                <div className="rounded-lg border border-error/30 bg-error/[0.06] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-button text-error">
                    ✗ 위조 의심
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-charcoal">
                    일반론만 반복하고 본인 커밋 맥락을 짚지 못한다.
                  </p>
                </div>
              </div>

              <p className="mt-4 border-t border-hairline pt-3 font-mono text-xs text-graphite">
                ↳ commit a1f9c2 · payments/retry.ts:31
              </p>
            </figure>
          </div>
        </section>

        {/* ── 문제 / 비교 — 링크 없는 공유 섹션 그대로 재사용 ── */}
        <Problem />
        <Comparison />

        {/* ── 의도(Intent) 커스텀 — 면접관 고유 가치 강조(자체 섹션) ── */}
        <section
          id="intent"
          className="border-t border-hairline bg-canvas"
        >
          <div className="mx-auto max-w-6xl px-5 py-24">
            <div className="animate-fade-up">
              <p className="eyebrow">질문 성향 커스텀</p>
              <h2 className="mt-4 max-w-3xl text-[clamp(28px,4vw,40px)] font-bold leading-tight tracking-tight text-ink">
                같은 분석 1회 — 무엇을 캐물지는 당신이 고릅니다.
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal">
                의도축과 노출축은 직교합니다. 한 번의 분석으로 지원자 코드 영역에서
                성향별로 다른 검증 질문을 뽑아내세요.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {INTENTS.map((it) => (
                <article key={it.label} className="card flex flex-col p-6">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold tracking-tight text-ink">
                      {it.label}
                    </span>
                    <Pill tone="primary">{it.tagline}</Pill>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-charcoal">
                    {it.body}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-10">
              <Link href={CONSOLE} className="btn-outline-ink">
                콘솔에서 성향 바꿔보기
              </Link>
            </div>
          </div>
        </section>

        {/* ── 클리어런스 / 작동 방식 — 링크 없는 공유 섹션 그대로 재사용 ── */}
        <Clearance />
        <HowItWorks />

        {/* ── Final CTA(자체 구성, /b2b/app) — 공유 FinalCta는 /dashboard라 미사용 ── */}
        <section id="cta" className="slab border-t border-hairline">
          <div className="mx-auto max-w-6xl px-5 py-24 text-center">
            <h2 className="animate-fade-up mx-auto max-w-3xl text-[clamp(28px,4vw,40px)] font-bold leading-tight tracking-tight text-white">
              지원자의 코드가, 스스로를 증명하게 하세요.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/80">
              GitHub URL 하나를 넣으면, 위조 불가능한 검증 질문과 채점 신호가
              면접관 콘솔에 뜹니다.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href={CONSOLE} className="btn-primary">
                면접 콘솔 시작
              </Link>
            </div>
            <p className="mt-5 text-xs text-white/70">
              공개 레포 기반 분석 · LLM 0회 · 결정론 조준.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
