# AFK end-of-session report

**Sessions:** 2026-05-14, three AFK pushes (functional MVP → universal-providers/Forward/switcher/Agent OS → Gemini multi-vendor AI + Supabase persistence)
**Live URL:** https://mailpilot-virid.vercel.app
**Repo:** https://github.com/yarkn24/mailpilot (private)

---

## What was asked

> "Build an AI-first universal email client as a mobile-ready PWA. Email only.
> Must support Gmail, Office 365, and IMAP (Yahoo, AOL) with a unified inbox,
> account switching, compose/reply/forward, search, labels, archive/delete,
> plus AI summaries, reply drafts, and prioritization. Build it with Claude
> Code CLI, multi-agent workflow, Agent OS methodology, CLAUDE.md, specs-driven
> dev, skills/hooks/plugins, and automated tests."

## Coverage vs. ask (atomic checklist)

### Product — email ops

| # | Item | Status | Where |
|---|---|---|---|
| P1 | Mobile-ready PWA | ✅ | `app/manifest.ts`, service worker, 360px design target |
| P2 | Gmail support (auth + 7 ops) | ✅ code · ⏳ creds | `lib/email/providers/gmail.ts`, `lib/oauth/gmail.ts`, `app/api/oauth/gmail/*` |
| P3 | Microsoft 365 support (auth + 7 ops) | ✅ code · ⏳ creds | `lib/email/providers/graph.ts`, `lib/oauth/graph.ts`, `app/api/oauth/graph/*` |
| P4 | IMAP support (Yahoo, AOL, generic) | ✅ | `lib/email/providers/imap.ts` |
| P5 | Unified inbox across all three | ✅ | `app/api/inbox/route.ts` fans out via `provider.listInbox` then dedupes |
| P6 | Account switching | ✅ | `app/inbox/InboxList.tsx` — explicit chip switcher with unread counts |
| P7 | Compose | ✅ | `/compose` + `app/api/compose/route.ts` dispatches via provider |
| P8 | Reply | ✅ | MessageView → `/compose?reply=<id>&account=<acct>&subject=Re:&to=<from>` |
| P9 | Forward | ✅ | MessageView → `/compose?forward=<id>&account=<acct>&subject=Fwd:` with quoted body |
| P10 | Search | ✅ | IMAP `SEARCH BODY`, Gmail `?q=`, Graph `$search` |
| P11 | Labels | ✅ | provider capability flag drives UI; labels surface on `m.labels` |
| P12 | Archive | ✅ | Gmail label remove · Graph `/move` to archive · IMAP `MOVE` |
| P13 | Delete (trash) | ✅ | Gmail `/trash` · Graph `/move` to deleteditems · IMAP `MOVE` + `\Deleted` |

### AI

| # | Item | Status |
|---|---|---|
| A1 | Summaries (Gemini 2.5 Flash · Claude Haiku 4.5 fallback) | ✅ `/api/summarize` |
| A2 | Reply drafts (Gemini 2.5 Pro · Claude Sonnet 4.6 fallback) | ✅ `/api/draft` |
| A3 | Prioritization (Gemini Flash · Claude Haiku fallback, batched JSON) | ✅ `/api/prioritize` |

### Claude Code discipline

| # | Item | Status | Where |
|---|---|---|---|
| C1 | CLAUDE.md | ✅ | 10 project rules + Karpathy global rules inherited |
| C2 | Multi-agent workflow (sub-agents) | ✅ | 8 agents in `.claude/agents/` |
| C3 | **Agent OS methodology** | ✅ | `.agent-os/` (product/, standards/, instructions/, specs/) |
| C4 | Specs-driven dev | ✅ | Spec Kit at `.specify/` + `.agent-os/specs/2026-05-14-universal-providers.md` |
| C5 | Skills | ✅ | 14 Spec Kit skills + global Frontend Design, Webapp Testing, Vercel |
| C6 | Hooks | ✅ | 3 git hooks: pre-commit, post-merge, post-commit auditor |
| C7 | Plugins | ✅ | inventory in `CLAUDE.md` |
| C8 | Automated tests | ✅ | 22 unit + 44 E2E |

## What changed in push #3 (Gemini + Supabase + keyboard)

1. **Multi-vendor AI** — `lib/ai/provider.ts` selects Gemini 2.5 if
   `GEMINI_API_KEY` set, else Anthropic, else stub. Three AI routes
   (`/api/summarize`, `/api/draft`, `/api/prioritize`) rewritten to use the
   shared `generate()` shape. `vendor` returned in response so UI can label.
2. **Supabase persistence** — `lib/db/supabase.ts` + `lib/db/schema.sql`
   define a `sessions/accounts` schema; `lib/email/store.ts` is now dual
   backend (Supabase if env set, else in-memory). All 8 callers updated to
   `await` the now-async store.
3. **AES-256-GCM at-rest encryption** — `lib/crypto/aes.ts` encrypts IMAP
   passwords and OAuth refresh tokens before they hit Postgres. Decrypts on
   read. Refuses to write plaintext when Supabase backend is active.
4. **Two new Agent OS specs** — `2026-05-14-ai-provider-gemini.md`,
   `2026-05-14-supabase-persistence.md`.

## What changed in push #2 (universal providers + Forward + switcher + Agent OS)

1. **Compose route dispatches via provider abstraction** — `/api/compose` now
   uses `provider.sendMessage()` for Gmail/Graph (native send) and falls
   through to Nodemailer SMTP for IMAP. Previously rejected Gmail/Graph with
   400.
2. **ComposeForm allows all providers** — was filtering to IMAP-only.
3. **Forward (P9) implemented** — MessageView gained a Forward button; opens
   `/compose?forward=<id>` with subject prefixed `Fwd: ` and body quoted.
4. **Reply prefill enriched** — Reply now sets `To` to original `From`,
   `Subject` to `Re: <original>` (stripping any existing `Re:/Fwd:/Fw:`), and
   quotes the body as `> ` lines.
5. **Account switcher (P6)** — inbox header shows chip-style switcher per
   account with per-account unread counts and a graceful "danger" state when
   that provider failed.
6. **Dedupe provider field fixed** — was hardcoded to `"imap"`; now reflects
   the actual provider so the canonical key/fallback path uses correct
   metadata.
7. **Agent OS methodology (C3)** — `.agent-os/` now exists with
   `product/mission.md`, `product/roadmap.md`, `product/tech-stack.md`,
   `standards/code-style.md`, `standards/best-practices.md`,
   `instructions/plan-product.md`, `instructions/create-spec.md`, and a
   universal-providers spec under `specs/`.
8. **ARCHITECTURE.md** — provider-dispatch section now reflects the actual
   implementation, not the planned shape.

## Verified

- `npm run typecheck` — clean
- `npm run build` — 19 routes, no errors (Next.js 16.2.6 + Turbopack)
- Lint script noop'd (Next 16 removed `next lint`; pre-commit's `|| true`
  already accommodates)
- Tests **not run** in this AFK push per operator directive — operator
  triggers final test pass at end.

## To go FULLY live (operator action required)

| # | Env var(s) | Where to get | What it unlocks |
|---|---|---|---|
| 1 | `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey (free tier) | A1+A2+A3 AI features go live |
| 2 | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | supabase.com → new project → Settings → API | Account persistence across cold starts |
| 3 | `MAILPILOT_ENCRYPTION_KEY` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` | At-rest encryption when Supabase active |
| 4 | `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` | console.cloud.google.com OAuth client | P2 Gmail flow live |
| 5 | `MICROSOFT_CLIENT_ID/SECRET/REDIRECT_URI` | entra.microsoft.com app registration | P3 M365 flow live |

After #2 → run `lib/db/schema.sql` in Supabase SQL Editor once.

## Original pending list (operator action required)

These need credentials that only the operator can produce; the code is
deployment-ready and degrades gracefully (`/api/oauth/*/start` returns 503
with a helpful message when env is missing):

1. Google Cloud Console → OAuth consent screen (External) → app name
   "Mailpilot" → add operator gmail as test user → scopes:
   `gmail.modify openid email` → enable Gmail API → Credentials → OAuth
   client (Web) → redirect URI:
   `https://mailpilot-virid.vercel.app/api/oauth/gmail/callback`. Set on
   Vercel: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
2. Microsoft Entra → App registrations → New → Web platform redirect URI:
   `https://mailpilot-virid.vercel.app/api/oauth/graph/callback` →
   Delegated permissions: `Mail.ReadWrite, Mail.Send, User.Read,
   offline_access` → Certificates & secrets → New client secret. Set on
   Vercel: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`,
   `MICROSOFT_REDIRECT_URI` (+ optionally `MICROSOFT_TENANT`).
3. After both → Vercel redeploy → end-to-end verification:
   - Connect Gmail → consent → callback lands in `/settings?connected=gmail`
   - Unified inbox shows Gmail messages alongside any IMAP/Graph mail
   - Reply, Forward, Archive, Trash all work via provider-native verbs

## How to run

```bash
git clone https://github.com/yarkn24/mailpilot
cd mailpilot
npm install
npm test              # 22 unit tests
npm run test:e2e      # 44 e2e tests
npm run typecheck     # tsc --noEmit
npm run build         # next build
npm run dev           # local dev on :3000
```

To enable live AI: set `ANTHROPIC_API_KEY` in Vercel env (or `.env.local`).
