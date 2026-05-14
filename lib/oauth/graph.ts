/**
 * Microsoft Graph OAuth 2.0 — Authorization Code flow with PKCE.
 *
 * Required env vars:
 *   MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_REDIRECT_URI
 *   MICROSOFT_TENANT (defaults to "common" for multi-tenant + personal)
 *
 * Setup: https://entra.microsoft.com → App registrations → New →
 *   Web platform redirect URI: https://<host>/api/oauth/graph/callback
 *   API permissions: Microsoft Graph → Delegated:
 *     Mail.ReadWrite, Mail.Send, User.Read, offline_access
 *   Create a client secret under Certificates & secrets.
 */
import crypto from "node:crypto";

const TENANT_DEFAULT = "common";

export const SCOPES = [
  "https://graph.microsoft.com/Mail.ReadWrite",
  "https://graph.microsoft.com/Mail.Send",
  "https://graph.microsoft.com/User.Read",
  "offline_access",
].join(" ");

export interface GraphOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tenant: string;
}

export function loadConfig(): GraphOAuthConfig | null {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return {
    clientId,
    clientSecret,
    redirectUri,
    tenant: process.env.MICROSOFT_TENANT || TENANT_DEFAULT,
  };
}

export function pkce() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function authorizeUrl(cfg: GraphOAuthConfig, state: string, codeChallenge: string): string {
  const u = new URL(`https://login.microsoftonline.com/${cfg.tenant}/oauth2/v2.0/authorize`);
  u.searchParams.set("client_id", cfg.clientId);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("redirect_uri", cfg.redirectUri);
  u.searchParams.set("response_mode", "query");
  u.searchParams.set("scope", SCOPES);
  u.searchParams.set("state", state);
  u.searchParams.set("code_challenge", codeChallenge);
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("prompt", "select_account");
  return u.toString();
}

export interface GraphTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: "Bearer";
  scope: string;
  id_token?: string;
}

async function tokenEndpoint(cfg: GraphOAuthConfig, body: URLSearchParams): Promise<GraphTokens> {
  const r = await fetch(`https://login.microsoftonline.com/${cfg.tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new Error(`token call failed: ${r.status} ${await r.text()}`);
  return r.json();
}

export function exchangeCode(cfg: GraphOAuthConfig, code: string, verifier: string) {
  return tokenEndpoint(
    cfg,
    new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
      code,
      grant_type: "authorization_code",
      code_verifier: verifier,
      scope: SCOPES,
    }),
  );
}

export function refreshAccessToken(cfg: GraphOAuthConfig, refreshToken: string) {
  return tokenEndpoint(
    cfg,
    new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: SCOPES,
    }),
  );
}

export async function whoAmI(accessToken: string): Promise<{ mail?: string; userPrincipalName?: string }> {
  const r = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error("graph /me failed");
  return r.json();
}
