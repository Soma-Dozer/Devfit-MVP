import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

// Cookie-based interviewer identity — no login (MVP). The dashboard
// shows only links owned by the token in this cookie. The cookie is
// SET by route handlers (Server Components cannot set cookies in Next 14);
// Server Components only READ it via readOwnerToken().

export const OWNER_COOKIE = "gp_owner";

export const OWNER_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 year
};

/** Read-only: usable in Server Components and Route Handlers. */
export function readOwnerToken(): string | null {
  return cookies().get(OWNER_COOKIE)?.value ?? null;
}

/** Generate a fresh unguessable interviewer token. */
export function newOwnerToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}
