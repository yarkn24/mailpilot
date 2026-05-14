/**
 * Account store — dual backend.
 *
 * - If `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set → Supabase Postgres.
 *   In that case `MAILPILOT_ENCRYPTION_KEY` MUST also be set. Plaintext
 *   passwords/refresh tokens never hit the database.
 * - Else → in-memory `Map` keyed by session cookie. Volatile across cold
 *   starts on Vercel serverless. Fine for demo, not for prod.
 *
 * Interface is stable so swapping backends is transparent to callers.
 */
import type { Account } from "./types";
import crypto from "node:crypto";
import { getSupabase } from "@/lib/db/supabase";
import { decrypt, encrypt, encryptionAvailable } from "@/lib/crypto/aes";

const MEMORY = new Map<string, Account[]>();

export function ensureSessionId(cookieHeader: string | null): string {
  const m = (cookieHeader ?? "").match(/mailpilot_sid=([a-f0-9]{32})/);
  return m?.[1] ?? crypto.randomBytes(16).toString("hex");
}

export async function listAccounts(sessionId: string): Promise<Account[]> {
  const sb = getSupabase();
  if (!sb) return MEMORY.get(sessionId) ?? [];

  const { data, error } = await sb
    .from("accounts")
    .select("*")
    .eq("session_id", sessionId)
    .order("added_at", { ascending: true });
  if (error) throw new Error(`supabase listAccounts: ${error.message}`);
  return (data ?? []).map(rowToAccount);
}

export async function getAccount(sessionId: string, accountId: string): Promise<Account | undefined> {
  const sb = getSupabase();
  if (!sb) return (MEMORY.get(sessionId) ?? []).find((a) => a.id === accountId);

  const { data, error } = await sb
    .from("accounts")
    .select("*")
    .eq("session_id", sessionId)
    .eq("id", accountId)
    .maybeSingle();
  if (error) throw new Error(`supabase getAccount: ${error.message}`);
  return data ? rowToAccount(data) : undefined;
}

export async function addAccount(
  sessionId: string,
  account: Omit<Account, "id" | "addedAt">,
): Promise<Account> {
  const id = crypto.randomBytes(8).toString("hex");
  const created: Account = {
    ...account,
    id,
    addedAt: new Date().toISOString(),
  };

  const sb = getSupabase();
  if (!sb) {
    const cur = MEMORY.get(sessionId) ?? [];
    MEMORY.set(sessionId, [...cur, created]);
    return created;
  }

  if (!encryptionAvailable()) {
    throw new Error(
      "Supabase backend enabled but MAILPILOT_ENCRYPTION_KEY not set — refusing to store plaintext secrets",
    );
  }

  // Idempotent upsert of the parent session row.
  await sb.from("sessions").upsert({ id: sessionId }, { onConflict: "id" });

  const row = accountToRow(sessionId, created);
  const { error } = await sb.from("accounts").insert(row);
  if (error) throw new Error(`supabase addAccount: ${error.message}`);
  return created;
}

export async function removeAccount(sessionId: string, accountId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) {
    const cur = MEMORY.get(sessionId) ?? [];
    const next = cur.filter((a) => a.id !== accountId);
    MEMORY.set(sessionId, next);
    return next.length !== cur.length;
  }

  const { error, count } = await sb
    .from("accounts")
    .delete({ count: "exact" })
    .eq("session_id", sessionId)
    .eq("id", accountId);
  if (error) throw new Error(`supabase removeAccount: ${error.message}`);
  return (count ?? 0) > 0;
}

/** Strip secrets before sending account info to the client. */
export function sanitizeAccount(a: Account) {
  return {
    id: a.id,
    provider: a.provider,
    email: a.email,
    displayName: a.displayName,
    addedAt: a.addedAt,
    capabilities: {
      labels:
        a.provider === "gmail" ? "gmail" :
        a.provider === "graph" ? "categories" : "folders",
    },
  };
}

// ---------- row <-> domain mapping ----------

interface AccountRow {
  id: string;
  session_id: string;
  provider: "gmail" | "graph" | "imap";
  email: string;
  display_name: string | null;
  imap_host: string | null;
  imap_port: number | null;
  imap_user: string | null;
  imap_password_encrypted: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  oauth_refresh_token_encrypted: string | null;
  ai_consent: boolean;
  added_at: string;
}

function rowToAccount(row: AccountRow): Account {
  return {
    id: row.id,
    provider: row.provider,
    email: row.email,
    displayName: row.display_name ?? undefined,
    imapHost: row.imap_host ?? undefined,
    imapPort: row.imap_port ?? undefined,
    imapUser: row.imap_user ?? undefined,
    imapPassword: row.imap_password_encrypted
      ? decrypt(row.imap_password_encrypted)
      : undefined,
    smtpHost: row.smtp_host ?? undefined,
    smtpPort: row.smtp_port ?? undefined,
    oauthRefreshToken: row.oauth_refresh_token_encrypted
      ? decrypt(row.oauth_refresh_token_encrypted)
      : undefined,
    addedAt: row.added_at,
  };
}

function accountToRow(sessionId: string, a: Account): AccountRow {
  return {
    id: a.id,
    session_id: sessionId,
    provider: a.provider,
    email: a.email,
    display_name: a.displayName ?? null,
    imap_host: a.imapHost ?? null,
    imap_port: a.imapPort ?? null,
    imap_user: a.imapUser ?? null,
    imap_password_encrypted: a.imapPassword ? encrypt(a.imapPassword) : null,
    smtp_host: a.smtpHost ?? null,
    smtp_port: a.smtpPort ?? null,
    oauth_refresh_token_encrypted: a.oauthRefreshToken
      ? encrypt(a.oauthRefreshToken)
      : null,
    ai_consent: false,
    added_at: a.addedAt,
  };
}
