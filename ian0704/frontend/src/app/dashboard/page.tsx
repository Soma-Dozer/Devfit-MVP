"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import DiffBlock from "@/components/DiffBlock";
import QuestionList from "@/components/QuestionList";
import RepoOverview from "@/components/RepoOverview";
import SnippetHeader from "@/components/SnippetHeader";
import {
  analyzeStream,
  getSession,
  type AnalyzeResponse,
  type Session,
} from "@/lib/api";

// 백엔드 실제 단계(0,1,2)와 1:1 매칭 — 각 단계가 끝날 때 체크된다.
const STEPS = [
  "GitHub 레포 정보 수집",
  "의미 있는 커밋·Diff 추출",
  "코드 설명 · 면접 질문 생성",
];

const SAMPLES = [
  "github.com/gofiber/fiber",
  "github.com/nestjs/nest",
  "github.com/spring-projects/spring-petclinic",
];

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [repoUrl, setRepoUrl] = useState("github.com/gofiber/fiber");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closeStream = useRef<(() => void) | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    if (s.user.role === "APPLICANT") {
      router.replace("/profile");
      return;
    }
    setSession(s);
    // 후보 공개 프로필에서 넘어온 딥링크(?repo=) 프리필
    const repoParam = new URLSearchParams(window.location.search).get("repo");
    if (repoParam) setRepoUrl(repoParam);
  }, [router]);

  useEffect(() => {
    return () => {
      if (closeStream.current) closeStream.current();
    };
  }, []);

  function runAnalysis() {
    setLoading(true);
    setError(null);
    setResult(null);
    setStep(0);
    if (closeStream.current) closeStream.current();

    // SSE로 백엔드 실제 단계 진행을 받아 표시한다.
    closeStream.current = analyzeStream(repoUrl, 5, {
      onProgress: (done) => setStep(done + 1), // done번째 단계 완료 → 다음 단계 활성화
      onResult: (data) => {
        setResult(data);
        setStep(STEPS.length);
        setLoading(false);
      },
      onError: (msg) => {
        setError(msg);
        setLoading(false);
      },
    });
  }

  if (!session) return null;

  const totalQuestions =
    result?.snippets.reduce((acc, s) => acc + s.questions.length, 0) ?? 0;

  return (
    <div className="min-h-screen">
      <AppNav user={session.user} />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-[26px] font-extrabold tracking-tight">검증 대시보드</h1>
        <p className="mt-1.5 text-[14.5px] text-slate-600">
          지원자의 GitHub 레포를 입력하면, 의미 있는 코드 조각과 그에 근거한 면접 질문을 생성합니다.
        </p>

        {/* input card */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="mb-2 block text-[13px] font-semibold text-slate-700">
            지원자 GitHub 레포 주소
          </label>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => e.key === "Enter" && !loading && runAnalysis()}
              placeholder="github.com/owner/repo"
              className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 font-mono text-[13.5px] outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {loading ? "분석 중…" : "분석 시작 ▸"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
            <span>예시:</span>
            {SAMPLES.map((s) => (
              <button
                key={s}
                onClick={() => !loading && setRepoUrl(s)}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11.5px] text-slate-600 transition hover:border-slate-300"
              >
                {s.replace("github.com/", "")}
              </button>
            ))}
          </div>
        </div>

        {/* progress */}
        {loading && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <ul className="space-y-3">
              {STEPS.map((label, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <li key={i} className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold ${
                        done
                          ? "bg-emerald-100 text-emerald-600"
                          : active
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {done ? "✓" : active ? "◐" : i + 1}
                    </span>
                    <span
                      className={`text-[14px] ${
                        done || active ? "text-slate-800" : "text-slate-400"
                      }`}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* error */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-[14px] text-red-700">
            <b>분석 실패</b> — {error}
          </div>
        )}

        {/* results */}
        {result && (
          <div className="mt-8">
            <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-5 py-4">
              <span className="text-[15px] font-bold text-slate-800">
                {result.repo}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-[13.5px] text-slate-600">
                코드 조각 <b className="text-indigo-600">{result.snippetCount}</b>개 · 검증 질문{" "}
                <b className="text-indigo-600">{totalQuestions}</b>개 생성
              </span>
              <span className="ml-auto text-[12.5px] text-slate-500">
                ⏱ 직접 분석 ≈ 2시간 → GitProof 수십 초
              </span>
            </div>

            {result.repoInfo && (
              <div className="mb-5">
                <RepoOverview info={result.repoInfo} summary={result.repoSummary} />
              </div>
            )}

            {result.warning && (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13.5px] leading-relaxed text-amber-800">
                <b>⚠ 질문 생성 일시 불가</b> — {result.warning}
                <div className="mt-1 text-amber-700/80">
                  코드 조각 추출은 정상 완료됐습니다. 한도가 회복되면 다시 분석해 주세요.
                </div>
              </div>
            )}

            <div className="space-y-6">
              {result.snippets.map((s, i) => (
                <article
                  key={s.commitSha}
                  className="animate-fadeUp rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="mb-4">
                    <SnippetHeader
                      title={s.title}
                      commitMessage={s.commitMessage}
                      shortSha={s.shortSha}
                      authorName={s.authorName}
                      date={s.date}
                      htmlUrl={s.htmlUrl}
                    />
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    {/* left: code */}
                    <div>
                      <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                        근거 코드 (Diff)
                      </div>
                      <DiffBlock
                        fileName={s.fileName}
                        patch={s.patch}
                        additions={s.additions}
                        deletions={s.deletions}
                        htmlUrl={s.htmlUrl}
                      />
                    </div>
                    {/* right: explanation + questions */}
                    <div>
                      {s.explanation && (
                        <div className="mb-5">
                          <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                            코드 설명
                          </div>
                          <p className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-[14px] leading-relaxed text-slate-700">
                            {s.explanation}
                          </p>
                        </div>
                      )}
                      <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                        AI 면접 질문
                      </div>
                      <QuestionList questions={s.questions} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* empty state */}
        {!loading && !result && !error && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/50 px-6 py-14 text-center">
            <div className="text-[15px] font-semibold text-slate-700">
              아직 분석한 레포가 없습니다
            </div>
            <p className="mt-2 text-[13.5px] text-slate-500">
              위에 GitHub 레포 주소를 입력하고 <b>분석 시작</b>을 눌러보세요.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
