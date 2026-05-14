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
- **[.claude/agents/](.claude/agents/)** — 8 specialized sub-agents (`email-parser`, `ui-designer`, `deploy-engineer`, `ai-engineer`, `security-engineer`, `qa-engineer`, `hacker-engineer`, `auditor`)
- **[.claude/commands/](.claude/commands/)** — slash commands (`/devils-advocate`, `/brutal-editor`, `/bullets-to-article`, `/multi-source-synthesis`)
- **[.claude/skills/](.claude/skills/)** — 14 Spec Kit skills (`/speckit-constitution`, `/speckit-specify`, `/speckit-plan`, `/speckit-tasks`, `/speckit-implement`, …) + git extension skills
- **[.specify/](.specify/)** — Spec Kit by GitHub: constitution + spec-driven dev artifacts
- **[.agent-os/](.agent-os/)** — Agent OS methodology: product (mission/roadmap/tech-stack), standards (code-style/best-practices), instructions, specs
- **[.githooks/](.githooks/)** — 3 git hooks: `pre-commit` (typecheck + lint + tests + PII guard), `post-merge` (deps drift), `post-commit` (auditor sub-agent)
- **[docs/WORKFLOW.md](docs/WORKFLOW.md)** — multi-agent workflow writeup
- **[docs/USED_SKILLS_AND_TECHNIQUES.md](docs/USED_SKILLS_AND_TECHNIQUES.md)** — live log of every skill/technique used

---

## Stack

| Layer | Tech |
|---|---|
| UI | Next.js 16, React 19, TypeScript strict, Tailwind v4 |
| State | TanStack Query, Zustand |
| PWA | Web App Manifest, custom Service Worker |
| Auth (mailboxes) | per-provider OAuth (PKCE) + token vault |
| Email | Gmail API · Microsoft Graph · ImapFlow |
| AI | Multi-vendor: Gemini 2.5 (free tier) **or** Anthropic Claude — picked by env at runtime |
| Persistence | Supabase Postgres (recommended) **or** in-memory fallback |
| At-rest crypto | AES-256-GCM with `MAILPILOT_ENCRYPTION_KEY` for IMAP passwords + OAuth refresh tokens |
| Deploy | Vercel (preview per branch, prod on main) |
| Tests | Vitest (unit), Playwright (e2e), MSW (network mocks) |

---

## Live status

| Surface | Works today | Notes |
|---|---|---|
| Landing page | ✅ | https://mailpilot-virid.vercel.app |
| IMAP connect (Yahoo, AOL, iCloud, Fastmail, custom) | ✅ | App password required; live IMAP test before save |
| Gmail OAuth + Gmail REST adapter | ✅ code · ⏳ creds | PKCE flow at `/api/oauth/gmail/*`; needs `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` in Vercel env |
| Microsoft 365 OAuth + Graph REST adapter | ✅ code · ⏳ creds | Same shape; needs `MICROSOFT_CLIENT_ID/SECRET/REDIRECT_URI` in Vercel env |
| Unified inbox across all three providers | ✅ | Fans out via `provider.listInbox`; deduped by Message-ID; per-provider failure degrades gracefully |
| Account switcher chips | ✅ | Per-account unread counts; client-side filter (no extra network) |
| Read message body (HTML sandboxed) | ✅ | Iframe `sandbox=""` + no script execution |
| Archive / Trash / Mark read | ✅ | Provider-native verbs through dispatch table |
| Compose | ✅ | Gmail `messages/send` raw RFC822 · Graph `/sendMail` · IMAP via Nodemailer SMTP |
| Reply | ✅ | Pre-fills `To`, `Re: <subject>`, quoted body |
| Forward | ✅ | Pre-fills `Fwd: <subject>`, full body as `---------- Forwarded message ----------` |
| Search | ✅ | Provider-native: IMAP `SEARCH BODY` · Gmail `?q=` · Graph `$search` |
| AI Summary | ✅ when `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` set | Gemini 2.5 Flash or Claude Haiku 4.5; stub otherwise |
| AI Reply draft | ✅ when key set | Gemini 2.5 Pro or Claude Sonnet 4.6; tone-controlled |
| AI Prioritization | ✅ when key set | Batched JSON; returns priority band per message |
| Persistence | ✅ when Supabase env set | Supabase + AES-GCM at-rest crypto; in-memory fallback |

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

## Quick demo

### IMAP path (zero config)

1. Open the live URL → **Settings** → fill the IMAP form with your Yahoo/AOL/iCloud/Fastmail email and an **app password** (generate from your provider's security settings).
2. **Inbox** shows your latest 25 messages with an account-switcher chip.
3. Open a message → **Summarize**, **Draft reply**, **Reply**, or **Forward**.
4. Use **Archive** or **Trash** from the message header.

### Gmail / Microsoft 365 path (requires server env)

1. The operator installs OAuth credentials in Vercel env (see [`docs/AFK_REPORT.md`](docs/AFK_REPORT.md) for the exact `GOOGLE_*` / `MICROSOFT_*` variables and the Google Cloud / Entra setup steps).
2. From **Settings**, click **Connect Gmail** or **Connect Microsoft 365** → provider consent screen → callback drops you back at `/settings?connected=...`.
3. The unified inbox now merges Gmail + M365 + IMAP through one dispatch layer.

Storage is in-memory (per session cookie) in this preview — disconnecting and reconnecting will not persist accounts across server restarts. Production uses Neon Postgres with per-user KEK encryption.

---

## License

Private. All rights reserved.
