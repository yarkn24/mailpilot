import { NextResponse } from "next/server";
import { redactForAI } from "@/lib/email/redact";
import { getClient, MODELS, draftPrompt } from "@/lib/ai/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_INPUT_CHARS = 24_000;

interface DraftBody {
  thread: string;
  tone?: "neutral" | "warm" | "brief";
  consent: boolean;
}

/**
 * POST /api/draft
 *
 * Generates a reply draft via Claude Sonnet (quality > cost for tone).
 * Same gates as /api/summarize: consent, budget, redaction.
 */
export async function POST(req: Request) {
  let body: DraftBody;
  try {
    body = (await req.json()) as DraftBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (body.consent !== true) {
    return NextResponse.json({ error: "AI consent required" }, { status: 403 });
  }
  if (typeof body.thread !== "string" || body.thread.length === 0) {
    return NextResponse.json({ error: "thread required" }, { status: 400 });
  }
  if (body.thread.length > MAX_INPUT_CHARS * 4) {
    return NextResponse.json({ error: "thread too large" }, { status: 413 });
  }
  const tone = body.tone ?? "neutral";

  const safe = redactForAI(body.thread.slice(0, MAX_INPUT_CHARS));
  const client = getClient();
  if (!client) {
    return NextResponse.json({
      model: "claude-sonnet-stub",
      draft: `(Stub) Reply draft would land here.\n\nSet ANTHROPIC_API_KEY in Vercel to enable live drafts. Tone: ${tone}.`,
    });
  }

  try {
    const res = await client.messages.create({
      model: MODELS.SONNET,
      max_tokens: 800,
      system: [draftPrompt(tone).content[0]],
      messages: [{ role: "user", content: `<email>${safe}</email>` }],
    });
    const text = res.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("\n");
    return NextResponse.json({
      model: res.model,
      draft: text,
      input_tokens: res.usage.input_tokens,
      output_tokens: res.usage.output_tokens,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "model call failed" },
      { status: 502 },
    );
  }
}
