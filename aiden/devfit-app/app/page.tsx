import Link from "next/link";

export const metadata = {
  title: "velfit · develfit — 코드로 증명하는 개발자 검증",
  description: "면접관용 velfit(B2B)과 취준생용 develfit(B2C) 솔루션을 선택하세요.",
};

/**
 * 루트 선택 화면 — B2B(면접관) / B2C(취준생) 두 솔루션의 입구.
 * 각 솔루션은 자체 랜딩 + 앱을 가진다: /b2b, /b2c.
 */
export default function HomeChooser() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-5 py-16">
      <div className="mb-10 text-center animate-fade-up">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-graphite">
          GIT HISTORY → INTERVIEW INTELLIGENCE
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          velfit <span className="text-graphite">·</span> develfit
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-charcoal">
          같은 GitHub, 두 솔루션. 무엇으로 들어오시겠어요?
        </p>
      </div>

      <div className="grid w-full gap-5 sm:grid-cols-2">
        {/* B2B — 면접관 (HP 톤) */}
        <Link
          href="/b2b"
          className="group rounded-xl border border-hairline bg-white p-7 shadow-lift transition-colors hover:border-[#024ad8]"
        >
          <span className="inline-flex rounded-md bg-[#024ad8] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-white">
            B2B · 면접관
          </span>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-ink">
            velfit <span className="text-base font-medium text-charcoal">· 면접관용</span>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-charcoal">
            지원자 GitHub를 코드 영역 단위로 분석해, 원하는 성향(킬러·기본기·CS)으로
            위조 불가능한 검증 질문과 채점 신호를 뽑습니다.
          </p>
          <span className="mt-5 inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-[0.06em] text-[#024ad8]">
            면접관 솔루션 →
          </span>
        </Link>

        {/* B2C — 취준생 (Airbnb 톤) */}
        <Link
          href="/b2c"
          className="group rounded-[16px] border border-warmline bg-white p-7 transition-shadow hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
        >
          <span className="inline-flex rounded-full bg-rausch px-3 py-1 text-[11px] font-bold uppercase tracking-[0.04em] text-white">
            B2C · 취준생
          </span>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-warmink">
            develfit <span className="text-base font-medium text-warmbody">· 취준생용</span>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-warmbody">
            내 GitHub로 면접관이 자주 캐묻는 빈출 영역을 빈도순으로 확인하고, 스스로
            답해보며 기술 면접을 대비합니다.
          </p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-rausch">
            취준생 솔루션 →
          </span>
        </Link>
      </div>
    </main>
  );
}
