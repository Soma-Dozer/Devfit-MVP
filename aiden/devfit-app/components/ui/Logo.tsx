import Link from "next/link";

/**
 * velfit 워드마크(B2B) — HP 톤. 블루 4px 마크 + 잉크 워드마크.
 * onDark=true 면 다크 슬랩(푸터) 위에서 흰 텍스트로 렌더.
 */
export function Logo({
  href = "/",
  onDark = false,
}: {
  href?: string;
  onDark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2 no-underline ${
        onDark ? "text-white" : "text-ink"
      }`}
      aria-label="velfit 홈"
    >
      <span
        aria-hidden="true"
        className="grid h-7 w-7 place-items-center rounded-md bg-primary text-white transition-colors group-hover:bg-primary-deep"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight">
        vel<span className={onDark ? "text-primary-bright" : "text-primary"}>fit</span>
      </span>
    </Link>
  );
}
