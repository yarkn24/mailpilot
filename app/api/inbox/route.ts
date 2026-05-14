import { NextRequest, NextResponse } from "next/server";
import { ensureSessionId, listAccounts } from "@/lib/email/store";
import { provider } from "@/lib/email/providers";
import { dedupeMessages, type RawMessage } from "@/lib/email/dedupe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/inbox
 *
 * Fans out to every connected account, fetches the latest N messages per
 * account, then dedupes the merged stream by canonical Message-ID. Errors
 * from any one provider degrade gracefully — that account's section reports
 * `error: "..."` while the rest still return.
 */
export async function GET(req: NextRequest) {
  const sid = ensureSessionId(req.headers.get("cookie"));
  const accounts = listAccounts(sid);
  if (accounts.length === 0) {
    return NextResponse.json({ messages: [], accounts: [] });
  }

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "25", 10) || 25, 50);

  const settled = await Promise.allSettled(
    accounts.map(async (a) => ({
      accountId: a.id,
      messages: await provider.listInbox(a, { limit }),
    })),
  );

  const messages = [];
  const accountStatus = [];
  for (let i = 0; i < settled.length; i++) {
    const a = accounts[i];
    const result = settled[i];
    if (result.status === "fulfilled") {
      accountStatus.push({ id: a.id, email: a.email, ok: true });
      messages.push(...result.value.messages);
    } else {
      accountStatus.push({
        id: a.id,
        email: a.email,
        ok: false,
        error: result.reason instanceof Error ? result.reason.message : "fetch failed",
      });
    }
  }

  // Dedup by canonical Message-ID; sort newest first.
  const raw: RawMessage[] = messages.map((m) => ({
    providerId: `${m.accountId}:${m.id}`,
    provider: "imap" as const,
    messageId: m.messageId,
    date: new Date(m.date),
    from: m.from.address,
    subject: m.subject,
  }));
  const keptIds = new Set(dedupeMessages(raw).map((r) => r.providerId));
  const unique = messages.filter((m) => keptIds.has(`${m.accountId}:${m.id}`));
  unique.sort((x, y) => (x.date < y.date ? 1 : -1));

  return NextResponse.json({ messages: unique, accounts: accountStatus });
}
