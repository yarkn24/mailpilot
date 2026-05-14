/**
 * Account store — DEMO-grade.
 *
 * Stores accounts in an in-memory Map keyed by a session cookie.
 * On Vercel serverless this means accounts vanish between invocations.
 * Production: replace with Neon Postgres + per-user KEK encryption.
 *
 * The interface here is stable so swapping the backing store is mechanical.
 */
import type { Account } from "./types";
import crypto from "node:crypto";

const ACCOUNTS = new Map<string, Account[]>(); // sessionId → accounts

export function ensureSessionId(cookieHeader: string | null): string {
  const m = (cookieHeader ?? "").match(/mailpilot_sid=([a-f0-9]{32})/);
  return m?.[1] ?? crypto.randomBytes(16).toString("hex");
}

export function listAccounts(sessionId: string): Account[] {
  return ACCOUNTS.get(sessionId) ?? [];
}

export function getAccount(sessionId: string, accountId: string): Account | undefined {
  return listAccounts(sessionId).find((a) => a.id === accountId);
}

export function addAccount(sessionId: string, account: Omit<Account, "id" | "addedAt">): Account {
  const created: Account = {
    ...account,
    id: crypto.randomBytes(8).toString("hex"),
    addedAt: new Date().toISOString(),
  };
  const cur = ACCOUNTS.get(sessionId) ?? [];
  ACCOUNTS.set(sessionId, [...cur, created]);
  return created;
}

export function removeAccount(sessionId: string, accountId: string): boolean {
  const cur = ACCOUNTS.get(sessionId) ?? [];
  const next = cur.filter((a) => a.id !== accountId);
  ACCOUNTS.set(sessionId, next);
  return next.length !== cur.length;
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
