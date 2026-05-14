import { NextResponse } from "next/server";
import { redactForAI } from "@/lib/email/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_INPUT_CHARS = 16_000; // ~4k tokens at 4 chars/token avg

type SummarizeBody = {
  thread: string;
  consent: boolean;
};

/**
 * POST /api/summarize
 *
 * Demo endpoint for the AI-summary feature. Real implementation will route to
 * Claude Haiku via Vercel AI SDK; this stub enforces the contract so the UI
 * can be wired up first:
 *
 *   - Consent gate (CLAUDE.md R3 — AI opt-in per account)
 *   - Input truncation to honor token budget (R4)
 *   - Redaction layer before any "external" call (R1)
 *
 * Returns a deterministic stub summary so the path is testable without an
 * API key.
 */
export async function POST(req: Request) {
  let body: SummarizeBody;
  try {
    body = (await req.json()) as SummarizeBody;
  } catch {
    return NextResponse.json(
      { error: "invalid JSON body" },
      { status: 400 },
    );
  }

  // Strict boolean — truthy strings like "true" or "yes" don't qualify as
  // explicit consent (CLAUDE.md R3).
  if (body.consent !== true) {
    return NextResponse.json(
      { error: "AI consent required for this mailbox" },
      { status: 403 },
    );
  }

  if (typeof body.thread !== "string" || body.thread.length === 0) {
    return NextResponse.json(
      { error: "thread (string) is required" },
      { status: 400 },
    );
  }

  // Body-size guard: reject oversize input outright instead of silently
  // truncating multi-MB payloads (cost + DoS shape).
  if (body.thread.length > MAX_INPUT_CHARS * 4) {
    return NextResponse.json(
      { error: "thread too large; chunk before submitting" },
      { status: 413 },
    );
  }

  const truncated = body.thread.slice(0, MAX_INPUT_CHARS);
  // Redaction happens inside the route but the redacted text never leaves
  // this function back to the client. Only AI gets the redacted body.
  void redactForAI(truncated);

  // Real path: const summary = await anthropic.messages.create({...})
  // Stub path: return shape that mirrors the real response, minus any
  // post-redaction content (which could leak if redaction had gaps).
  return NextResponse.json({
    model: "claude-haiku-stub",
    summary:
      "This is a stub summary. Wire ANTHROPIC_API_KEY and replace this branch with a Vercel AI SDK call to claude-haiku-4-5.",
    input_chars: truncated.length,
    truncated: body.thread.length > MAX_INPUT_CHARS,
  });
}
