"use client";

import NextLink from "next/link";
import { useState } from "react";
import type { Link as LinkRecord } from "@/lib/db/types";
import { Pill } from "@/components/ui/Pill";

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

/** One interview link in the dashboard list — status badge, share URL, copy. */
export function LinkRow({ link }: { link: LinkRecord }) {
  const [copied, setCopied] = useState(false);
  const submitUrl =
    typeof window !== "undefined" ? `${window.location.origin}/submit/${link.id}` : "";
  const submitted = link.status === "submitted";

  async function onCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!submitUrl) return;
    try {
      await navigator.clipboard.writeText(submitUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop — user can select manually */
    }
  }

  return (
    <li className="card overflow-hidden transition-colors hover:border-steel">
      <NextLink
        href={`/dashboard/${link.id}`}
        className="block rounded-xl p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <p className="text-base font-semibold text-ink">
              {link.positionLabel}
            </p>
            <p className="mt-1 text-xs text-graphite">
              {shortDate(link.createdAt)}
            </p>
          </div>
          {submitted ? (
            <Pill tone="primary">제출됨</Pill>
          ) : (
            <Pill tone="default">대기 중 · 미제출</Pill>
          )}
        </div>
      </NextLink>

      <div className="flex flex-col gap-2 border-t border-hairline px-5 py-4 sm:flex-row sm:items-center">
        <code className="flex-1 truncate rounded-md border border-hairline bg-cloud px-3 py-2 font-mono text-xs text-charcoal">
          {submitUrl || `/submit/${link.id}`}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="btn-outline-ink h-9 shrink-0 px-4 text-xs"
        >
          {copied ? "복사됨" : "복사"}
        </button>
      </div>
    </li>
  );
}
