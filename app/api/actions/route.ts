import { NextRequest, NextResponse } from "next/server";
import { ensureSessionId, getAccount } from "@/lib/email/store";
import { provider } from "@/lib/email/providers";

export const runtime = "nodejs";

type Action = "archive" | "trash" | "markRead";

export async function POST(req: NextRequest) {
  const sid = ensureSessionId(req.headers.get("cookie"));
  const body = await req.json().catch(() => null) as
    | { accountId: string; messageId: string; action: Action }
    | null;
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const account = getAccount(sid, body.accountId);
  if (!account) return NextResponse.json({ error: "account not found" }, { status: 404 });

  try {
    switch (body.action) {
      case "archive":  await provider.archive(account, body.messageId);  break;
      case "trash":    await provider.trash(account, body.messageId);    break;
      case "markRead": await provider.markRead(account, body.messageId); break;
      default: return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "action failed" },
      { status: 500 },
    );
  }
}
