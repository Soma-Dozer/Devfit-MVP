const PAINS: { ref: string; title: string; body: string }[] = [
  {
    ref: "01",
    title: "포트폴리오만으로는 더 이상 검증되지 않는다",
    body: "AI로 코드·README·기술 블로그를 다 만들 수 있게 되면서 ‘포장’의 변별력이 사라졌습니다. 프로젝트는 그럴듯한데 트러블슈팅도, 기술 선택 이유도 설명 못 하는 지원자가 빠르게 늘고 있습니다.",
  },
  {
    ref: "02",
    title: "모든 레포를 깊게 보는 건 비용이 너무 크다",
    body: "지원자 한 명의 레포·커밋·Diff·PR을 전부 읽는 시간은 막대합니다. 전담 ATS·인사팀이 없는 스타트업일수록 그 부담을 실무자가 그대로 떠안습니다.",
  },
  {
    ref: "03",
    title: "이력서 기반 질문은 실제 구현과 겉돈다",
    body: "추상적 질문은 지원자가 실제로 무엇을 짰는지와 연결되지 않습니다. 결국 ‘사람을 뽑는 건지, AI 클론을 뽑는 건지’ 확신할 수 없습니다.",
  },
];

export function Problem() {
  return (
    <section id="problem" className="surface-cloud border-t border-hairline">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="animate-fade-up">
          <p className="eyebrow">왜 지금인가</p>
          <h2 className="mt-4 max-w-3xl text-[clamp(28px,4vw,40px)] font-bold leading-tight tracking-tight text-ink">
            바이브 코딩 시대, 면접관은 무엇을 믿어야 할지 모릅니다.
          </h2>
        </div>

        <ol className="mt-14 grid gap-5 md:grid-cols-3">
          {PAINS.map((p) => (
            <li key={p.ref} className="card flex flex-col p-6">
              <span className="text-sm font-bold uppercase tracking-button text-primary">
                {p.ref}
              </span>
              <h3 className="mt-3 text-lg font-bold leading-snug tracking-tight text-ink">
                {p.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-charcoal">{p.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
