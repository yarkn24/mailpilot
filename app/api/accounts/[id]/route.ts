import { NextRequest, NextResponse } from "next/server";
import { ensureSessionId, removeAccount } from "@/lib/email/store";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const sid = ensureSessionId(req.headers.get("cookie"));
  const { id } = await ctx.params;
  const removed = removeAccount(sid, id);
  if (!removed) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
