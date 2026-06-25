"use client";

import { useState } from "react";

/**
 * Compact panel to mint a new interview link. POSTs to /api/links, then
 * surfaces the shareable /submit/{id} URL with a copy affordance and asks
 * the dashboard to refetch via onCreated.
 */
export function CreateLink({ onCreated }: { onCreated?: () => void }) {
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const submitUrl =
    createdId && typeof window !== "undefined"
      ? `${window.location.origin}/submit/${createdId}`
      : "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setCreatedId(null);
    setCopied(false);

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionLabel: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.link) {
        setError(data?.error ?? "링크 생성에 실패했습니다.");
        return;
      }
      setCreatedId(data.link.id as string);
      setLabel("");
      onCreated?.();
    } catch {
      setError("요청에 실패했습니다. 네트워크 상태를 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function onCopy() {
    if (!submitUrl) return;
    try {
      await navigator.clipboard.writeText(submitUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("복사에 실패했습니다. 주소를 직접 복사해 주세요.");
    }
  }

  return (
    <section className="card p-6 sm:p-8">
      <p className="eyebrow">NEW LINK</p>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">
        새 면접 링크
      </h2>
      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label htmlFor="position-label" className="sr-only">
          포지션 라벨
        </label>
        <input
          id="position-label"
          type="text"
          autoComplete="off"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={loading}
          placeholder="포지션 라벨 (예: 백엔드 엔지니어 신입)"
          className="input w-full flex-1 text-sm disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || label.trim().length === 0}
          className="btn-primary shrink-0"
        >
          {loading ? "생성 중…" : "면접 링크 생성"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-3 text-sm leading-relaxed text-error">
          {error}
        </p>
      )}

      {createdId && submitUrl && (
        <div className="mt-5 rounded-lg border border-primary/30 bg-primary/[0.05] p-4 animate-fade-up">
          <p className="text-xs font-semibold uppercase tracking-button text-primary">
            공유 링크 생성됨
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-md border border-hairline bg-cloud px-3 py-2 font-mono text-xs text-ink">
              {submitUrl}
            </code>
            <button
              type="button"
              onClick={onCopy}
              className="btn-outline h-9 shrink-0 px-4 text-xs"
            >
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-charcoal">
            이 주소를 후보에게 보내세요. 제출되면 아래 목록에서 분석 결과를 확인할 수 있습니다.
          </p>
        </div>
      )}
    </section>
  );
}
