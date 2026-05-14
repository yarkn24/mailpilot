/**
 * Microsoft Graph provider — real implementation via Graph REST API.
 *
 * Auth: per-account refresh_token. Exchanged for access_token on every call.
 */
import { loadConfig, refreshAccessToken } from "@/lib/oauth/graph";
import type {
  Account,
  ConnectionStatus,
  ListInboxOptions,
  MessageBody,
  MessageSummary,
} from "../types";

const BASE = "https://graph.microsoft.com/v1.0/me";

async function accessToken(a: Account): Promise<string> {
  const cfg = loadConfig();
  if (!cfg) throw new Error("Graph OAuth not configured on this server");
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
  if (!res.ok) throw new Error(`graph api ${path}: ${res.status} ${await res.text()}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function testConnection(a: Account): Promise<ConnectionStatus> {
  try {
    await api<{ mail?: string }>(a, "");
    return {
      ok: true,
      capabilities: {
        serverSideThreading: true,
        serverSideSearch: true,
        labels: "categories",
        push: true,
      },
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "connect failed" };
  }
}

interface GraphMessage {
  id: string;
  conversationId: string;
  internetMessageId?: string;
  subject?: string;
  bodyPreview?: string;
  from?: { emailAddress?: { name?: string; address?: string } };
  toRecipients?: { emailAddress?: { name?: string; address?: string } }[];
  receivedDateTime?: string;
  isRead?: boolean;
  flag?: { flagStatus?: string };
  categories?: string[];
  body?: { contentType?: "html" | "text"; content?: string };
}

export async function listInbox(a: Account, opts: ListInboxOptions = {}): Promise<MessageSummary[]> {
  const limit = Math.min(opts.limit ?? 25, 50);
  const select = "id,conversationId,internetMessageId,subject,bodyPreview,from,toRecipients,receivedDateTime,isRead,flag,categories";
  const list = await api<{ value: GraphMessage[] }>(
    a,
    `/mailFolders/Inbox/messages?$top=${limit}&$select=${select}&$orderby=receivedDateTime DESC`,
  );
  return (list.value ?? []).map((m) => ({
    id: m.id,
    accountId: a.id,
    threadId: m.conversationId,
    messageId: m.internetMessageId ?? null,
    from: {
      name: m.from?.emailAddress?.name,
      address: m.from?.emailAddress?.address ?? "",
    },
    to: (m.toRecipients ?? []).map((t) => ({
      name: t.emailAddress?.name,
      address: t.emailAddress?.address ?? "",
    })),
    subject: m.subject ?? "(no subject)",
    snippet: m.bodyPreview ?? "",
    date: m.receivedDateTime ?? new Date().toISOString(),
    flags: {
      unread: !(m.isRead ?? false),
      flagged: m.flag?.flagStatus === "flagged",
    },
    labels: m.categories ?? [],
  }));
}

export async function getMessageBody(a: Account, id: string): Promise<MessageBody> {
  const m = await api<GraphMessage>(a, `/messages/${id}?$select=body`);
  const html = m.body?.contentType === "html" ? m.body?.content ?? null : null;
  const text = m.body?.contentType === "text" ? m.body?.content ?? null : null;
  return { id, accountId: a.id, html, text, attachments: [] };
}

export async function markRead(a: Account, id: string): Promise<void> {
  await api(a, `/messages/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ isRead: true }),
  });
}

export async function archive(a: Account, id: string): Promise<void> {
  // Graph "Archive" = well-known folder.
  await api(a, `/messages/${id}/move`, {
    method: "POST",
    body: JSON.stringify({ destinationId: "archive" }),
  });
}

export async function trash(a: Account, id: string): Promise<void> {
  await api(a, `/messages/${id}/move`, {
    method: "POST",
    body: JSON.stringify({ destinationId: "deleteditems" }),
  });
}

export async function searchInbox(a: Account, query: string): Promise<string[]> {
  const list = await api<{ value: { id: string }[] }>(
    a,
    `/messages?$search=${encodeURIComponent(`"${query}"`)}&$top=50`,
  );
  return (list.value ?? []).map((m) => m.id);
}

export async function sendMessage(
  a: Account,
  opts: { to: string; cc?: string; subject: string; body: string; inReplyTo?: string },
): Promise<{ id: string }> {
  const toRecipients = opts.to.split(",").map((s) => ({ emailAddress: { address: s.trim() } }));
  const ccRecipients = opts.cc
    ? opts.cc.split(",").map((s) => ({ emailAddress: { address: s.trim() } }))
    : undefined;
  await api(a, `/sendMail`, {
    method: "POST",
    body: JSON.stringify({
      message: {
        subject: opts.subject,
        body: { contentType: "Text", content: opts.body },
        toRecipients,
        ...(ccRecipients ? { ccRecipients } : {}),
        ...(opts.inReplyTo ? { internetMessageHeaders: [{ name: "In-Reply-To", value: opts.inReplyTo }] } : {}),
      },
    }),
  });
  return { id: "" };
}
