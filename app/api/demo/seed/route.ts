/**
 * POST /api/demo/seed
 *
 * One-click demo. Takes a `persona` (yahoo | aol | office365 | gmail) and:
 *   1. Activates that persona by appending it to the `mailpilot_demo` cookie.
 *   2. Calls `hydrateDemoAccounts` which creates a deterministic Account
 *      (id = `demo-{persona}-{sidShort}`) and seeds the in-memory mailbox.
 *
 * On Vercel serverless any subsequent request will re-hydrate the same state
 * from the cookie — that's how we survive cold starts without a database.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  ensureSessionId,
  hydrateDemoAccounts,
  parseDemoPersonas,
  serializeDemoCookie,
} from "@/lib/email/store";
import { DEMO_PERSONAS, type DemoPersona } from "@/lib/email/providers/demo";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie");
  const sid = ensureSessionId(cookieHeader);
  const body = (await req.json().catch(() => null)) as { persona?: DemoPersona } | null;
  const persona = body?.persona;
  if (!persona || !DEMO_PERSONAS.find((p) => p.persona === persona)) {
    return NextResponse.json({ error: "invalid persona" }, { status: 400 });
  }

  const personas = parseDemoPersonas(cookieHeader);
  if (!personas.includes(persona)) personas.push(persona);

  const fakeCookie = `mailpilot_demo=${serializeDemoCookie(personas)}`;
  hydrateDemoAccounts(sid, fakeCookie);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("mailpilot_sid", sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  res.cookies.set("mailpilot_demo", serializeDemoCookie(personas), {
    httpOnly: false, // client-visible so the UI can render demo state if needed
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
