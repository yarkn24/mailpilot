/**
 * Shared types across providers.
 * The unified-inbox shape — every provider adapter returns these.
 */

export type Provider = "gmail" | "graph" | "imap";

export interface Account {
  id: string;             // internal stable id
  provider: Provider;
  email: string;          // user-facing identity (e.g. user@yahoo.com)
  displayName?: string;
  // IMAP-specific (encrypted in production; in demo: plaintext in-memory)
  imapHost?: string;
  imapPort?: number;
  imapUser?: string;
  imapPassword?: string;  // app password
  smtpHost?: string;
  smtpPort?: number;
  // OAuth-specific (for Gmail / Graph)
  oauthRefreshToken?: string;
  addedAt: string;        // ISO date
}

export interface MessageSummary {
  id: string;             // provider-scoped id
  accountId: string;
  threadId: string;
  messageId: string | null;   // RFC Message-ID
  from: { name?: string; address: string };
  to: { name?: string; address: string }[];
  subject: string;
  snippet: string;        // first ~140 chars of body
  date: string;           // ISO
  flags: { unread: boolean; flagged: boolean };
  labels: string[];       // Gmail labels / Graph categories / IMAP folders
}

export interface MessageBody {
  id: string;
  accountId: string;
  html: string | null;
  text: string | null;
  attachments: { filename: string; size: number; contentType: string }[];
}

export interface ListInboxOptions {
  limit?: number;
  cursor?: string;
}

export interface ProviderCapabilities {
  serverSideThreading: boolean;
  serverSideSearch: boolean;
  labels: "gmail" | "categories" | "folders" | "none";
  push: boolean;
}

export interface ConnectionStatus {
  ok: boolean;
  message?: string;
  capabilities?: ProviderCapabilities;
}
