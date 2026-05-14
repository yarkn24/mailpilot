/**
 * Unified-inbox deduplication.
 *
 * Primary key: RFC 5322 Message-ID. Bulk-mailer scenarios where Message-ID is
 * null fall back to a (date-bucket, from, subject_hash) tuple. The fallback is
 * intentionally lossy in favor of safety — we'd rather show a near-duplicate
 * than collapse two distinct messages.
 */

export type Provider = "gmail" | "graph" | "imap";

export interface RawMessage {
  providerId: string;
  provider: Provider;
  messageId: string | null;
  date: Date;
  from: string;
  subject: string;
}

const SUBJECT_HASH = (s: string): string =>
  s
    .trim()
    .toLowerCase()
    .replace(/^(re|fwd|fw):\s*/i, "")
    .slice(0, 80);

const DATE_BUCKET = (d: Date): string =>
  // 1-second resolution. Two messages with identical (from, subject) within
  // the same second are treated as duplicates; differing seconds = distinct.
  Math.floor(d.getTime() / 1000).toString();

function fallbackKey(m: RawMessage): string {
  return `fb:${m.from.toLowerCase()}|${SUBJECT_HASH(m.subject)}|${DATE_BUCKET(m.date)}`;
}

function canonicalKey(m: RawMessage): string {
  if (m.messageId) return `mid:${m.messageId.toLowerCase()}`;
  return fallbackKey(m);
}

export function dedupeMessages(messages: RawMessage[]): RawMessage[] {
  const byKey = new Map<string, RawMessage>();
  for (const m of messages) {
    const k = canonicalKey(m);
    const prior = byKey.get(k);
    // Keep the earliest sighting per key to stabilize ordering across re-runs.
    if (!prior || m.date < prior.date) byKey.set(k, m);
  }
  return Array.from(byKey.values());
}
