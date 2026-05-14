import { NextResponse } from "next/server";
import { redactForAI } from "@/lib/email/redact";
import { getAIProvider } from "@/lib/ai/provider";

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

const SYSTEM = `Classify each numbered message into one of: "high", "normal", "low".
Output ONLY a JSON array of {n, band} matching the numbered input.
No commentary, no markdown. Pure JSON.

"high": clearly time-sensitive, personal, action-required for the user.
"low": automated, marketing, system notifications, receipts.
"normal": everything else.`;

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

  const ai = getAIProvider("fast");
  if (!ai) {
    const stub = body.messages.map((m, i) => ({
      id: m.id,
      band: i % 3 === 0 ? "high" : i % 3 === 1 ? "normal" : "low",
    }));
    return NextResponse.json({ model: "stub", vendor: "none", priorities: stub });
  }

  try {
    const res = await ai.generate({
      system: SYSTEM,
      user: `<email>\n${lines}\n</email>`,
      maxOutputTokens: 400,
      responseMimeType: "application/json",
    });
    const raw = res.text.trim();
    let parsed: { n: number; band: string }[] = [];
    try {
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
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
      vendor: res.vendor,
      priorities,
      input_tokens: res.inputTokens,
      output_tokens: res.outputTokens,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/429|quota|rate.?limit|resource.?exhausted/i.test(msg)) {
      const stub = body.messages.map((m, i) => ({
        id: m.id,
        band: i % 3 === 0 ? "high" : i % 3 === 1 ? "normal" : "low",
      }));
      return NextResponse.json({ model: "stub", vendor: "none", priorities: stub });
    }
    return NextResponse.json(
      { error: msg },
      { status: 502 },
    );
  }
}
