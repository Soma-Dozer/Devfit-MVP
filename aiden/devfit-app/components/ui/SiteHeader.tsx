import Link from "next/link";
import { Logo } from "./Logo";

/**
 * 상단 네비 — HP 톤(흰 캔버스, 64px, 하단 hairline, 블루 CTA).
 * variant="landing" 마케팅 네비 + CTA / variant="app" 콘솔 + 홈 링크.
 */
export function SiteHeader({ variant = "landing" }: { variant?: "landing" | "app" }) {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <Logo />
          {variant === "app" && (
            <span className="hidden text-xs font-medium uppercase tracking-button text-graphite sm:inline">
              / 분석 콘솔
            </span>
          )}
        </div>

        {variant === "landing" ? (
          <nav className="flex items-center gap-1 sm:gap-2">
            <a
              href="#problem"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-charcoal transition-colors hover:text-ink sm:inline-block"
            >
              문제
            </a>
            <a
              href="#compare"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-charcoal transition-colors hover:text-ink sm:inline-block"
            >
              비교
            </a>
            <a
              href="#how"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-charcoal transition-colors hover:text-ink sm:inline-block"
            >
              작동방식
            </a>
            <Link href="/duo" className="btn-outline-ink ml-1 h-9 px-4 text-xs">
              데모
            </Link>
            <Link href="/dashboard" className="btn-primary h-9 px-4 text-xs">
              면접 콘솔
            </Link>
          </nav>
        ) : (
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-charcoal transition-colors hover:text-ink"
          >
            ← 홈
          </Link>
        )}
      </div>
    </header>
  );
}
