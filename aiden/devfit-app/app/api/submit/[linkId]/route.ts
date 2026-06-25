import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { SubmissionInput } from "@/lib/db/types";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { linkId: string } },
) {
  let body: Partial<SubmissionInput>;
  try {
    body = (await req.json()) as Partial<SubmissionInput>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "요청 본문을 읽지 못했습니다." },
      { status: 400 },
    );
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const position = (body.position ?? "").trim();
  const claims = (body.claims ?? "").trim();
  const githubUrl = (body.githubUrl ?? "").trim();

  if (!name || !email || !githubUrl) {
    return NextResponse.json(
      { ok: false, error: "이름, 이메일, GitHub URL은 필수 항목입니다." },
      { status: 400 },
    );
  }

  const db = getDb();

  const link = await db.getLink(params.linkId);
  if (!link) {
    return NextResponse.json(
      { ok: false, error: "유효하지 않은 링크입니다." },
      { status: 404 },
    );
  }

  const existing = await db.getSubmission(params.linkId);
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "이미 제출된 링크입니다." },
      { status: 409 },
    );
  }

  await db.saveSubmission(params.linkId, {
    name,
    email,
    position,
    claims,
    githubUrl,
  });

  return NextResponse.json({ ok: true });
}
