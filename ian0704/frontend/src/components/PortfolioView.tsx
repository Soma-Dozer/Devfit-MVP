import type { Portfolio } from "@/lib/api";
import DonutChart from "./DonutChart";

const LANG_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Java: "#b07219",
  Go: "#00ADD8", C: "#555555", "C++": "#f34b7d", "C#": "#178600", Ruby: "#701516",
  Rust: "#dea584", PHP: "#4F5D95", Kotlin: "#A97BFF", Swift: "#F05138", Scala: "#c22d40",
  Shell: "#89e051", HTML: "#e34c26", CSS: "#563d7c", Vue: "#41b883", Dart: "#00B4AB",
  "Jupyter Notebook": "#DA5B0B", OpenSCAD: "#e5cd45", Elixir: "#6e4a7e", Haskell: "#5e5086",
};
const PALETTE = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#ef4444", "#a3a3a3"];
const langColor = (name: string, i: number) => LANG_COLORS[name] ?? PALETTE[i % PALETTE.length];

export default function PortfolioView({ p }: { p: Portfolio }) {
  const u = p.user;
  const langTotal = p.languages.reduce((a, l) => a + l.count, 0) || 1;
  const deepNames = new Set((p.deepProjects ?? []).map((d) => d.name));
  const otherProjects = p.topProjects.filter((pr) => !deepNames.has(pr.name));

  return (
    <div className="space-y-6">
      {/* ── 슬라이드 1: 히어로 ── */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-200/60 p-8 text-white shadow-xl shadow-indigo-600/10"
        style={{ background: "linear-gradient(135deg,#0f3d24 0%,#15663a 55%,#1f8a44 110%)" }}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-20 h-56 w-56 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          {u.avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={u.avatarUrl} alt={u.login}
              className="h-28 w-28 rounded-3xl border-4 border-white/30 shadow-lg" />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-[34px] font-extrabold leading-tight tracking-tight">{u.name || u.login}</h2>
            <div className="mt-0.5 font-mono text-[14px] text-indigo-100">@{u.login}</div>
            {u.bio && <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-indigo-50">{u.bio}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <a href={u.htmlUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[13.5px] font-bold text-slate-900 shadow transition hover:bg-indigo-50">
                <GitHubIcon /> GitHub에서 보기 ↗
              </a>
              {u.location && <Pill>📍 {u.location}</Pill>}
              {u.company && <Pill>🏢 {u.company}</Pill>}
              <Pill>👥 {u.followers.toLocaleString()} followers</Pill>
            </div>
          </div>
        </div>
        {p.aiIntro && (
          <div className="relative mt-6 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <div className="mb-1 text-[11.5px] font-bold uppercase tracking-wide text-indigo-100">✦ AI 한줄 소개</div>
            <p className="text-[14.5px] leading-relaxed text-white">{p.aiIntro}</p>
          </div>
        )}
      </section>

      {/* ── 슬라이드 2: 핵심 지표 ── */}
      <section>
        <SlideEyebrow n="02" title="핵심 지표" />
        <div className="grid grid-cols-3 gap-4">
          <BigStat icon="📦" n={u.publicRepos.toLocaleString()} label="공개 레포" from="#6366f1" to="#8b5cf6" />
          <BigStat icon="⭐" n={p.totalStars.toLocaleString()} label="받은 스타" from="#f59e0b" to="#ef4444" />
          <BigStat icon="💻" n={p.topLanguage || "—"} label="주력 언어" from="#10b981" to="#06b6d4" />
        </div>
      </section>

      {/* ── 슬라이드 3: 기술 스택 (비율 바) ── */}
      {p.languages.length > 0 && (
        <section>
          <SlideEyebrow n="03" title="기술 스택" />
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex h-4 w-full overflow-hidden rounded-full ring-1 ring-slate-100">
              {p.languages.map((l, i) => (
                <div key={l.name} title={`${l.name} · ${l.count}`}
                  style={{ width: `${(l.count / langTotal) * 100}%`, background: langColor(l.name, i) }} />
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5">
              {p.languages.map((l, i) => (
                <div key={l.name} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm" style={{ background: langColor(l.name, i) }} />
                  <span className="text-[14px] font-semibold text-slate-800">{l.name}</span>
                  <span className="text-[12.5px] text-slate-400">
                    {Math.round((l.count / langTotal) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 슬라이드 4: 주 프로젝트 심층 분석 ── */}
      {p.deepProjects && p.deepProjects.length > 0 && (
        <section>
          <SlideEyebrow n="04" title="주 프로젝트 심층 분석" />
          <div className="space-y-5">
            {p.deepProjects.map((dp, di) => {
              const total = dp.languages.reduce((a, l) => a + l.bytes, 0) || 1;
              const segs = dp.languages.slice(0, 6).map((l, i) => ({
                name: l.name,
                value: l.bytes,
                color: langColor(l.name, i),
              }));
              const topPct = dp.languages.length
                ? Math.round((dp.languages[0].bytes / total) * 100)
                : 0;
              return (
                <div key={dp.name} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 to-white px-6 py-4">
                    <div className="flex items-center justify-between gap-2">
                      <a href={dp.htmlUrl} target="_blank" rel="noreferrer"
                        className="text-[19px] font-extrabold tracking-tight text-slate-900 hover:text-indigo-600">
                        {di + 1}. {dp.name} ↗
                      </a>
                      <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 font-mono text-[12px] font-bold text-amber-600">
                        ★ {dp.stars.toLocaleString()}
                      </span>
                    </div>
                    {dp.summary && <p className="mt-2 text-[14px] leading-relaxed text-slate-700">{dp.summary}</p>}
                  </div>

                  <div className="grid gap-6 p-6 md:grid-cols-[180px_1fr]">
                    {/* 언어 구성 도넛 차트 */}
                    <div className="flex flex-col items-center">
                      {segs.length > 0 ? (
                        <>
                          <DonutChart data={segs} centerLabel={`${topPct}%`} centerSub={dp.languages[0]?.name} />
                          <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1.5">
                            {segs.map((s) => (
                              <span key={s.name} className="flex items-center gap-1.5 text-[11.5px]">
                                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                                <span className="text-slate-600">{s.name}</span>
                                <span className="text-slate-400">{Math.round((s.value / total) * 100)}%</span>
                              </span>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-[12px] text-slate-400">언어 정보 없음</div>
                      )}
                    </div>

                    {/* 어떻게 개발했나 + 하이라이트 */}
                    <div>
                      {dp.howBuilt.length > 0 && (
                        <>
                          <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                            어떻게 개발했나
                          </div>
                          <ul className="space-y-2">
                            {dp.howBuilt.map((h, i) => (
                              <li key={i} className="flex gap-2 text-[14px] leading-relaxed text-slate-700">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                                {h}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      {dp.highlights.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {dp.highlights.map((h, i) => (
                            <span key={i} className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[12px] font-medium text-violet-700">
                              ✦ {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 슬라이드 5: 그 외 프로젝트 ── */}
      {otherProjects.length > 0 && (
        <section>
          <SlideEyebrow n="05" title={deepNames.size > 0 ? "그 외 프로젝트" : "대표 프로젝트"} />
          <div className="grid gap-4 sm:grid-cols-2">
            {otherProjects.map((proj, i) => (
              <a key={proj.name} href={proj.htmlUrl} target="_blank" rel="noreferrer"
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <span className="absolute right-0 top-0 h-20 w-20 rounded-bl-[40px] opacity-10 transition group-hover:opacity-20"
                  style={{ background: langColor(proj.language, i) }} />
                <div className="relative flex items-center justify-between gap-2">
                  <span className="truncate text-[17px] font-extrabold tracking-tight text-slate-900">{proj.name}</span>
                  <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 font-mono text-[12px] font-bold text-amber-600">
                    ★ {proj.stars.toLocaleString()}
                  </span>
                </div>
                {proj.description && (
                  <p className="relative mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-slate-600">{proj.description}</p>
                )}
                <div className="relative mt-4 flex items-center gap-3 font-mono text-[11.5px] text-slate-500">
                  {proj.language && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: langColor(proj.language, i) }} />
                      {proj.language}
                    </span>
                  )}
                  {proj.forks > 0 && <span>⑂ {proj.forks.toLocaleString()}</span>}
                  {proj.topics.slice(0, 2).map((t) => (
                    <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">{t}</span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SlideEyebrow({ n, title }: { n: string; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="font-mono text-[13px] font-extrabold text-indigo-300">{n}</span>
      <span className="text-[15px] font-bold tracking-tight text-slate-800">{title}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function BigStat({ icon, n, label, from, to }: { icon: string; n: string; label: string; from: string; to: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg,${from},${to})` }} />
      <div className="text-[20px]">{icon}</div>
      <div className="mt-1 text-[26px] font-extrabold tracking-tight text-slate-900">{n}</div>
      <div className="mt-0.5 text-[12.5px] text-slate-500">{label}</div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 text-[12.5px] font-medium text-indigo-50">
      {children}
    </span>
  );
}

function GitHubIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
