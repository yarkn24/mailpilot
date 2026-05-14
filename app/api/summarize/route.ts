import { NextResponse } from "next/server";
import { redactForAI } from "@/lib/email/redact";
import { getClient, MODELS, summaryPrompt } from "@/lib/ai/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_INPUT_CHARS = 16_000;

interface SummarizeBody {
  thread: string;
  consent: boolean;
}

/**
 * POST /api/summarize
 *
 * Real path: Claude Haiku 4.5 via Anthropic SDK when ANTHROPIC_API_KEY is set.
 * Stub path: returns a deterministic structure so UI dev can proceed without
 * a key.
 *
 * Always enforces: consent gate (R3), token budget (R4), redaction (R1).
 */
export async function POST(req: Request) {
  let body: SummarizeBody;
  try {
    body = (await req.json()) as SummarizeBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (body.consent !== true) {
    return NextResponse.json(
      { error: "AI consent required for this mailbox" },
      { status: 403 },
    );
  }
  if (typeof body.thread !== "string" || body.thread.length === 0) {
    return NextResponse.json({ error: "thread (string) is required" }, { status: 400 });
  }
  if (body.thread.length > MAX_INPUT_CHARS * 4) {
    return NextResponse.json(
      { error: "thread too large; chunk before submitting" },
      { status: 413 },
    );
  }

  const truncated = body.thread.slice(0, MAX_INPUT_CHARS);
  const safe = redactForAI(truncated);

  const client = getClient();
  if (!client) {
    return NextResponse.json({
      model: "claude-haiku-stub",
      summary:
        "ANTHROPIC_API_KEY not configured. Set it in Vercel env to enable live summaries.",
      input_chars: truncated.length,
      truncated: body.thread.length > MAX_INPUT_CHARS,
    });
  }

  try {
    const res = await client.messages.create({
      model: MODELS.HAIKU,
      max_tokens: 300,
      system: [summaryPrompt().content[0]],
      messages: [
        {
          role: "user",
          content: `<email>${safe}</email>`,
        },
      ],
    });
    const text = res.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("\n");
    return NextResponse.json({
      model: res.model,
      summary: text,
      input_tokens: res.usage.input_tokens,
      output_tokens: res.usage.output_tokens,
      cache_read_tokens: res.usage.cache_read_input_tokens ?? 0,
      truncated: body.thread.length > MAX_INPUT_CHARS,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "model call failed" },
      { status: 502 },
    );
  }
}
