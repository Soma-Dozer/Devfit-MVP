"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { getSession, listApplicants, type Candidate, type Session } from "@/lib/api";

export default function CandidatesPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }
    setSession(s);
    listApplicants()
      .then(setCandidates)
      .catch((e) => setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [router]);

  // 전체 기술 스택 집계
  const allLangs = useMemo(() => {
    const m = new Map<string, number>();
    candidates.forEach((c) => c.languages.forEach((l) => m.set(l, (m.get(l) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([l]) => l);
  }, [candidates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates.filter((c) => {
      const matchesQuery =
        !q || c.name.toLowerCase().includes(q) || c.githubUsername.toLowerCase().includes(q);
      const matchesLang =
        selected.length === 0 || selected.some((l) => c.languages.includes(l));
      return matchesQuery && matchesLang;
    });
  }, [candidates, query, selected]);

  function toggleLang(l: string) {
    setSelected((s) => (s.includes(l) ? s.filter((x) => x !== l) : [...s, l]));
  }

  if (!session) return null;

  return (
    <div className="min-h-screen">
      <AppNav user={session.user} />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-[26px] font-extrabold tracking-tight">지원자 둘러보기</h1>
        <p className="mt-1.5 text-[14.5px] text-slate-600">
          GitHub를 등록한 지원자들의 공개 프로필입니다. 기술 스택으로 필터링하고, 레포로 면접 질문을 만들 수 있어요.
        </p>

        {/* 검색 + 스택 필터 */}
        {!loading && candidates.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름 또는 GitHub username 검색"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-[14px] outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            {allLangs.length > 0 && (
              <div className="mt-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                    기술 스택 필터
                  </span>
                  {selected.length > 0 && (
                    <button onClick={() => setSelected([])}
                      className="text-[12px] font-semibold text-indigo-600 hover:underline">
                      초기화
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {allLangs.map((l) => {
                    const on = selected.includes(l);
                    return (
                      <button key={l} onClick={() => toggleLang(l)}
                        className={`rounded-full border px-3 py-1 font-mono text-[12.5px] transition ${
                          on
                            ? "border-indigo-500 bg-indigo-600 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                        }`}>
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="mt-8 animate-pulse rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            불러오는 중…
          </div>
        )}
        {error && !loading && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-[14px] text-red-700">{error}</div>
        )}

        {!loading && candidates.length === 0 && !error && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/50 px-6 py-14 text-center">
            <div className="text-[15px] font-semibold text-slate-700">아직 등록된 지원자가 없어요</div>
            <p className="mt-2 text-[13.5px] text-slate-500">지원자가 GitHub를 등록하면 여기에 표시됩니다.</p>
          </div>
        )}

        {!loading && candidates.length > 0 && (
          <>
            <div className="mt-5 text-[13px] text-slate-500">
              {filtered.length}명 {selected.length > 0 && <span className="text-slate-400">· 필터: {selected.join(", ")}</span>}
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {filtered.map((c) => (
                <Link key={c.id} href={`/u/${c.githubUsername}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200">
                  <div className="flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://github.com/${c.githubUsername}.png?size=96`} alt={c.githubUsername}
                      className="h-12 w-12 rounded-xl border border-slate-200" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800">{c.name}</div>
                      <div className="font-mono text-[12.5px] text-slate-500">@{c.githubUsername}</div>
                    </div>
                    <span className="text-[13px] font-semibold text-indigo-600 opacity-0 transition group-hover:opacity-100">
                      프로필 →
                    </span>
                  </div>
                  {c.languages.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {c.languages.slice(0, 5).map((l) => (
                        <span key={l}
                          className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${
                            selected.includes(l)
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                          {l}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/50 px-6 py-10 text-center text-[13.5px] text-slate-500">
                조건에 맞는 지원자가 없습니다.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
