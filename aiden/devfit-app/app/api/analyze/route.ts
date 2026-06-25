import { NextResponse } from "next/server";
import { runAnalysis } from "@/lib/analyze";
import type { AnalyzeRequest, AnalyzeResponse } from "@/lib/types";

// GitHub fetch + multiple GPT calls can take a while.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request): Promise<NextResponse<AnalyzeResponse>> {
  try {
    const body = (await req.json()) as Partial<AnalyzeRequest>;
    const url = (body.url ?? "").trim();
    if (!url) {
      return NextResponse.json(
        { ok: false, error: "URL을 입력해 주세요." },
        { status: 400 },
      );
    }
    const result = await runAnalysis(url);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "분석 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
