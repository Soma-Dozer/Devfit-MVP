export default function DiffBlock({
  fileName,
  patch,
  additions,
  deletions,
  htmlUrl,
}: {
  fileName: string;
  patch: string;
  additions: number;
  deletions: number;
  htmlUrl?: string;
}) {
  const lines = patch.split("\n");
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0c1018]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="font-mono text-[12px] text-slate-300">{fileName}</span>
        <span className="flex items-center gap-3 font-mono text-[11px]">
          <span className="text-emerald-400">+{additions}</span>
          <span className="text-red-400">−{deletions}</span>
          {htmlUrl && (
            <a
              href={htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-slate-300"
            >
              GitHub ↗
            </a>
          )}
        </span>
      </div>
      <pre className="overflow-x-auto py-2 font-mono text-[12px] leading-[1.7] text-slate-300">
        {lines.map((line, i) => {
          let cls = "diff-line diff-meta";
          if (line.startsWith("@@")) cls = "diff-line diff-hunk";
          else if (line.startsWith("+") && !line.startsWith("+++"))
            cls = "diff-line diff-add";
          else if (line.startsWith("-") && !line.startsWith("---"))
            cls = "diff-line diff-del";
          else if (!line.startsWith("+++") && !line.startsWith("---"))
            cls = "diff-line";
          return (
            <span key={i} className={cls}>
              {line || " "}
            </span>
          );
        })}
      </pre>
    </div>
  );
}
