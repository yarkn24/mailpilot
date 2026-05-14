import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { ensureSessionId, getAccount } from "@/lib/email/store";
import { provider } from "@/lib/email/providers";

export const runtime = "nodejs";

interface ComposeBody {
  accountId: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
}

export async function POST(req: NextRequest) {
  const sid = ensureSessionId(req.headers.get("cookie"));
  const body = await req.json().catch(() => null) as ComposeBody | null;
  if (!body || !body.accountId || !body.to || !body.subject || !body.body) {
    return NextResponse.json({ error: "accountId, to, subject, body required" }, { status: 400 });
  }

  const account = await getAccount(sid, body.accountId);
  if (!account) {
    return NextResponse.json({ error: "account not found" }, { status: 404 });
  }

  const headerFields = [body.to, body.cc ?? "", body.bcc ?? "", body.subject];
  if (headerFields.some((f) => /[\r\n]/.test(f))) {
    return NextResponse.json({ error: "control characters not allowed in headers" }, { status: 400 });
  }

  try {
    if (account.provider === "gmail" || account.provider === "graph") {
      const sent = await provider.sendMessage(account, {
        to: body.to,
        cc: body.cc,
        subject: body.subject,
        body: body.body,
        inReplyTo: body.inReplyTo,
        references: body.references,
      });
      return NextResponse.json({ ok: true, messageId: sent.id || null });
    }

    if (!account.smtpHost || !account.smtpPort || !account.imapUser || !account.imapPassword) {
      return NextResponse.json({ error: "Account missing SMTP credentials" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.smtpPort === 465,
      auth: { user: account.imapUser, pass: account.imapPassword },
    });

    const info = await transporter.sendMail({
      from: { name: account.displayName ?? account.email, address: account.email },
      to: body.to,
      cc: body.cc,
      bcc: body.bcc,
      subject: body.subject,
      text: body.body,
      inReplyTo: body.inReplyTo,
      references: body.references,
    });
    return NextResponse.json({ ok: true, messageId: info.messageId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "send failed" },
      { status: 500 },
    );
  }
}
