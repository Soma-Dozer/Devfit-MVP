"use client";

import { useState } from "react";
import type { InterviewQuestion } from "@/lib/types";

/**
 * Exhibit 카드 — HP 톤(흰 카드, Soft Lift, 16px, 블루 좌측 액센트).
 * 면접 질문을 번호 붙은 증거로: 구조 라벨(sans 트래킹) + 질문(sans) +
 * 접이식 면접관 노트 + 근거 인용(mono SHA·경로).
 */
export function QuestionCard({
  question,
  index,
  highlight,
}: {
  question: InterviewQuestion;
  index: number;
  highlight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const detailsId = `exhibit-${question.layer}-${index}-note`;
  const ref = `EXHIBIT ${String(index + 1).padStart(2, "0")}`;

  return (
    <article
      className={[
        "group overflow-hidden rounded-xl bg-canvas shadow-lift transition-colors",
        highlight ? "border border-primary/40" : "border border-hairline hover:border-primary/40",
      ].join(" ")}
    >
      <div className="grid grid-cols-[3px_1fr]">
        {/* 좌측 액센트 레일 */}
        <div aria-hidden="true" className={highlight ? "bg-primary" : "bg-hairline"} />

        <div className="p-5">
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs uppercase tracking-button">
            <span className="font-semibold text-graphite">{ref}</span>
            <span aria-hidden="true" className="text-steel">·</span>
            <span className="font-semibold text-primary">{question.category}</span>
          </div>

          <p className="text-base font-medium leading-relaxed text-ink sm:text-lg">
            {question.question}
          </p>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={detailsId}
            className="mt-4 inline-flex items-center gap-1.5 rounded text-xs font-semibold uppercase tracking-button text-primary transition-colors hover:text-primary-deep"
          >
            <span aria-hidden="true">{open ? "▾" : "▸"}</span>
            {open ? "면접관 노트 접기" : "면접관 노트 보기"}
          </button>

          {open && (
            <dl id={detailsId} className="mt-4 space-y-4 border-t border-hairline pt-4 animate-fade-up">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-button text-graphite">
                  이 질문이 검증하는 것
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-charcoal">{question.rationale}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-button text-graphite">
                  이런 답이면 진짜
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-charcoal">{question.goodAnswer}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-button text-graphite">근거</dt>
                <dd className="mt-1 rounded-lg border border-hairline bg-cloud px-3 py-2 font-mono text-xs leading-relaxed text-charcoal">
                  <span className="select-none text-primary">↳ </span>
                  {question.evidence}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </article>
  );
}
