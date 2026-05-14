/**
 * Gmail provider — OAuth scaffold + stub.
 *
 * Real implementation requires:
 *  1. Google Cloud Console OAuth client (CASA tier-3 audit for production scope)
 *  2. PKCE Authorization Code flow
 *  3. Refresh-token-encrypted storage
 *  4. Gmail watch / Pub/Sub for push (separate worker tier)
 *
 * Out of scope for this PR — the route handlers return a clear
 * "not yet wired" message so the UI doesn't lie.
 */
import type { Account, ConnectionStatus, ListInboxOptions, MessageBody, MessageSummary } from "../types";

const NOT_WIRED = "Gmail OAuth is not wired in this preview. The provider abstraction is in place; the OAuth flow lands in a follow-up. See docs/ARCHITECTURE.md.";

export async function testConnection(_a: Account): Promise<ConnectionStatus> {
  return { ok: false, message: NOT_WIRED };
}

export async function listInbox(_a: Account, _opts: ListInboxOptions = {}): Promise<MessageSummary[]> {
  throw new Error(NOT_WIRED);
}

export async function getMessageBody(_a: Account, _id: string): Promise<MessageBody> {
  throw new Error(NOT_WIRED);
}

export async function markRead(_a: Account, _id: string): Promise<void> {
  throw new Error(NOT_WIRED);
}

export async function archive(_a: Account, _id: string): Promise<void> {
  throw new Error(NOT_WIRED);
}

export async function trash(_a: Account, _id: string): Promise<void> {
  throw new Error(NOT_WIRED);
}

export async function searchInbox(_a: Account, _q: string): Promise<string[]> {
  throw new Error(NOT_WIRED);
}
