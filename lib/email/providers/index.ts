/**
 * Provider dispatch — the only place that switches on `provider`.
 * UI and business logic stay shape-agnostic.
 */
import type { Account } from "../types";
import * as imap from "./imap";
import * as gmail from "./gmail";
import * as graph from "./graph";
import * as demo from "./demo";

function pick(a: Account) {
  switch (a.provider) {
    case "imap":  return imap;
    case "gmail": return gmail;
    case "graph": return graph;
    case "demo":  return demo;
  }
}

type SendOpts = { to: string; cc?: string; subject: string; body: string; inReplyTo?: string; references?: string };

export const provider = {
  testConnection: (a: Account) => pick(a).testConnection(a),
  listInbox:      (a: Account, opts?: Parameters<typeof imap.listInbox>[1]) => pick(a).listInbox(a, opts),
  getMessageBody: (a: Account, id: string) => pick(a).getMessageBody(a, id),
  markRead:       (a: Account, id: string) => pick(a).markRead(a, id),
  archive:        (a: Account, id: string) => pick(a).archive(a, id),
  trash:          (a: Account, id: string) => pick(a).trash(a, id),
  searchInbox:    (a: Account, q: string)  => pick(a).searchInbox(a, q),
  /** Provider-native send for Gmail/Graph; IMAP send routes through SMTP in /api/compose. */
  sendMessage:    (a: Account, opts: SendOpts) => {
    const p = pick(a);
    if ("sendMessage" in p && typeof p.sendMessage === "function") {
      return p.sendMessage(a, opts);
    }
    throw new Error(`sendMessage not supported on provider ${a.provider}`);
  },
};

export { presetForDomain } from "./imap";
