import Link from "next/link";
import { Seal } from "@/components/ui/Seal";
import { DiffHunk } from "@/components/ui/DiffHunk";
import { ChevronFlank } from "@/components/ui/Chevron";

const EXHIBIT_DIFF =
  "@@ retryWithBackoff() @@\n- await sleep(1000);\n+ await sleep(2 ** attempt * 100);\n+ if (attempt >= MAX) throw new RetryError();";

const STATS: { value: string; label: string }[] = [
  { value: "71%", label: "‘AI로 역량 평가가 더 어려워졌다’ — 채용 리더" },
  { value: "5×", label: "기술 면접 AI 부정행위 2년간 증가" },
  { value: "5분", label: "지원자별 ‘물어볼 거리’ 확보까지" },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-hairline bg-canvas">
      <ChevronFlank />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        {/* Left — thesis */}
        <div className="animate-fade-up">
          <p className="eyebrow">EVIDENCE FROM GIT HISTORY</p>
          <h1 className="mt-5 text-[clamp(40px,7vw,72px)] font-bold leading-[1.05] tracking-tight text-ink">
            AI가 짰는지가 아니라,
            <br />
            <span className="text-primary">알고 짰는지</span>를 증명한다.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-charcoal">
            velfit은 지원자의 GitHub 커밋·Diff·PR을 증거로 삼아, 면접관이 코드
            베이스를 직접 파헤치지 않고도 이력서 주장과 실제 코드의 일치, 그리고
            준비해도 위조할 수 없는 검증 질문을 손에 쥐게 합니다.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/dashboard" className="btn-primary">
              면접 콘솔 시작
            </Link>
            <a href="#how" className="btn-outline-ink">
              작동 방식 보기
            </a>
          </div>
          <p className="mt-4 text-xs text-graphite">
            또는 가입 없이{" "}
            <Link href="/app" className="font-medium text-primary underline-offset-2 hover:underline">
              빠른 분석 체험 →
            </Link>
          </p>

          {/* Stat strip */}
          <dl className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.value} className="bg-canvas px-4 py-5">
                <dt className="text-2xl font-bold tracking-tight text-primary">{s.value}</dt>
                <dd className="mt-1 text-[11px] leading-snug text-graphite">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right — the signature Exhibit specimen */}
        <figure className="card animate-stamp p-5">
          <figcaption className="flex items-center justify-between gap-3 border-b border-hairline pb-3">
            <span className="text-xs font-semibold uppercase tracking-button text-graphite">
              EXHIBIT B · 버그 고고학
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

          <p className="mt-4 border-t border-hairline pt-3 font-mono text-xs text-graphite">
            ↳ commit a1f9c2 · payments/retry.ts:31
          </p>
        </figure>
      </div>
    </section>
  );
}
