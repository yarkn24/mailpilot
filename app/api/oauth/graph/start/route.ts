import { NextRequest, NextResponse } from "next/server";
import { authorizeUrl, loadConfig, pkce } from "@/lib/oauth/graph";
import { issue } from "@/lib/oauth/state";
import { ensureSessionId } from "@/lib/email/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const cfg = loadConfig();
  if (!cfg) {
    const msg = "Microsoft 365 OAuth not yet configured on this server. The operator needs to set MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, and MICROSOFT_REDIRECT_URI.";
    return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(msg)}`, req.url), { status: 302 });
  }
  const sid = ensureSessionId(req.headers.get("cookie"));
  const { verifier, challenge } = pkce();
  const state = issue(sid, "graph", verifier);

  const res = NextResponse.redirect(authorizeUrl(cfg, state, challenge), { status: 302 });
  res.cookies.set("mailpilot_sid", sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
