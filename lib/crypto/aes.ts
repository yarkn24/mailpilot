/**
 * AES-256-GCM at-rest encryption for sensitive account fields.
 *
 * Encrypted at rest: IMAP app passwords, OAuth refresh tokens.
 * Never encrypted: provider, email, display name, IMAP host/port, addedAt.
 *
 * Key: `MAILPILOT_ENCRYPTION_KEY` env, base64-encoded 32 bytes. If absent,
 * encryption is OFF (dev mode) — store layer rejects writes in that case
 * when the SUPABASE backend is active. Fail loud, never silent (CLAUDE.md R8).
 */
import crypto from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function loadKey(): Buffer | null {
  const raw = process.env.MAILPILOT_ENCRYPTION_KEY;
  if (!raw) return null;
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) {
    throw new Error(`MAILPILOT_ENCRYPTION_KEY must be 32 bytes base64; got ${buf.length}`);
  }
  return buf;
}

/** Returns base64 `iv|ciphertext|tag`. */
export function encrypt(plaintext: string): string {
  const key = loadKey();
  if (!key) throw new Error("MAILPILOT_ENCRYPTION_KEY not set — refusing to write plaintext secret");
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ct, tag]).toString("base64");
}

export function decrypt(token: string): string {
  const key = loadKey();
  if (!key) throw new Error("MAILPILOT_ENCRYPTION_KEY not set — cannot decrypt stored secret");
  const buf = Buffer.from(token, "base64");
  if (buf.length < IV_LEN + TAG_LEN + 1) throw new Error("invalid ciphertext");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(buf.length - TAG_LEN);
  const ct = buf.subarray(IV_LEN, buf.length - TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

export function encryptionAvailable(): boolean {
  try {
    return !!loadKey();
  } catch {
    return false;
  }
}

/** One-shot: generate a key for the operator to copy into Vercel env. */
export function generateKey(): string {
  return crypto.randomBytes(32).toString("base64");
}
