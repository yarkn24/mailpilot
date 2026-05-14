/**
 * Redaction layer applied to any text before it crosses the LLM boundary.
 *
 * Enforces CLAUDE.md R1: email addresses and phone numbers never reach an AI
 * provider. The model still has enough structure to summarize / draft replies,
 * just without identifiers.
 */

// Regex literals are constructed per-call. Module-level `/g` regexes share
// `lastIndex` across concurrent calls in the Node runtime — a known JS gotcha
// that, in a server context, can cause one request to skip matches because a
// prior request left `lastIndex` mid-string. Fresh objects = no shared state.
const EMAIL = (): RegExp =>
  /(?:mailto:)?[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE = (): RegExp =>
  /(\+?\d{1,3}[\s-]?)?(\(\d{3}\)|\d{3})[\s-]?\d{3}[\s-]?\d{4}/g;
const IPV4 = (): RegExp =>
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

export function redactForAI(text: string): string {
  if (!text) return text;
  return text
    .replace(EMAIL(), "<email>")
    .replace(PHONE(), "<phone>")
    .replace(IPV4(), "<ip>");
}
