/**
 * 통합 diff 문자열을 +/- 거터와 함께 렌더. HP 톤:
 * 추가 = primary 블루, 삭제 = error 레드, 헌크 헤더 = graphite. (mono = 코드 도메인 예외)
 * 순수 표현용. 어떤 텍스트도 안전(HTML 주입 없음).
 */
export function DiffHunk({
  diff,
  maxLines = 14,
  className = "",
}: {
  diff: string;
  maxLines?: number;
  className?: string;
}) {
  const all = diff.replace(/\n…\(truncated\)\s*$/, "").split("\n");
  const lines = all.slice(0, maxLines);
  const clipped = all.length > maxLines;

  return (
    <pre
      className={`overflow-x-auto rounded-lg border border-hairline bg-cloud font-mono text-[12px] leading-[1.5] ${className}`}
      aria-label="코드 diff"
    >
      <code className="block">
        {lines.map((line, i) => {
          const kind =
            line.startsWith("+") && !line.startsWith("+++")
              ? "add"
              : line.startsWith("-") && !line.startsWith("---")
                ? "del"
                : line.startsWith("@@") || line.startsWith("diff ") || line.startsWith("+++") || line.startsWith("---")
                  ? "meta"
                  : "ctx";
          const tone =
            kind === "add"
              ? "bg-primary/[0.08] text-primary-deep"
              : kind === "del"
                ? "bg-error/[0.08] text-error"
                : kind === "meta"
                  ? "text-graphite"
                  : "text-charcoal";
          const marker = kind === "add" ? "+" : kind === "del" ? "-" : " ";
          return (
            <span key={i} className={`grid grid-cols-[1.25rem_1fr] ${tone}`}>
              <span aria-hidden="true" className="select-none border-r border-hairline px-1 text-center text-graphite/60">
                {marker}
              </span>
              <span className="whitespace-pre px-2">
                {kind === "add" || kind === "del" ? line.slice(1) : line || " "}
              </span>
            </span>
          );
        })}
        {clipped && (
          <span className="block px-3 py-1 text-[11px] text-graphite">…({all.length - maxLines}줄 더)</span>
        )}
      </code>
    </pre>
  );
}
