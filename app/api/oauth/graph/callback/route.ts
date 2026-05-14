import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, loadConfig, whoAmI } from "@/lib/oauth/graph";
import { consume } from "@/lib/oauth/state";
import { addAccount, ensureSessionId } from "@/lib/email/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) return errRedirect(`Microsoft returned error: ${error}`);
  if (!code || !state) return errRedirect("missing code or state");

  const cfg = loadConfig();
  if (!cfg) return errRedirect("Graph OAuth not configured");

  const sid = ensureSessionId(req.headers.get("cookie"));
  const issued = consume(state, sid, "graph");
  if (!issued) return errRedirect("invalid or expired state");

  let tokens;
  try {
    tokens = await exchangeCode(cfg, code, issued.verifier);
  } catch (e) {
    return errRedirect(e instanceof Error ? e.message : "token exchange failed");
  }
  if (!tokens.refresh_token) {
    return errRedirect("Microsoft did not return a refresh_token. Ensure offline_access scope.");
  }

  let me;
  try {
    me = await whoAmI(tokens.access_token);
  } catch (e) {
    return errRedirect("could not read /me from Graph");
  }
  const email = me.mail ?? me.userPrincipalName ?? "unknown@m365";

  try {
    await addAccount(sid, {
      provider: "graph",
      email,
      displayName: email,
      oauthRefreshToken: tokens.refresh_token,
    });
  } catch (e) {
    return errRedirect(e instanceof Error ? e.message : "could not persist account");
  }

  const ok = NextResponse.redirect(new URL("/settings?connected=graph", req.url));
  ok.cookies.set("mailpilot_sid", sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return ok;
}

function errRedirect(msg: string) {
  return NextResponse.redirect(`/settings?error=${encodeURIComponent(msg)}`, { status: 302 });
}
