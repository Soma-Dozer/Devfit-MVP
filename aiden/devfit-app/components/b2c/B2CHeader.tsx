import Link from "next/link";

/** B2C(취준생) 상단 네비 — Airbnb 톤(흰 배경, 둥근 rausch 마크, 친근). */
export function B2CHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-warmline-soft bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:h-20">
        <Link
          href="/b2c"
          className="inline-flex items-center gap-2 text-warmink no-underline"
          aria-label="develfit 홈"
        >
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-full bg-rausch text-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight">
devel<span className="text-rausch">fit</span>
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden text-sm font-semibold text-warmmuted transition-colors hover:text-warmink sm:inline"
          >
            면접관용 →
          </Link>
          <Link href="/b2c/app" className="ab-pill-primary">
            내 깃허브 분석
          </Link>
        </nav>
      </div>
    </header>
  );
}
