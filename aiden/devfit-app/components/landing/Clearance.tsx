import { Seal } from "@/components/ui/Seal";

export function Clearance() {
  return (
    <section id="layers" className="surface-cloud border-t border-hairline">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="animate-fade-up">
          <p className="eyebrow">3계층 = 클리어런스 레벨</p>
          <h2 className="mt-4 max-w-3xl text-[clamp(28px,4vw,40px)] font-bold leading-tight tracking-tight text-ink">
            노출돼도 안전한 질문과, 봉인된 질문을 나눕니다.
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {/* L1 — 공개, no seal */}
          <article className="card p-6">
            <span className="text-xs font-semibold uppercase tracking-button text-graphite">
              L1 공개
            </span>
            <p className="mt-4 text-sm leading-relaxed text-charcoal">
              주제·개념 워밍업. 지원자와 함께 봐도 무방.
            </p>
          </article>

          {/* L2 — 봉인, accent primary border + seal */}
          <article className="card border-primary p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-button text-primary">
                L2 봉인
              </span>
              <Seal />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-charcoal">
              반사실·버그 고고학·검증 함정 — 준비해도 위조 불가능.
            </p>
          </article>

          {/* L3 — 라이브, seal */}
          <article className="card border-primary p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-button text-primary">
                L3 라이브
              </span>
              <Seal label="라이브 전용" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-charcoal">
              현장 즉석 코드 수정. 사전 텍스트화 원천 불가.
            </p>
          </article>
        </div>

        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-charcoal">
          변별력을 ‘숨기기’가 아니라 ‘준비해도 못 속이는 깊이’로 옮깁니다.
        </p>
      </div>
    </section>
  );
}
