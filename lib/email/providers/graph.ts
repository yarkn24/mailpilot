/**
 * Microsoft Graph provider — OAuth scaffold + stub.
 *
 * Real implementation requires:
 *  1. Azure AD app registration (Publisher Verification for cross-tenant)
 *  2. Mail.ReadWrite + offline_access scopes (admin consent for some tenants)
 *  3. Graph subscriptions for push (3-day TTL, lifecycle notifications)
 *
 * Out of scope for this PR — same shape as Gmail stub.
 */
import type { Account, ConnectionStatus, ListInboxOptions, MessageBody, MessageSummary } from "../types";

const NOT_WIRED = "Microsoft 365 OAuth is not wired in this preview. The provider abstraction is in place; the OAuth flow lands in a follow-up. See docs/ARCHITECTURE.md.";

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
