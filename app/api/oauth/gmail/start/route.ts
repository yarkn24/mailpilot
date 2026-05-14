import { NextRequest, NextResponse } from "next/server";
import { authorizeUrl, loadConfig, pkce } from "@/lib/oauth/gmail";
import { issue } from "@/lib/oauth/state";
import { ensureSessionId } from "@/lib/email/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const cfg = loadConfig();
  if (!cfg) {
    const msg = "Gmail OAuth not yet configured on this server. The operator needs to set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.";
    return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(msg)}`, req.url), { status: 302 });
  }
  const sid = ensureSessionId(req.headers.get("cookie"));
  const { verifier, challenge } = pkce();
  const state = issue(sid, "gmail", verifier);

  const res = NextResponse.redirect(authorizeUrl(cfg, state, challenge));
  res.cookies.set("mailpilot_sid", sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
