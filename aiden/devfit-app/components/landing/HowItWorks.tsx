const STEPS: { ref: string; title: string; body: string }[] = [
  {
    ref: "STEP 01",
    title: "레포 연동 & 비동기 분석",
    body: "GitHub 연동 후 분석 큐에 등록. 야간 배치로 비용을 줄이고 완료 시 알림.",
  },
  {
    ref: "STEP 02",
    title: "의미 있는 코드 스니펫 추출",
    body: "핵심 구현·성능·트러블슈팅·구조 변경 Diff만 골라냅니다. 이 추출 품질이 핵심 경쟁력.",
  },
  {
    ref: "STEP 03",
    title: "이력서 ↔ 실제 코드 매핑",
    body: "‘DB 최적화 40%’ 주장 옆에 근거 커밋·Diff를 붙입니다.",
  },
  {
    ref: "STEP 04",
    title: "위조 불가능한 검증 질문 생성",
    body: "프로젝트와 연결된 질문을 3계층으로. 채점 신호까지 함께.",
  },
  {
    ref: "STEP 05",
    title: "면접관 대시보드",
    body: "이력서·스니펫·질문·근거 코드를 한 화면에서. 근거로 즉시 이동.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-t border-hairline bg-canvas">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="animate-fade-up">
          <p className="eyebrow">작동 방식</p>
          <h2 className="mt-4 max-w-3xl text-[clamp(28px,4vw,40px)] font-bold leading-tight tracking-tight text-ink">
            레포 주소 하나로, 면접 준비가 끝납니다.
          </h2>
        </div>

        <ol className="mt-14 divide-y divide-hairline border-y border-hairline">
          {STEPS.map((s) => (
            <li
              key={s.ref}
              className="grid gap-2 py-6 md:grid-cols-[140px_1fr] md:gap-8"
            >
              <span className="text-xs font-semibold uppercase tracking-button text-primary">
                {s.ref}
              </span>
              <div>
                <h3 className="text-lg font-bold leading-snug tracking-tight text-ink">
                  {s.title}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
