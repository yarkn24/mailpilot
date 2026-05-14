/**
 * IMAP provider implementation.
 *
 * Uses `imapflow` for IMAP4rev1 + IDLE-capable connections.
 * Vercel serverless = no long-lived IDLE here; we connect-do-disconnect per
 * request. IDLE-based push lands in a separate background worker tier.
 *
 * The auth model is plain user + app password (Yahoo, AOL, Fastmail, custom).
 * No OAuth on this adapter — that's Gmail/Graph territory.
 */
import { ImapFlow, type ImapFlowOptions } from "imapflow";
import type {
  Account,
  ConnectionStatus,
  ListInboxOptions,
  MessageBody,
  MessageSummary,
} from "../types";

const PROVIDER_PRESETS: Record<string, { host: string; port: number; smtpHost: string; smtpPort: number }> = {
  "yahoo.com":     { host: "imap.mail.yahoo.com",  port: 993, smtpHost: "smtp.mail.yahoo.com",  smtpPort: 465 },
  "aol.com":       { host: "imap.aol.com",         port: 993, smtpHost: "smtp.aol.com",         smtpPort: 465 },
  "fastmail.com":  { host: "imap.fastmail.com",    port: 993, smtpHost: "smtp.fastmail.com",    smtpPort: 465 },
  "icloud.com":    { host: "imap.mail.me.com",     port: 993, smtpHost: "smtp.mail.me.com",     smtpPort: 587 },
};

export function presetForDomain(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return undefined;
  return PROVIDER_PRESETS[domain];
}

function makeClient(a: Account): ImapFlow {
  if (!a.imapHost || !a.imapPort || !a.imapUser || !a.imapPassword) {
    throw new Error("IMAP credentials missing on account");
  }
  const opts: ImapFlowOptions = {
    host: a.imapHost,
    port: a.imapPort,
    secure: a.imapPort === 993,
    auth: { user: a.imapUser, pass: a.imapPassword },
    logger: false,
  };
  return new ImapFlow(opts);
}

export async function testConnection(a: Account): Promise<ConnectionStatus> {
  const client = makeClient(a);
  try {
    await client.connect();
    await client.logout();
    return {
      ok: true,
      capabilities: {
        serverSideThreading: false,
        serverSideSearch: true,
        labels: "folders",
        push: false,
      },
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "connect failed" };
  }
}

function snippetFrom(text: string | undefined, html: string | undefined): string {
  const raw = text || (html ? html.replace(/<[^>]*>/g, " ") : "");
  return raw.replace(/\s+/g, " ").trim().slice(0, 140);
}

export async function listInbox(
  a: Account,
  opts: ListInboxOptions = {},
): Promise<MessageSummary[]> {
  const limit = Math.min(opts.limit ?? 25, 100);
  const client = makeClient(a);
  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const status = await client.status("INBOX", { messages: true });
      const total = status.messages ?? 0;
      if (total === 0) return [];
      const start = Math.max(1, total - limit + 1);
      const range = `${start}:${total}`;

      const out: MessageSummary[] = [];
      for await (const msg of client.fetch(range, {
        envelope: true,
        flags: true,
        bodyStructure: false,
        source: false,
      })) {
        const env = msg.envelope;
        if (!env) continue;
        const fromAddr = env.from?.[0];
        out.push({
          id: String(msg.uid),
          accountId: a.id,
          threadId: env.inReplyTo ?? String(msg.uid),
          messageId: env.messageId ?? null,
          from: {
            name: fromAddr?.name,
            address: fromAddr?.address ?? "",
          },
          to: (env.to ?? []).map((t) => ({
            name: t.name,
            address: t.address ?? "",
          })),
          subject: env.subject ?? "(no subject)",
          snippet: "",
          date: env.date ? new Date(env.date).toISOString() : new Date().toISOString(),
          flags: {
            unread: !msg.flags?.has("\\Seen"),
            flagged: msg.flags?.has("\\Flagged") ?? false,
          },
          labels: ["INBOX"],
        });
      }
      // newest first
      return out.sort((x, y) => (x.date < y.date ? 1 : -1));
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

export async function getMessageBody(a: Account, uid: string): Promise<MessageBody> {
  const client = makeClient(a);
  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const msg = await client.fetchOne(uid, {
        source: true,
        bodyStructure: true,
      }, { uid: true });
      if (!msg || !msg.source) {
        return { id: uid, accountId: a.id, html: null, text: null, attachments: [] };
      }
      // imapflow returns Buffer for source; we want a quick text/html split.
      // For a real implementation we'd use mailparser; here we make a best
      // effort with the raw RFC822 source by splitting on boundaries.
      const raw = msg.source.toString("utf-8");
      const [, body = ""] = raw.split(/\r?\n\r?\n/);
      const isHtml = /<html|<body|<div/i.test(body);
      // Best-effort: do not render every MIME edge case in v0.1.
      return {
        id: uid,
        accountId: a.id,
        html: isHtml ? body : null,
        text: !isHtml ? body : null,
        attachments: [],
      };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

export async function markRead(a: Account, uid: string): Promise<void> {
  const client = makeClient(a);
  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

export async function archive(a: Account, uid: string): Promise<void> {
  const client = makeClient(a);
  await client.connect();
  try {
    // IMAP "archive" = move to an Archive folder (or All Mail on Gmail).
    // Yahoo/AOL: "Archive" folder. Fastmail: "Archive". Fallback: do nothing visible.
    const lock = await client.getMailboxLock("INBOX");
    try {
      try {
        await client.messageMove(uid, "Archive", { uid: true });
      } catch {
        // Some servers use different names; try common variants.
        for (const candidate of ["[Archive]", "All Mail", "INBOX/Archive"]) {
          try {
            await client.messageMove(uid, candidate, { uid: true });
            return;
          } catch { /* try next */ }
        }
        throw new Error("no Archive folder on this server");
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

export async function trash(a: Account, uid: string): Promise<void> {
  const client = makeClient(a);
  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      try {
        await client.messageMove(uid, "Trash", { uid: true });
      } catch {
        for (const candidate of ["[Trash]", "Deleted Messages", "Bin"]) {
          try {
            await client.messageMove(uid, candidate, { uid: true });
            return;
          } catch { /* try next */ }
        }
        // Fallback: mark deleted in-place + expunge.
        await client.messageFlagsAdd(uid, ["\\Deleted"], { uid: true });
        await client.messageDelete(uid, { uid: true });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

export async function searchInbox(a: Account, query: string): Promise<string[]> {
  const client = makeClient(a);
  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const uids = await client.search({ body: query }, { uid: true });
      if (!uids) return [];
      return uids.map(String);
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}
