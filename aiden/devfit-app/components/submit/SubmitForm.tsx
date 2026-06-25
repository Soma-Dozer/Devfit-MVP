"use client";

import { useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SubmitForm({
  linkId,
  positionLabel,
}: {
  linkId: string;
  positionLabel: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState(positionLabel);
  const [claims, setClaims] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    // ── Basic client validation ─────────────────────────────────
    if (!name.trim() || !email.trim() || !githubUrl.trim()) {
      setError("이름, 이메일, GitHub URL을 모두 입력해 주세요.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("올바른 이메일 형식이 아닙니다.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/submit/${linkId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          position: position.trim(),
          claims: claims.trim(),
          githubUrl: githubUrl.trim(),
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;

      if (!res.ok || !data?.ok) {
        setError(
          data?.error ?? "제출에 실패했습니다. 다시 시도해 주세요.",
        );
        setSubmitting(false);
        return;
      }

      // Success — show confirmation immediately, then fire-and-forget
      // the analysis trigger so the UI never blocks on it.
      setDone(true);
      fetch(`/api/submit/${linkId}/analyze`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {});
    } catch {
      setError("제출에 실패했습니다. 다시 시도해 주세요.");
      setSubmitting(false);
    }
  }

  // ── Done state ──────────────────────────────────────────────
  if (done) {
    return (
      <section
        aria-labelledby="thanks-title"
        className="card p-8"
      >
        <div
          aria-hidden="true"
          className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary text-white"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2
          id="thanks-title"
          className="text-xl font-bold tracking-tight text-ink"
        >
          제출해 주셔서 감사합니다 — 분석이 진행됩니다.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-charcoal">
          이 창은 닫으셔도 됩니다.
        </p>
      </section>
    );
  }

  // ── Form ────────────────────────────────────────────────────
  const labelClass = "text-sm font-medium text-ink";
  const hintClass = "text-xs text-graphite";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="card flex flex-col gap-6 p-6 sm:p-8"
    >
      {/* 이름 */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className={labelClass}>
          이름 <span className="text-error">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          className="input w-full"
        />
      </div>

      {/* 이메일 */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={labelClass}>
          이메일 <span className="text-error">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="input w-full"
        />
      </div>

      {/* 지원 포지션 */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="position" className={labelClass}>
          지원 포지션
        </label>
        <input
          id="position"
          name="position"
          type="text"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="input w-full"
        />
      </div>

      {/* 강조하고 싶은 점 */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="claims" className={labelClass}>
          경력·프로젝트에서 강조하고 싶은 점
        </label>
        <textarea
          id="claims"
          name="claims"
          rows={4}
          value={claims}
          onChange={(e) => setClaims(e.target.value)}
          placeholder="예: 결제 모듈 동시성 버그를 해결했습니다"
          className="input h-auto w-full resize-y py-2.5"
        />
        <p className={hintClass}>선택 입력</p>
      </div>

      {/* GitHub URL */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="githubUrl" className={labelClass}>
          GitHub 프로필 또는 레포 URL <span className="text-error">*</span>
        </label>
        <input
          id="githubUrl"
          name="githubUrl"
          type="url"
          required
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/username"
          inputMode="url"
          className="input w-full font-mono"
        />
        <p className={hintClass}>공개(public) 저장소만 분석합니다.</p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-error/30 bg-error/[0.08] px-3.5 py-2.5 text-sm text-error"
        >
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary mt-1">
        {submitting ? "제출 중…" : "제출하기"}
      </button>
    </form>
  );
}
