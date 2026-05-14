/**
 * POST /api/demo/seed
 *
 * One-click demo: takes a `persona` (yahoo | aol | office365 | gmail) and:
 *   1. Creates an Account record with provider="demo" + that persona's email
 *   2. Seeds the in-memory mailbox with realistic fixtures, including cross-
 *      account threads (i.e. your demo Gmail will have a thread with your
 *      demo Yahoo, so the unified inbox + account switcher both light up)
 *   3. Redirects to /inbox via JSON response (client-side router.push)
 *
 * Bypasses OAuth entirely — this is the path a reviewer can click to see
 * the entire product working without giving us any credentials.
 */
import { NextRequest, NextResponse } from "next/server";
import { addAccount, ensureSessionId, listAccounts } from "@/lib/email/store";
import { DEMO_PERSONAS, type DemoPersona, seedDemoMail } from "@/lib/email/providers/demo";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sid = ensureSessionId(req.headers.get("cookie"));
  const body = await req.json().catch(() => null) as { persona?: DemoPersona } | null;
  const persona = body?.persona;
  if (!persona || !DEMO_PERSONAS.find((p) => p.persona === persona)) {
    return NextResponse.json({ error: "invalid persona" }, { status: 400 });
  }
  const info = DEMO_PERSONAS.find((p) => p.persona === persona)!;

  // Don't add the same demo persona twice
  const existing = await listAccounts(sid);
  if (existing.some((a) => a.provider === "demo" && a.email === info.email)) {
    return withCookie(NextResponse.json({ ok: true, alreadyExists: true }), sid);
  }

  const created = await addAccount(sid, {
    provider: "demo",
    email: info.email,
    displayName: info.displayName,
  });
  seedDemoMail(created.id, persona);

  return withCookie(NextResponse.json({ ok: true, accountId: created.id }), sid);
}

function withCookie(res: NextResponse, sid: string) {
  res.cookies.set("mailpilot_sid", sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
