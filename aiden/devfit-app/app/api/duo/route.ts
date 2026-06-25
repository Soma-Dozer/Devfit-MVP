import { NextResponse } from "next/server";
import { analyzeForInterviewer, analyzeForJobseeker } from "@/lib/engine/analyze";
import type { DuoRequest, DuoResponse, IntentId, Persona } from "@/lib/engine/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_PERSONAS: Persona[] = ["interviewer", "jobseeker"];
const VALID_INTENTS: IntentId[] = ["killer", "fundamentals", "cs", "all"];

/**
 * 양면 결정론 분석 API (LLM 0회).
 *   POST { url, persona, intent? }
 * 같은 url이라도 persona/intent에 따라 서로 다른 결과를 돌려준다.
 */
export async function POST(req: Request) {
  let body: Partial<DuoRequest>;
  try {
    body = (await req.json()) as Partial<DuoRequest>;
  } catch {
    return NextResponse.json<DuoResponse>(
      { ok: false, error: "요청 본문(JSON)이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) {
    return NextResponse.json<DuoResponse>(
      { ok: false, error: "GitHub URL을 입력해 주세요." },
      { status: 400 },
    );
  }

  const persona: Persona = VALID_PERSONAS.includes(body.persona as Persona)
    ? (body.persona as Persona)
    : "interviewer";

  try {
    if (persona === "jobseeker") {
      const jobseeker = await analyzeForJobseeker(url);
      return NextResponse.json<DuoResponse>({ ok: true, jobseeker });
    }
    const intent: IntentId = VALID_INTENTS.includes(body.intent as IntentId)
      ? (body.intent as IntentId)
      : "all";
    const interviewer = await analyzeForInterviewer(url, intent);
    return NextResponse.json<DuoResponse>({ ok: true, interviewer });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "분석 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json<DuoResponse>({ ok: false, error: message }, { status: 502 });
  }
}
