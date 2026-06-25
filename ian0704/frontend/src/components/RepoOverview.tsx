import type { RepoInfo } from "@/lib/api";

export default function RepoOverview({
  info,
  summary,
}: {
  info: RepoInfo;
  summary?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-indigo-500">
        레포 개요 · 이 프로젝트는 무엇을 하는가
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <a
          href={info.htmlUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[18px] font-bold text-slate-900 hover:text-indigo-600"
        >
          {info.fullName} ↗
        </a>
        <span className="flex items-center gap-3 font-mono text-[12.5px] text-slate-500">
          {info.language && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
              {info.language}
            </span>
          )}
          <span>★ {info.stars.toLocaleString()}</span>
          <span>⑂ {info.forks.toLocaleString()}</span>
        </span>
      </div>

      {info.description && (
        <p className="mt-2 text-[14.5px] text-slate-700">{info.description}</p>
      )}

      {summary && (
        <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
          <div className="mb-1 text-[11.5px] font-semibold text-indigo-600">
            AI 요약
          </div>
          <p className="text-[14px] leading-relaxed text-slate-700">{summary}</p>
        </div>
      )}

      {info.topics?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {info.topics.slice(0, 10).map((t) => (
            <span
              key={t}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-[11.5px] text-slate-600"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
