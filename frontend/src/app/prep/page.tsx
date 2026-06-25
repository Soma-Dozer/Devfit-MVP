"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import DiffBlock from "@/components/DiffBlock";
import SnippetHeader from "@/components/SnippetHeader";
import {
  getPortfolio,
  getSession,
  prep,
  type PrepResponse,
  type Session,
} from "@/lib/api";

const STEPS = [
  "GitHub 수집 — Commit · Diff",
  "중요 커밋 선별",
  "코드 설명·예상 질문 생성",
  "모범답안 가이드 작성",
];

export default function PrepPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [picks, setPicks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<PrepResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }
    if (s.user.role === "INTERVIEWER") { router.replace("/dashboard"); return; }
    setSession(s);
    if (s.user.githubUsername) {
      getPortfolio(s.user.githubUsername)
        .then((p) => {
          const repos = p.topProjects.map((r) => `github.com/${p.user.login}/${r.name}`);
          setPicks(repos.slice(0, 4));
          if (repos[0]) setRepoUrl(repos[0]);
        })
        .catch(() => {});
    }
  }, [router]);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  async function run() {
    setLoading(true); setError(null); setResult(null); setStep(0);
    timer.current = setInterval(() => setStep((s) => (s < STEPS.length - 1 ? s + 1 : s)), 1000);
    try {
      const data = await prep(repoUrl, 5);
      if (timer.current) clearInterval(timer.current);
      setResult(data);
    } catch (e) {
      if (timer.current) clearInterval(timer.current);
      setError(e instanceof Error ? e.message : "면접 대비 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (!session) return null;

  return (
    <div className="min-h-screen">
      <AppNav user={session.user} />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-[26px] font-extrabold tracking-tight">면접 대비</h1>
        <p className="mt-1.5 text-[14.5px] text-slate-600">
          내 GitHub 레포를 고르면, <b className="text-slate-800">복습 주제</b>와 코드 조각별
          <b className="text-slate-800"> 예상 질문·모범답안 가이드</b>를 만들어 드립니다.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="mb-2 block text-[13px] font-semibold text-slate-700">내 레포 주소</label>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => e.key === "Enter" && !loading && run()}
              placeholder="github.com/내아이디/레포"
              className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 font-mono text-[13.5px] outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <button onClick={run} disabled={loading}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60">
              {loading ? "준비 중…" : "면접 대비 시작 ▸"}
            </button>
          </div>
          {picks.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
              <span>내 레포:</span>
              {picks.map((r) => (
                <button key={r} onClick={() => !loading && setRepoUrl(r)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11.5px] text-slate-600 transition hover:border-slate-300">
                  {r.replace(/^github\.com\//, "")}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <ul className="space-y-3">
              {STEPS.map((label, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold ${
                    i < step ? "bg-emerald-100 text-emerald-600" : i === step ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                  }`}>{i < step ? "✓" : i === step ? "◐" : i + 1}</span>
                  <span className={`text-[14px] ${i <= step ? "text-slate-800" : "text-slate-400"}`}>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-[14px] text-red-700">
            <b>실패</b> — {error}
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            {result.warning && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13.5px] text-amber-800">
                <b>⚠ 일부 생성 실패</b> — {result.warning} 코드 조각은 아래에서 그대로 확인할 수 있어요.
              </div>
            )}

            {/* 복습 주제 */}
            {result.topics.length > 0 && (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
                <div className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-indigo-500">
                  면접 전 복습 주제
                </div>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {result.topics.map((t, i) => (
                    <li key={i} className="rounded-xl border border-indigo-100 bg-white p-3.5">
                      <div className="text-[14px] font-bold text-slate-800">{t.topic}</div>
                      <div className="mt-1 text-[12.5px] leading-relaxed text-slate-600">{t.why}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 조각별 예상 질문 */}
            {result.snippets.map((s, i) => (
              <article key={s.commitSha} className="animate-fadeUp rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                style={{ animationDelay: `${i * 60}ms` }}>
                <SnippetHeader
                  title={s.title}
                  commitMessage={s.commitMessage}
                  shortSha={s.shortSha}
                  authorName={""}
                  date={""}
                  htmlUrl={s.htmlUrl}
                />
                <p className="mt-1.5 font-mono text-[12px] text-slate-400">파일 · {s.fileName}</p>

                <div className="mt-4">
                  <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-400">코드 조각</div>
                  <DiffBlock fileName={s.fileName} patch={s.patch} additions={s.additions} deletions={s.deletions} htmlUrl={s.htmlUrl} />
                </div>

                {s.explanation && (
                  <div className="mt-4">
                    <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-slate-400">설명</div>
                    <p className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-[14px] leading-relaxed text-slate-700">{s.explanation}</p>
                  </div>
                )}

                {s.question && (
                  <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                    <div className="mb-1 text-[11.5px] font-bold text-indigo-600">예상 질문</div>
                    <p className="text-[14.5px] font-semibold leading-relaxed text-slate-800">{s.question}</p>
                  </div>
                )}

                {s.answerGuide && (
                  <details className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                    <summary className="cursor-pointer text-[12.5px] font-bold text-emerald-700">💡 모범답안 가이드 보기</summary>
                    <p className="mt-2 text-[14px] leading-relaxed text-slate-700">{s.answerGuide}</p>
                  </details>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
