"use client";

import { useCallback, useEffect, useState } from "react";
import type { Link as LinkRecord } from "@/lib/db/types";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { CreateLink } from "@/components/dashboard/CreateLink";
import { LinkRow } from "@/components/dashboard/LinkRow";

export default function DashboardPage() {
  const [links, setLinks] = useState<LinkRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calling GET /api/links on load also ensures the owner cookie is set
  // (route handlers can set cookies; this page, as a client component,
  // triggers that fetch) so later server-component reads can authorize.
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/links", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "목록을 불러오지 못했습니다.");
        return;
      }
      setError(null);
      setLinks(data.links as LinkRecord[]);
    } catch {
      setError("요청에 실패했습니다. 네트워크 상태를 확인해 주세요.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <SiteHeader variant="app" />

      <main className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-12 animate-fade-up">
          <p className="eyebrow">INTERVIEWER CONSOLE</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            면접 콘솔
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-charcoal">
            후보별 면접 링크를 만들고, 제출된 코드 분석을 확인하세요.
          </p>
        </div>

        <div className="mb-16">
          <CreateLink onCreated={load} />
        </div>

        <section aria-labelledby="links-heading">
          <h2
            id="links-heading"
            className="mb-5 text-xs font-semibold uppercase tracking-button text-graphite"
          >
            면접 링크
          </h2>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-error/30 bg-error/[0.08] p-5 text-error animate-fade-up"
            >
              <p className="text-sm leading-relaxed">{error}</p>
            </div>
          )}

          {!error && links === null && (
            <div
              role="status"
              aria-live="polite"
              className="card flex items-center gap-3 p-6"
            >
              <span
                aria-hidden="true"
                className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
              />
              <p className="text-xs font-semibold uppercase tracking-button text-primary">
                불러오는 중…
              </p>
            </div>
          )}

          {!error && links !== null && links.length === 0 && (
            <div className="card p-8 animate-fade-up">
              <p className="text-sm leading-relaxed text-charcoal">
                아직 생성한 면접 링크가 없습니다. 위에서 첫 링크를 만들어 후보에게
                보내세요.
              </p>
            </div>
          )}

          {!error && links !== null && links.length > 0 && (
            <ul className="space-y-4 animate-fade-up">
              {links.map((link) => (
                <LinkRow key={link.id} link={link} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
