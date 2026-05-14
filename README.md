# Mailpilot

**AI-first universal email client. Mobile-ready PWA. Gmail + Office 365 + IMAP.**

One inbox. Three providers. AI that drafts, summarizes, and prioritizes — never logs.

---

## What it does

- **Unified inbox** across Gmail, Microsoft 365 (Graph), and any IMAP host (Yahoo, AOL, custom).
- **Account switching** without re-auth on every visit.
- **Compose / reply / forward** with provider-native send paths.
- **Search, labels, archive, delete** — keyboard-first, optimistic UI.
- **AI summaries** of long threads (Claude Haiku).
- **AI reply drafts** that match the user's tone (Claude Sonnet).
- **AI prioritization** — surfaces what matters, demotes what doesn't.
- **PWA** — installable, offline-capable, push-enabled.

---

## Architecture (one screen)

```
┌──────────────────────────────────────────────────────────────┐
│  PWA (Next.js 16 App Router + React 19 + Tailwind v4)        │
│  Service Worker · Web App Manifest · Push                    │
└─────────────┬────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────┐
│  API routes / Server Actions (Vercel Functions)              │
│  Clerk auth · per-provider OAuth · rate-limited              │
└─────┬──────────────┬──────────────┬──────────────┬───────────┘
      │              │              │              │
      ▼              ▼              ▼              ▼
┌─────────┐   ┌──────────┐   ┌────────────┐  ┌──────────────┐
│ Gmail   │   │ Graph    │   │ ImapFlow   │  │ AI SDK       │
│ API     │   │ (M365)   │   │ (IMAP)     │  │ (Claude)     │
└─────────┘   └──────────┘   └────────────┘  └──────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────────┐
│  EmailProvider interface (providers/EmailProvider.ts)        │
│  All UI/business code talks ONLY to this interface           │
└──────────────────────────────────────────────────────────────┘

State: TanStack Query (server) + Zustand (client)
Metadata DB: Neon Postgres (Vercel Marketplace)
Messages: never stored — fetched from provider on demand, cached in IDB
```

Full breakdown in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Built with Claude Code discipline

This repo is also a demonstration of agent-driven development:

- **[CLAUDE.md](CLAUDE.md)** — project rules (stack, PII, provider abstraction, fail-loud, …)
- **[.claude/agents/](.claude/agents/)** — specialized sub-agents (`email-parser`, `ui-designer`, `deploy-engineer`)
- **[.claude/commands/](.claude/commands/)** — slash commands (`/devils-advocate`, `/brutal-editor`, `/bullets-to-article`, `/multi-source-synthesis`)
- **[.claude/skills/](.claude/skills/)** — Spec Kit workflow (`/speckit-constitution`, `/speckit-specify`, `/speckit-plan`, `/speckit-tasks`, `/speckit-implement`, `/speckit-clarify`, `/speckit-analyze`, `/speckit-checklist`) + git extension skills
- **[.specify/](.specify/)** — constitution + spec-driven dev artifacts (Spec Kit by GitHub)
- **[docs/WORKFLOW.md](docs/WORKFLOW.md)** — multi-agent workflow writeup

---

## Stack

| Layer | Tech |
|---|---|
| UI | Next.js 16, React 19, TypeScript strict, Tailwind v4 |
| State | TanStack Query, Zustand |
| PWA | Web App Manifest, custom Service Worker |
| Auth (app users) | Clerk (Vercel Marketplace) |
| Auth (mailboxes) | per-provider OAuth + token vault |
| Email | Gmail API, Microsoft Graph, ImapFlow |
| AI | Vercel AI SDK + Anthropic (Claude Haiku/Sonnet) |
| DB | Neon Postgres (Vercel Marketplace) — metadata only |
| Deploy | Vercel (preview per branch, prod on main) |
| Tests | Vitest (unit), Playwright (e2e), MSW (network mocks) |

---

## Live status

| Surface | Works today | Notes |
|---|---|---|
| Landing page | ✅ | https://mailpilot-virid.vercel.app |
| IMAP connect (Yahoo, AOL, iCloud, Fastmail, custom) | ✅ | App password required; live IMAP test before save |
| Inbox listing across multiple IMAP accounts | ✅ | Unified, deduped by Message-ID |
| Read message body (HTML sandboxed) | ✅ | Iframe `sandbox=""` + no script execution |
| Archive / Trash / Mark read | ✅ | Provider-aware folder fallbacks |
| Compose / Reply | ✅ | SMTP via provider; header-injection guarded |
| Search | ✅ | Server-side IMAP `SEARCH BODY` |
| AI Summary | ✅ when `ANTHROPIC_API_KEY` set | Claude Haiku 4.5; stub response otherwise |
| AI Reply draft | ✅ when key set | Claude Sonnet 4.6; tone-controlled |
| AI Prioritization | ✅ when key set | Batched, returns priority band per message |
| Gmail OAuth | ⏳ scaffold | Provider abstraction in place; OAuth flow pending |
| Microsoft 365 OAuth | ⏳ scaffold | Same shape as Gmail; pending |

## Development

```bash
npm install
npm run dev                  # local dev server on :3000

npm run typecheck            # tsc --noEmit
npm test                     # vitest unit tests
npm run test:e2e             # playwright

npm run build                # next build — also catches SSR errors
```

Required environment variables: see `.env.example`.

## Quick demo (IMAP)

1. Open the live URL → **Settings** → fill the IMAP form with your Yahoo/AOL/iCloud/Fastmail email and an **app password** (generate from your provider's security settings).
2. **Inbox** shows your latest 25 messages.
3. Open a message → **Summarize** or **Draft reply** → AI runs (real Claude call if key is configured server-side, otherwise stub).
4. Use **Archive**, **Trash**, or **Reply** from the message view.

Storage is in-memory (per session cookie) in this preview — disconnecting and reconnecting will not persist accounts across server restarts. Production uses Neon Postgres with per-user KEK encryption.

---

## License

Private. All rights reserved.
