"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { login, signup, saveSession, homeFor } from "@/lib/api";

type Mode = "login" | "signup";
type RoleSel = "applicant" | "interviewer";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<RoleSel>("applicant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [github, setGithub] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const session =
        mode === "login"
          ? await login(email, password)
          : await signup({ email, password, name, role, githubUsername: github });
      saveSession(session);
      router.push(homeFor(session.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-aurora flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2.5 text-[20px] font-extrabold">
        <BrandMark size={32} /> GitProof
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
        {/* mode tabs */}
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); }}
              className={`rounded-lg py-2.5 text-[14px] font-semibold transition ${
                mode === m ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {m === "login" ? "로그인" : "회원가입"}
            </button>
          ))}
        </div>

        {/* 역할 선택 — 회원가입에서만 (로그인은 계정 역할로 자동 이동) */}
        {mode === "signup" && (
        <div className="mb-5">
          <div className="mb-2 text-[13px] font-semibold text-slate-700">
            가입 유형
          </div>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["applicant", "지원자", "개발 구직자 · 포트폴리오/면접 대비"],
              ["interviewer", "면접관", "지원자 코드 기반 질문 추천"],
            ] as [RoleSel, string, string][]).map(([r, label, desc]) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-xl border p-3 text-left transition ${
                  role === r
                    ? "border-indigo-300 bg-indigo-50/70 ring-1 ring-indigo-200"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="text-[14px] font-bold text-slate-800">{label}</div>
                <div className="mt-0.5 text-[11.5px] leading-snug text-slate-500">{desc}</div>
              </button>
            ))}
          </div>
        </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3.5">
          {mode === "signup" && (
            <Field label="이름">
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="홍길동" className={inputCls} />
            </Field>
          )}
          <Field label="이메일">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="you@example.com" className={inputCls} />
          </Field>
          <Field label="비밀번호">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              placeholder="••••••••" className={inputCls} />
          </Field>
          {mode === "signup" && role === "applicant" && (
            <Field label="GitHub username (선택)">
              <input value={github} onChange={(e) => setGithub(e.target.value)}
                placeholder="예: torvalds" className={`${inputCls} font-mono`} />
            </Field>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60">
            {loading ? "처리 중…" : mode === "login" ? "로그인" : `${role === "applicant" ? "지원자" : "면접관"}로 가입`}
          </button>
        </form>
      </div>

      <Link href="/" className="mt-6 text-[13.5px] text-slate-500 hover:text-slate-700">← 홈으로</Link>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-[14px] outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}
