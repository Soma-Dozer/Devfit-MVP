const ROWS: [string, string, string][] = [
  ["코딩테스트·역량평가", "HackerRank, 프로그래머스", "합성 문제로 평가 — 실제 코드 미분석"],
  ["AI 면접관·IaaS", "Karat, Mercor", "라이브 면접 — 과거 커밋·Diff 미분석"],
  ["GitHub 소싱", "Reczee, Fonzi", "목적이 후보 ‘발굴’ — 검증 아님"],
  ["코드 출처 탐지", "Git AI, Agent-Trace", "‘AI가 짰는지’ 추적 — 이해 깊이 검증 아님"],
];

export function Comparison() {
  return (
    <section id="compare" className="border-t border-hairline bg-canvas">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 lg:px-10">
        <div className="animate-fade-up">
          <p className="eyebrow">화이트 스페이스</p>
          <h2 className="mt-4 max-w-3xl text-[clamp(28px,4vw,40px)] font-bold leading-tight tracking-tight text-ink">
            ‘실제 코드 기반 × 면접 검증’ 칸은 아직 비어 있습니다.
          </h2>
        </div>

        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-hairline">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-button text-graphite">
                  세그먼트
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-button text-graphite">
                  대표 서비스
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-button text-graphite">
                  velfit과의 차이
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r[0]} className="border-b border-hairline align-top">
                  <td className="px-4 py-4 text-sm font-medium text-ink">{r[0]}</td>
                  <td className="px-4 py-4 text-sm text-charcoal">{r[1]}</td>
                  <td className="px-4 py-4 text-sm leading-relaxed text-charcoal">{r[2]}</td>
                </tr>
              ))}
              <tr className="border-y-2 border-primary bg-primary/[0.06] align-top">
                <td className="px-4 py-4 text-sm font-bold text-primary-deep">velfit</td>
                <td className="px-4 py-4 text-sm font-medium text-primary-deep">—</td>
                <td className="px-4 py-4 text-sm font-medium text-primary-deep">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    {["커밋·Diff·PR", "의미 스니펫", "이력서-코드 매핑", "위조 불가능한 검증 질문"].map(
                      (step, i, arr) => (
                        <span key={step} className="inline-flex items-center gap-x-2 whitespace-nowrap">
                          {step}
                          {i < arr.length - 1 && (
                            <span aria-hidden="true" className="text-primary/50">→</span>
                          )}
                        </span>
                      ),
                    )}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
