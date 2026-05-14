import { NextRequest, NextResponse } from "next/server";
import { ensureSessionId, listAccounts } from "@/lib/email/store";
import { provider } from "@/lib/email/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sid = ensureSessionId(req.headers.get("cookie"));
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ error: "query must be at least 2 chars" }, { status: 400 });
  }
  const accounts = listAccounts(sid);
  if (accounts.length === 0) return NextResponse.json({ results: [] });

  const settled = await Promise.allSettled(
    accounts.map(async (a) => ({
      accountId: a.id,
      email: a.email,
      uids: await provider.searchInbox(a, q),
    })),
  );

  const results = settled.flatMap((r) =>
    r.status === "fulfilled" ? [r.value] : [],
  );
  const errors = settled.flatMap((r) =>
    r.status === "rejected"
      ? [{ error: r.reason instanceof Error ? r.reason.message : "search failed" }]
      : [],
  );

  return NextResponse.json({ results, errors });
}
