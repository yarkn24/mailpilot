/**
 * OAuth state + PKCE verifier scratchpad.
 *
 * Issued state lives ≤5 min, single-use, bound to session cookie.
 * In production this lives in Redis / KV. For this demo: in-memory map.
 */
import crypto from "node:crypto";

interface Issued {
  sessionId: string;
  verifier: string;
  provider: "gmail" | "graph";
  expiresAt: number;
}

const STORE = new Map<string, Issued>();

function gc() {
  const now = Date.now();
  for (const [k, v] of STORE) {
    if (v.expiresAt < now) STORE.delete(k);
  }
}

export function issue(sessionId: string, provider: "gmail" | "graph", verifier: string): string {
  gc();
  const state = crypto.randomBytes(24).toString("base64url");
  STORE.set(state, { sessionId, verifier, provider, expiresAt: Date.now() + 5 * 60 * 1000 });
  return state;
}

export function consume(state: string, sessionId: string, provider: "gmail" | "graph"): Issued | null {
  gc();
  const v = STORE.get(state);
  if (!v) return null;
  STORE.delete(state); // single-use
  if (v.sessionId !== sessionId) return null;
  if (v.provider !== provider) return null;
  if (v.expiresAt < Date.now()) return null;
  return v;
}
