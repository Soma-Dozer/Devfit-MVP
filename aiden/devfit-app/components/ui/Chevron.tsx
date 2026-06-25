/**
 * HP 시그니처 — 블루 셰브론(워드마크의 평행 슬래시를 키운 각진 모티프).
 * 히어로/배너 가장자리 전용. 카드 내부 장식 금지(DESIGN.md).
 * 장식 요소이므로 aria-hidden.
 */
export function Chevron({
  tone = "primary",
  className = "",
}: {
  tone?: "primary" | "soft";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`block ${tone === "soft" ? "chevron-soft" : "chevron"} ${className}`}
    />
  );
}

/** 히어로 좌/우 가장자리에 셰브론 쌍을 깔아주는 래퍼. */
export function ChevronFlank() {
  return (
    <>
      <Chevron
        tone="soft"
        className="pointer-events-none absolute -left-2 top-6 hidden h-[72%] w-16 opacity-70 lg:block"
      />
      <Chevron className="pointer-events-none absolute -right-3 bottom-0 hidden h-[80%] w-16 lg:block" />
    </>
  );
}
