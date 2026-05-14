import { NextRequest, NextResponse } from "next/server";
import { ensureSessionId, getAccount } from "@/lib/email/store";
import { provider } from "@/lib/email/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ accountId: string; id: string }> }) {
  const sid = ensureSessionId(req.headers.get("cookie"));
  const { accountId, id } = await ctx.params;
  const account = await getAccount(sid, accountId);
  if (!account) return NextResponse.json({ error: "account not found" }, { status: 404 });

  try {
    const body = await provider.getMessageBody(account, id);
    // Side effect: mark read on successful fetch.
    void provider.markRead(account, id).catch(() => {});
    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "fetch failed" },
      { status: 500 },
    );
  }
}
