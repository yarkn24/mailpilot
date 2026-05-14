# Mailpilot — Tech Stack

> Locked. Deviations must surface — never silent swaps.

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router | RSC + edge-ready, but we pin Node runtime for IMAP/SMTP |
| Language | TypeScript strict | Catch provider-shape drift at compile time |
| Styling | Tailwind v4 + `app/globals.css` design tokens | Refero "Signal Messenger" tokens; no CSS-in-JS |
| State | URL params + React local state | No global store yet; Zustand reserved for Phase 3 |
| PWA | Custom manifest + service worker | Avoid framework lock-in to Workbox |
| Email — IMAP | `imapflow` | IDLE-capable, no deprecated `imap-simple` shape |
| Email — SMTP | `nodemailer` | Standard, well-tested |
| Email — Gmail | Raw `fetch` to `gmail.googleapis.com` | No `@googleapis/gmail` to keep bundle small |
| Email — Graph | Raw `fetch` to `graph.microsoft.com` | Same reason; SDK is heavy and types are loose |
| OAuth | Authorization Code + PKCE, hand-rolled | Avoid NextAuth lock-in to its session model |
| AI | `@anthropic-ai/sdk` | Haiku for summarise/triage, Sonnet for drafts |
| Storage | In-memory `Map` (demo) | Phase 3 → Neon Postgres + per-user KEK |
| Tests | Vitest (unit) + Playwright (E2E with video) | Parallel-safe; no shared regex `/g` state |
| Hosting | Vercel free Hobby | Serverless functions; long-lived sync → separate worker |
| Node | v24 | Required for `fetch`, `crypto.randomBytes(..., "base64url")` |
| Package manager | npm | Project standard |

## Pinned model IDs (no "claude-latest")

- `claude-haiku-4-5` — summaries, prioritisation
- `claude-sonnet-4-6` — reply drafts

## Files where this matters

- `lib/email/providers/index.ts` — only place that switches on `account.provider`
- `lib/email/types.ts` — shared shapes (MessageSummary, MessageBody, Account)
- `lib/oauth/{gmail,graph,state}.ts` — OAuth surface; redaction never trusts these
- `lib/email/dedupe.ts` — Message-ID → canonical key, with safety fallback
