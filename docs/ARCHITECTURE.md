# Mailpilot — Architecture (one page)

## Layered view

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Client (PWA)                                             │
│    Next.js 16 App Router · React 19 · Tailwind v4           │
│    Service Worker + Web App Manifest + IDB cache            │
│    Optimistic UI · Keyboard-first · Mobile-first responsive │
└──────────────────────────┬──────────────────────────────────┘
                           │ Server Components / Server Actions
┌──────────────────────────▼──────────────────────────────────┐
│ 2. Edge & Function layer (Vercel)                           │
│    Clerk session → user identity                            │
│    Per-account OAuth tokens (encrypted in DB)               │
│    Rate-limited, observable, error-budgeted                 │
└────┬─────────────────┬─────────────────┬───────────────┬────┘
     │                 │                 │               │
┌────▼────┐   ┌────────▼────────┐   ┌────▼────┐   ┌──────▼──────┐
│ Gmail   │   │ Microsoft       │   │ IMAP    │   │ Claude AI   │
│ API     │   │ Graph (M365)    │   │ (ImapFlow) │ │ (Vercel AI) │
│ Adapter │   │ Adapter         │   │ Adapter │   │ SDK         │
└─────────┘   └─────────────────┘   └─────────┘   └─────────────┘
     │                 │                 │
     └────────┬────────┴────────┬────────┘
              ▼                 ▼
       ┌────────────────────────────────┐
       │ EmailProvider interface         │
       │ (single shape — UI talks here)  │
       └─────────────────┬──────────────┘
                         │
                  ┌──────▼──────┐
                  │  Neon PG    │
                  │ (metadata)  │
                  └─────────────┘
```

## Core abstractions

**Provider dispatch table** ([`lib/email/providers/index.ts`](../lib/email/providers/index.ts)) —
the only place that switches on `account.provider`. UI and AI layers always
talk to this, never to Gmail/Graph/IMAP directly.

```ts
export const provider = {
  testConnection: (a: Account)                          => pick(a).testConnection(a),
  listInbox:      (a: Account, opts?: ListInboxOptions) => pick(a).listInbox(a, opts),
  getMessageBody: (a: Account, id: string)              => pick(a).getMessageBody(a, id),
  markRead:       (a: Account, id: string)              => pick(a).markRead(a, id),
  archive:        (a: Account, id: string)              => pick(a).archive(a, id),
  trash:          (a: Account, id: string)              => pick(a).trash(a, id),
  searchInbox:    (a: Account, q: string)               => pick(a).searchInbox(a, q),
  sendMessage:    (a: Account, opts: SendOpts)          => pick(a).sendMessage(a, opts),
};
```

Three implementations: [`gmail.ts`](../lib/email/providers/gmail.ts) (REST →
`gmail.googleapis.com`), [`graph.ts`](../lib/email/providers/graph.ts) (REST →
`graph.microsoft.com`), [`imap.ts`](../lib/email/providers/imap.ts) (ImapFlow +
Nodemailer). Feature detection via `ConnectionStatus.capabilities` —
Gmail-only colored labels gracefully no-op on IMAP (CLAUDE.md R9).

## Data flow — read

1. UI requests inbox → React Server Component calls `unifiedInbox.list()`
2. `unifiedInbox` fans out to each connected provider's `listInbox()` in parallel
3. Results merged, deduped by `Message-ID` (canonical) + `(date, from, subject_hash)` fallback
4. Cached in IDB; metadata indexed in Postgres for fast search
5. Stream rendered to client with React Server Components

## Data flow — AI

1. User clicks "Summarize thread" → server action triggered
2. Check per-account AI consent → if off, no-op
3. Fetch thread via `EmailProvider.getThread()` — never log content
4. Token budget enforced (Haiku: 4k in, 300 out for summary)
5. Vercel AI SDK → Anthropic API with prompt-cached system message
6. Stream response back to client
7. AI output stored as metadata (summary text + thread_id + timestamp), not the email

## Data flow — write

Optimistic: UI mutates local state → server action queued → on success, confirm; on failure, toast + rollback. Sends use provider-native SMTP / `users.messages.send` / `mail/send` to ensure DKIM/DMARC alignment.

## State boundaries

- **Server state** (TanStack Query): inbox, threads, search results — invalidates on provider webhook / Graph subscription / IMAP IDLE event
- **Client state** (Zustand): composer drafts, UI mode (split / focus / mobile), keyboard mode
- **Persistent** (Neon Postgres): user accounts, encrypted OAuth tokens, sync cursors, AI consent flags, AI summary cache (metadata only)
- **Volatile cache** (IDB): message metadata for offline; bodies fetched on demand

## PWA strategy

- **Manifest**: standalone display, brand colors, share_target so other apps can "Share to Mailpilot"
- **Service Worker**: precache app shell; runtime cache for API responses with stale-while-revalidate; background sync for queued sends
- **Push**: Web Push API + provider webhook fan-out (Gmail watch, Graph subscription, IMAP IDLE relay)

## Security & privacy posture

- OAuth tokens encrypted at rest (Postgres) with per-user KEK
- Email content never logged, never stored long-term
- AI requests go through a redaction layer that strips email addresses to `<email>` token
- Per-account AI opt-in; default OFF
- CSP locked down; HTML email rendered inside Shadow DOM iframe
- No tracking, no analytics on email content

## Trade-offs (explicit)

- **No long-term message storage** = no full-text search across years of mail; mitigated by indexing metadata + provider search APIs
- **Three-provider abstraction** = sometimes blocks Gmail-specific features (e.g. native filters); surfaced via `capabilities()`, not blended
- **AI opt-in default OFF** = lower demo wow-factor on first use; correct tradeoff for trust
- **PWA-only (no native)** = no system-level integrations like default mail handler on iOS; acceptable for v1
