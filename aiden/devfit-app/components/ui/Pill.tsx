/** 작은 배지 — 기술 스택·카테고리·카운트. HP badge-pill(8px). */
export function Pill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "pine" | "primary" | "ink";
}) {
  const styles =
    tone === "primary" || tone === "pine"
      ? "border-primary/30 bg-primary/[0.07] text-primary-deep"
      : tone === "ink"
        ? "border-transparent bg-ink text-white"
        : "border-hairline bg-canvas text-charcoal";
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      {children}
    </span>
  );
}
