import { NextResponse } from "next/server";
import { redactForAI } from "@/lib/email/redact";
import { getClient, MODELS } from "@/lib/ai/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 20;

interface MessageInput {
  id: string;
  from: string;
  subject: string;
  snippet: string;
}

interface PrioritizeBody {
  messages: MessageInput[];
  consent: boolean;
}

/**
 * POST /api/prioritize
 *
 * Classifies a batch of message previews into priority bands. Uses Haiku
 * (cheap, batchable). Returns { id, band } pairs.
 */
export async function POST(req: Request) {
  let body: PrioritizeBody;
  try {
    body = (await req.json()) as PrioritizeBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (body.consent !== true) {
    return NextResponse.json({ error: "AI consent required" }, { status: 403 });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "messages array required" }, { status: 400 });
  }
  if (body.messages.length > MAX_MESSAGES) {
    return NextResponse.json(
      { error: `batch size > ${MAX_MESSAGES}; chunk smaller` },
      { status: 413 },
    );
  }

  const lines = body.messages
    .map((m, i) => {
      const safeFrom = redactForAI(m.from);
      const safeSubj = redactForAI(m.subject);
      const safeSnip = redactForAI(m.snippet.slice(0, 200));
      return `${i + 1}. from=${safeFrom} subject="${safeSubj}" preview="${safeSnip}"`;
    })
    .join("\n");

  const client = getClient();
  if (!client) {
    const stub = body.messages.map((m, i) => ({
      id: m.id,
      band: i % 3 === 0 ? "high" : i % 3 === 1 ? "normal" : "low",
    }));
    return NextResponse.json({ model: "claude-haiku-stub", priorities: stub });
  }

  try {
    const res = await client.messages.create({
      model: MODELS.HAIKU,
      max_tokens: 200,
      system: [
        {
          type: "text",
          text: `Classify each message into one of: "high", "normal", "low".
Output ONLY a JSON array of {n, band} matching the numbered input.
No commentary, no markdown. Pure JSON.

"high": clearly time-sensitive, personal, action-required for the user.
"low": automated, marketing, system notifications, receipts.
"normal": everything else.`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: `<email>\n${lines}\n</email>` }],
    });
    const raw = res.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("\n")
      .trim();
    let parsed: { n: number; band: string }[] = [];
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "model returned non-JSON", raw },
        { status: 502 },
      );
    }
    const priorities = parsed.map((p) => ({
      id: body.messages[p.n - 1]?.id ?? "",
      band: p.band,
    }));
    return NextResponse.json({
      model: res.model,
      priorities,
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
