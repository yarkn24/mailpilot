import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, loadConfig, whoAmI } from "@/lib/oauth/gmail";
import { consume } from "@/lib/oauth/state";
import { addAccount, ensureSessionId } from "@/lib/email/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) return errorRedirect(`Google returned error: ${error}`);
  if (!code || !state) return errorRedirect("missing code or state");

  const cfg = loadConfig();
  if (!cfg) return errorRedirect("Gmail OAuth not configured");

  const sid = ensureSessionId(req.headers.get("cookie"));
  const issued = consume(state, sid, "gmail");
  if (!issued) return errorRedirect("invalid or expired state");

  let tokens;
  try {
    tokens = await exchangeCode(cfg, code, issued.verifier);
  } catch (e) {
    return errorRedirect(e instanceof Error ? e.message : "token exchange failed");
  }
  if (!tokens.refresh_token) {
    return errorRedirect("Google did not return a refresh_token. Revoke access at myaccount.google.com and retry.");
  }

  let who;
  try {
    who = await whoAmI(tokens.access_token);
  } catch (e) {
    return errorRedirect("could not read user email");
  }

  try {
    await addAccount(sid, {
      provider: "gmail",
      email: who.email,
      displayName: who.email,
      oauthRefreshToken: tokens.refresh_token,
    });
  } catch (e) {
    return errorRedirect(e instanceof Error ? e.message : "could not persist account");
  }

  const ok = NextResponse.redirect(new URL("/settings?connected=gmail", req.url));
  ok.cookies.set("mailpilot_sid", sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return ok;
}

function errorRedirect(msg: string) {
  return NextResponse.redirect(`/settings?error=${encodeURIComponent(msg)}`, { status: 302 });
}
