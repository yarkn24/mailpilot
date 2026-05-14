/**
 * Gmail provider — real implementation via Gmail REST API.
 *
 * Auth: per-account refresh_token stored on the Account record. We exchange
 * it for an access_token on every operation (simple; no cache in v0.1).
 * Production should cache access_token until expiry.
 */
import { loadConfig, refreshAccessToken } from "@/lib/oauth/gmail";
import type {
  Account,
  ConnectionStatus,
  ListInboxOptions,
  MessageBody,
  MessageSummary,
} from "../types";

const BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

async function accessToken(a: Account): Promise<string> {
  const cfg = loadConfig();
  if (!cfg) throw new Error("Gmail OAuth not configured on this server");
  if (!a.oauthRefreshToken) throw new Error("account has no refresh token");
  const r = await refreshAccessToken(cfg, a.oauthRefreshToken);
  return r.access_token;
}

async function api<T>(a: Account, path: string, init?: RequestInit): Promise<T> {
  const token = await accessToken(a);
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`gmail api ${path}: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function testConnection(a: Account): Promise<ConnectionStatus> {
  try {
    await api<{ emailAddress: string }>(a, "/profile");
    return {
      ok: true,
      capabilities: {
        serverSideThreading: true,
        serverSideSearch: true,
        labels: "gmail",
        push: true,
      },
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "connect failed" };
  }
}

function header(headers: { name: string; value: string }[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function parseAddr(raw: string): { name?: string; address: string } {
  // "Alice Smith <alice@example.com>" or just "alice@example.com"
  const m = raw.match(/^(?:"?([^"<]+)"?\s+)?<?([^>\s]+@[^>\s]+)>?$/);
  if (!m) return { address: raw.trim() };
  return { name: m[1]?.trim(), address: m[2] };
}

export async function listInbox(a: Account, opts: ListInboxOptions = {}): Promise<MessageSummary[]> {
  const limit = Math.min(opts.limit ?? 25, 50);
  const list = await api<{ messages?: { id: string }[] }>(
    a,
    `/messages?labelIds=INBOX&maxResults=${limit}`,
  );
  const ids = list.messages ?? [];
  if (ids.length === 0) return [];

  const out: MessageSummary[] = [];
  for (const { id } of ids) {
    const m = await api<{
      id: string;
      threadId: string;
      labelIds?: string[];
      snippet?: string;
      internalDate?: string;
      payload?: { headers?: { name: string; value: string }[] };
    }>(a, `/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=Message-ID`);

    const hdrs = m.payload?.headers ?? [];
    const fromHdr = header(hdrs, "From");
    const subject = header(hdrs, "Subject");
    const messageId = header(hdrs, "Message-ID") || null;
    const isUnread = (m.labelIds ?? []).includes("UNREAD");

    out.push({
      id: m.id,
      accountId: a.id,
      threadId: m.threadId,
      messageId,
      from: parseAddr(fromHdr),
      to: header(hdrs, "To").split(",").map((s) => s.trim()).filter(Boolean).map(parseAddr),
      subject: subject || "(no subject)",
      snippet: m.snippet ?? "",
      date: m.internalDate ? new Date(parseInt(m.internalDate, 10)).toISOString() : new Date().toISOString(),
      flags: { unread: isUnread, flagged: (m.labelIds ?? []).includes("STARRED") },
      labels: m.labelIds ?? [],
    });
  }
  out.sort((x, y) => (x.date < y.date ? 1 : -1));
  return out;
}

export async function getMessageBody(a: Account, id: string): Promise<MessageBody> {
  const m = await api<{
    payload?: GmailPart;
  }>(a, `/messages/${id}?format=full`);

  const { html, text } = extractBody(m.payload);
  return { id, accountId: a.id, html, text, attachments: [] };
}

interface GmailPart {
  mimeType?: string;
  filename?: string;
  body?: { data?: string; size?: number };
  parts?: GmailPart[];
}

function b64urlDecode(s: string): string {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64").toString("utf-8");
}

function extractBody(part?: GmailPart): { html: string | null; text: string | null } {
  if (!part) return { html: null, text: null };
  let html: string | null = null;
  let text: string | null = null;
  function walk(p: GmailPart) {
    if (p.body?.data) {
      const content = b64urlDecode(p.body.data);
      if (p.mimeType === "text/html" && !html) html = content;
      else if (p.mimeType === "text/plain" && !text) text = content;
    }
    for (const c of p.parts ?? []) walk(c);
  }
  walk(part);
  return { html, text };
}

export async function markRead(a: Account, id: string): Promise<void> {
  await api(a, `/messages/${id}/modify`, {
    method: "POST",
    body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
  });
}

export async function archive(a: Account, id: string): Promise<void> {
  await api(a, `/messages/${id}/modify`, {
    method: "POST",
    body: JSON.stringify({ removeLabelIds: ["INBOX"] }),
  });
}

export async function trash(a: Account, id: string): Promise<void> {
  await api(a, `/messages/${id}/trash`, { method: "POST" });
}

export async function searchInbox(a: Account, query: string): Promise<string[]> {
  const list = await api<{ messages?: { id: string }[] }>(
    a,
    `/messages?q=${encodeURIComponent(query)}&maxResults=50`,
  );
  return (list.messages ?? []).map((m) => m.id);
}

/** Send via Gmail send API. RFC822 raw body, base64url-encoded. */
export async function sendMessage(
  a: Account,
  opts: { to: string; cc?: string; subject: string; body: string; inReplyTo?: string; references?: string },
): Promise<{ id: string }> {
  const headers: string[] = [
    `From: ${a.email}`,
    `To: ${opts.to}`,
    opts.cc ? `Cc: ${opts.cc}` : "",
    `Subject: ${opts.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    opts.inReplyTo ? `In-Reply-To: ${opts.inReplyTo}` : "",
    opts.references ? `References: ${opts.references}` : "",
  ].filter(Boolean);
  const raw = headers.join("\r\n") + "\r\n\r\n" + opts.body;
  const rawB64url = Buffer.from(raw).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const sent = await api<{ id: string }>(a, `/messages/send`, {
    method: "POST",
    body: JSON.stringify({ raw: rawB64url }),
  });
  return { id: sent.id };
}
