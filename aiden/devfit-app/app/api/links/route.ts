import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  readOwnerToken,
  newOwnerToken,
  OWNER_COOKIE,
  OWNER_COOKIE_OPTIONS,
} from "@/lib/owner";

// The ONLY place that sets the owner cookie. Server Components can read the
// cookie (readOwnerToken) but cannot set it in Next 14 — so the dashboard
// calls GET here on load to guarantee the cookie exists for later reads.

/** Returns the existing token, or a freshly minted one flagged as new. */
function ensureToken(): { token: string; isNew: boolean } {
  const existing = readOwnerToken();
  if (existing) return { token: existing, isNew: false };
  return { token: newOwnerToken(), isNew: true };
}

function withCookie<T>(body: T, token: string, isNew: boolean) {
  const res = NextResponse.json(body);
  if (isNew) {
    res.cookies.set(OWNER_COOKIE, token, OWNER_COOKIE_OPTIONS);
  }
  return res;
}

export async function GET() {
  const { token, isNew } = ensureToken();
  const db = getDb();
  const links = await db.listLinksByOwner(token);
  return withCookie({ ok: true, links }, token, isNew);
}

export async function POST(req: Request) {
  let positionLabel = "";
  try {
    const body = await req.json();
    positionLabel = typeof body?.positionLabel === "string" ? body.positionLabel.trim() : "";
  } catch {
    positionLabel = "";
  }

  if (!positionLabel) {
    return NextResponse.json(
      { ok: false, error: "포지션 라벨을 입력해 주세요." },
      { status: 400 },
    );
  }

  const { token, isNew } = ensureToken();
  const db = getDb();
  const link = await db.createLink({ ownerToken: token, positionLabel });
  return withCookie({ ok: true, link }, token, isNew);
}
