"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PortfolioView from "@/components/PortfolioView";
import { getPortfolio, getSession, type Portfolio } from "@/lib/api";

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params.username);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInterviewer, setIsInterviewer] = useState(false);

  useEffect(() => {
    const s = getSession();
    setIsInterviewer(s?.user.role === "INTERVIEWER");
    getPortfolio(username)
      .then(setPortfolio)
      .catch((e) => setError(e instanceof Error ? e.message : "프로필을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [username]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold">
            <BrandMark /> GitProof
            <span className="ml-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">공개 프로필</span>
          </Link>
          <Link href="/login" className="text-[13.5px] font-semibold text-slate-600 hover:text-indigo-600">로그인</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="mb-4 font-mono text-[13px] text-slate-500">@{username}의 개발자 포트폴리오</p>

        {loading && (
          <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            불러오는 중…
          </div>
        )}
        {error && !loading && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-[14px] text-red-700">{error}</div>
        )}

        {portfolio && !loading && (
          <>
            <PortfolioView p={portfolio} />

            {/* 면접관용: 이 후보 분석 */}
            {portfolio.topProjects.length > 0 && (
              <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/50 p-5">
                <div className="text-[14px] font-semibold text-slate-800">
                  {isInterviewer ? "이 후보의 레포로 면접 질문 만들기" : "면접관이신가요?"}
                </div>
                <p className="mt-1 text-[13.5px] text-slate-600">
                  대표 프로젝트를 골라 코드 근거 면접 질문을 생성하세요.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {portfolio.topProjects.slice(0, 4).map((proj) => (
                    <Link
                      key={proj.name}
                      href={`/dashboard?repo=github.com/${portfolio.user.login}/${proj.name}`}
                      className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 font-mono text-[12px] text-violet-700 transition hover:border-violet-300"
                    >
                      {proj.name} 분석 →
                    </Link>
                  ))}
                </div>
                {!isInterviewer && (
                  <Link href="/login" className="mt-3 inline-block text-[13px] font-semibold text-violet-700 hover:underline">
                    면접관으로 로그인 →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
