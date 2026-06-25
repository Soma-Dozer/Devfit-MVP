/**
 * "지원자 미노출" 잠금 배지 — HP 톤(잉크 필 배지, 락 아이콘, 8px, 무회전).
 * 누가 볼 수 있는지를 표시하는 권한 신호.
 */
export function Seal({
  label = "지원자 미노출",
  animate = false,
  className = "",
}: {
  label?: string;
  animate?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg bg-ink px-2.5 py-1 text-[11px] font-semibold uppercase tracking-button text-white ${
        animate ? "animate-stamp" : ""
      } ${className}`}
      role="img"
      aria-label={`클리어런스: ${label}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden="true"
      >
        <rect x="5" y="11" width="14" height="9" rx="1.5" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      {label}
    </span>
  );
}
