"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import PortfolioView from "@/components/PortfolioView";
import {
  getPortfolio,
  getSession,
  saveSession,
  setGithub,
  type Portfolio,
  type Session,
} from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ghInput, setGhInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }
    if (s.user.role === "INTERVIEWER") { router.replace("/dashboard"); return; }
    setSession(s);
    if (s.user.githubUsername) loadPortfolio(s.user.githubUsername);
  }, [router]);

  async function loadPortfolio(username: string) {
    setLoading(true);
    setError(null);
    try {
      setPortfolio(await getPortfolio(username));
    } catch (e) {
      setError(e instanceof Error ? e.message : "포트폴리오를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function registerGithub(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    setError(null);
    try {
      const user = await setGithub(session.token, ghInput);
      const ns = { ...session, user };
      saveSession(ns);
      setSession(ns);
      if (user.githubUsername) loadPortfolio(user.githubUsername);
    } catch (e) {
      setError(e instanceof Error ? e.message : "등록에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (!session) return null;
  const gh = session.user.githubUsername;

  return (
    <div className="min-h-screen">
      <AppNav user={session.user} />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-[26px] font-extrabold tracking-tight">내 포트폴리오</h1>
        <p className="mt-1.5 text-[14.5px] text-slate-600">
          등록한 GitHub를 분석해 기술 스택·대표 프로젝트·활동을 한 화면에 보여줍니다.
        </p>

        {/* GitHub 등록/변경 */}
        <form onSubmit={registerGithub} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-[13px] font-semibold text-slate-700">GitHub username</label>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <input
              value={ghInput || gh || ""}
              onChange={(e) => setGhInput(e.target.value)}
              placeholder="예: torvalds"
              className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 font-mono text-[13.5px] outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <button type="submit" disabled={saving}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60">
              {saving ? "저장 중…" : gh ? "변경·재분석" : "등록하고 분석"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-[14px] text-red-700">
            {error}
          </div>
        )}

        {!gh && !loading && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/50 px-6 py-14 text-center">
            <div className="text-[15px] font-semibold text-slate-700">아직 GitHub를 등록하지 않았어요</div>
            <p className="mt-2 text-[13.5px] text-slate-500">위에 GitHub username을 입력하면 포트폴리오가 생성됩니다.</p>
          </div>
        )}

        {loading && (
          <div className="mt-8 animate-pulse rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            GitHub 분석 중…
          </div>
        )}

        {portfolio && !loading && (
          <>
            <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-5 py-4">
              <span className="text-[13.5px] text-slate-700">
                ✅ 이 포트폴리오는 <b className="text-slate-800">누구나 볼 수 있는 공개 프로필</b>로 공유됩니다.
              </span>
              <a
                href={`/u/${gh}`}
                target="_blank"
                rel="noreferrer"
                className="ml-auto rounded-lg border border-emerald-300 bg-white px-3.5 py-2 text-[13px] font-semibold text-emerald-700 transition hover:border-emerald-400"
              >
                공개 프로필 열기 ↗
              </a>
            </div>
            <div className="mt-5">
              <PortfolioView p={portfolio} />
            </div>
          </>
        )}

        {portfolio && (
          <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
            <div className="text-[14px] font-semibold text-slate-800">면접이 다가오나요?</div>
            <p className="mt-1 text-[13.5px] text-slate-600">
              내 코드 기반으로 예상 질문과 모범답안 가이드를 받아 대비하세요.
            </p>
            <Link href="/prep" className="mt-3 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-indigo-500">
              면접 대비 시작 →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
