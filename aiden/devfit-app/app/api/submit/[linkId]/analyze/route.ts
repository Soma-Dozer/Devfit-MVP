import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { runAnalysis } from "@/lib/analyze";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: { linkId: string } },
) {
  const db = getDb();

  const sub = await db.getSubmission(params.linkId);
  if (!sub) {
    return NextResponse.json(
      { ok: false, error: "제출을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  // Idempotent: never double-run an in-flight or completed analysis.
  if (sub.analysisStatus === "running" || sub.analysisStatus === "done") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await db.updateAnalysis(params.linkId, { analysisStatus: "running" });

  try {
    const result = await runAnalysis(sub.githubUrl);
    await db.updateAnalysis(params.linkId, {
      analysisStatus: "done",
      analysis: result,
      analysisError: null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "분석 실패";
    await db.updateAnalysis(params.linkId, {
      analysisStatus: "error",
      analysisError: message,
    });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
