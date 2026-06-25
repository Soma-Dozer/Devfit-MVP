import type { Question } from "@/lib/api";

export default function QuestionList({ questions }: { questions: Question[] }) {
  if (!questions.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-[13px] text-slate-500">
        이 스니펫의 질문이 생성되지 않았습니다. (상단 안내 참고)
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {questions.map((q, i) => (
        <li key={i} className="rounded-xl border border-slate-200 bg-white p-3.5">
          <div className="flex gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-[11px] font-bold text-indigo-600">
              {i + 1}
            </span>
            <div>
              <p className="text-[14px] leading-relaxed text-slate-800">{q.text}</p>
              {q.rationale && (
                <p className="mt-2 border-t border-slate-100 pt-2 text-[12.5px] leading-relaxed text-slate-500">
                  <span className="font-semibold text-slate-600">확인 포인트 ·</span>{" "}
                  {q.rationale}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
