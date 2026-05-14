import { NextRequest, NextResponse } from "next/server";
import { addAccount, ensureSessionId, listAccounts, sanitizeAccount } from "@/lib/email/store";
import { provider, presetForDomain } from "@/lib/email/providers";
import type { Account } from "@/lib/email/types";

export const runtime = "nodejs";

function withSession(res: NextResponse, sid: string) {
  res.cookies.set("mailpilot_sid", sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function GET(req: NextRequest) {
  const sid = ensureSessionId(req.headers.get("cookie"));
  const accounts = (await listAccounts(sid)).map(sanitizeAccount);
  return withSession(NextResponse.json({ accounts }), sid);
}

export async function POST(req: NextRequest) {
  const sid = ensureSessionId(req.headers.get("cookie"));
  const body = await req.json().catch(() => null) as
    | { provider: "imap"; email: string; password: string; imapHost?: string; imapPort?: number; smtpHost?: string; smtpPort?: number; displayName?: string }
    | null;
  if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }
  if (body.provider !== "imap") {
    return NextResponse.json(
      { error: "Only IMAP is supported in this preview. Gmail/Graph OAuth lands in a follow-up." },
      { status: 400 },
    );
  }

  const preset = presetForDomain(body.email);
  const account: Omit<Account, "id" | "addedAt"> = {
    provider: "imap",
    email: body.email,
    displayName: body.displayName ?? body.email,
    imapHost: body.imapHost ?? preset?.host,
    imapPort: body.imapPort ?? preset?.port ?? 993,
    imapUser: body.email,
    imapPassword: body.password,
    smtpHost: body.smtpHost ?? preset?.smtpHost,
    smtpPort: body.smtpPort ?? preset?.smtpPort ?? 465,
  };

  if (!account.imapHost) {
    return NextResponse.json(
      { error: "No IMAP preset for this domain — pass imapHost and imapPort explicitly." },
      { status: 400 },
    );
  }

  // Live test the connection before saving (fail loud, R8).
  const tmp: Account = { ...account, id: "tmp", addedAt: new Date().toISOString() };
  const status = await provider.testConnection(tmp);
  if (!status.ok) {
    return NextResponse.json(
      { error: `IMAP test failed: ${status.message ?? "unknown"}` },
      { status: 400 },
    );
  }

  const created = await addAccount(sid, account);
  return withSession(
    NextResponse.json({ account: sanitizeAccount(created) }, { status: 201 }),
    sid,
  );
}
