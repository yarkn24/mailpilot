# Mailpilot

**An AI-first universal email client — built autonomously with Claude Code, multi-agent orchestration, and spec-driven development.**

The product is real (Gmail + Microsoft 365 + IMAP, unified inbox, AI summary/draft/prioritize, mobile-ready PWA). The point of this repo, though, is the **build process**: how a single operator can orchestrate Claude Code agents to design, code, test, commit, push, and deploy a non-trivial product mostly autonomously, with the human in a review/approve loop.

**Live demo:** https://mailpilot-virid.vercel.app
**Built with:** Claude Code CLI · Anthropic SDK · Spec Kit (GitHub) · Agent OS (BuilderMethods) · Superpowers plugin · Vercel · Next.js 16 · Supabase

---

## How this repo was built (the actually-interesting part)

Three autonomous Claude Code sessions. The operator set a goal, walked away, and came back to a deployed live URL plus a written end-of-session report at [`docs/SESSION_REPORT.md`](docs/SESSION_REPORT.md). The full skill/technique log is at [`docs/USED_SKILLS_AND_TECHNIQUES.md`](docs/USED_SKILLS_AND_TECHNIQUES.md).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Operator                                                                     │
│   ▼                                                                          │
│ Goal handed off → Claude Code (main agent)                                   │
│   ├─ TodoWrite — plans + tracks the work                                     │
│   ├─ Spawns sub-agents in parallel when work is independent                  │
│   │    email-parser · ui-designer · deploy-engineer · ai-engineer            │
│   │    security-engineer · qa-engineer · hacker-engineer · auditor           │
│   ├─ Skills (.claude/skills/ + Superpowers plugin)                           │
│   │    /speckit-{specify, plan, tasks, implement, …} — Spec Kit              │
│   │    /loop · /schedule · /to-issues · /grill-me · using-superpowers        │
│   ├─ Slash commands (.claude/commands/)                                      │
│   │    /devils-advocate · /brutal-editor · /multi-source-synthesis           │
│   ├─ Hooks (.githooks/)                                                      │
│   │    pre-commit (typecheck + lint + tests + PII guardrail)                 │
│   │    post-merge (deps drift alert)                                         │
│   │    post-commit (auditor sub-agent reviews every commit's diff)           │
│   ├─ Read / Edit / Write / Bash / Grep — direct file + shell                 │
│   └─ vercel CLI / gh CLI / git — push, PR, deploy without leaving terminal  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### What's in this repo, organised by JD-keyword

| Job-listing concept | Where it lives in this repo |
|---|---|
| `claude.md` | [`CLAUDE.md`](CLAUDE.md) — 10 project rules + global Karpathy rules inherited |
| Multi-agent coding systems | [`.claude/agents/`](.claude/agents/) — 8 specialised sub-agents |
| Specs-driven development | [`.specify/`](.specify/) (Spec Kit by GitHub) + [`.agent-os/specs/`](.agent-os/specs/) |
| Skills architecture | [`.claude/skills/`](.claude/skills/) — 14 Spec Kit skills + Superpowers, frontend-design, webapp-testing |
| Hooks | [`.githooks/`](.githooks/) — pre-commit, post-merge, post-commit (auditor) |
| Plugins | Superpowers · Vercel · GitHub · Playwright · Chrome DevTools MCP — leveraged from `~/.claude/plugins/` |
| Autonomous execution | Autonomous Claude Code sessions — see [`docs/SESSION_REPORT.md`](docs/SESSION_REPORT.md) for end-of-session reports |
| Self-improving agents | The **auditor** post-commit hook reviews every diff, writes to `.git/suspicious-audit.log` |
| Git/GitHub workflows | All commits, pushes, and deploys executed by Claude via `gh` + `vercel` CLI |
| CI/CD orchestration | Vercel auto-deploy on push to `main` · branch previews · Vercel CLI direct deploys |
| Spec-driven dev | `/speckit-constitution → specify → plan → tasks → implement` workflow ([`docs/WORKFLOW.md`](docs/WORKFLOW.md)) |
| Agent OS methodology | [`.agent-os/`](.agent-os/) — product (mission/roadmap/tech-stack), standards, instructions, specs |
| Continuous autonomous execution | `/loop` skill + `ScheduleWakeup` for cron-like agent re-entry |
| AI-driven SDLC | Tests authored + run, commits authored, PR + deploys all initiated by Claude |

### Stats from this build

- **3 autonomous sessions** to ship a working product + full Claude-Code-discipline scaffolding
- **22 unit tests** (Vitest) + **44 E2E tests** (Playwright, mobile + desktop) — passing
- **8 sub-agents** × **4 custom slash commands** × **14 skills** × **3 git hooks**
- **19 production routes** on Vercel
- **52 files** in the final atomic commit covering universal providers, AI vendor abstraction, Supabase persistence, Agent OS, encryption-at-rest, and Forward UI
- **Zero manual code** during autonomous execution — operator gave goals, Claude orchestrated agents to fulfil them

---

## What the product does (the artifact, briefly)

- **Unified inbox** across Gmail (REST), Microsoft 365 (Graph), and any IMAP host (Yahoo/AOL/iCloud/Fastmail/custom).
- **Account switching** with per-account unread counts; one-click chip filter.
- **Compose · Reply · Forward** with provider-native send paths (Gmail `messages/send` raw RFC822 · Graph `/sendMail` · IMAP via Nodemailer SMTP).
- **Search · Labels · Archive · Trash · Mark-read** via a single dispatch table (`lib/email/providers/index.ts`) — UI never touches a provider SDK directly.
- **AI summaries / reply drafts / prioritization** — multi-vendor: picks Gemini 2.5 (free tier) if `GEMINI_API_KEY` is set, falls back to Claude Haiku/Sonnet if `ANTHROPIC_API_KEY` is set, otherwise returns a stub with a clear "configure a key" message.
- **PWA** — installable, offline-capable, push-ready.
- **Persistence** — Supabase Postgres with AES-256-GCM at-rest encryption when configured; in-memory fallback for zero-config dev.

Full architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Project rules (the discipline)

Encoded in [`CLAUDE.md`](CLAUDE.md). Highlights:

- **R1** Email data is never logged. PII guard runs in pre-commit hook.
- **R2** Provider abstraction is mandatory. One dispatch table, three implementations.
- **R3** AI is opt-in per-mailbox, default OFF. If AI is off, the button doesn't render.
- **R4** Token budgets enforced in code, not just docs.
- **R5** Optimistic UI for archive/delete/mark-read/send.
- **R6** Tests verify intent, not just behaviour.
- **R7** Checkpoint after each significant step (the session reports do exactly this).
- **R8** Fail loud, never silent.
- **R9** UI never reaches across providers — capability flags drive behaviour.
- **R10** Read before you write — especially across the three provider implementations.

The global `~/.claude/CLAUDE.md` (Karpathy's 4 rules) compounds on top.

---

## Live status

| Surface | Works today | Notes |
|---|---|---|
| Landing page | ✅ | https://mailpilot-virid.vercel.app |
| IMAP connect (Yahoo, AOL, iCloud, Fastmail, custom) | ✅ | App password required; live IMAP test before save |
| Gmail OAuth + REST adapter | ✅ code · ⏳ creds | PKCE flow at `/api/oauth/gmail/*`; operator sets `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` |
| Microsoft 365 OAuth + Graph REST adapter | ✅ code · ⏳ creds | Same shape; operator sets `MICROSOFT_CLIENT_ID/SECRET/REDIRECT_URI` |
| Unified inbox across all three providers | ✅ | Fans out via `provider.listInbox`; dedupe by Message-ID; one slow provider can't blank the whole inbox |
| Account switcher chips | ✅ | Per-account unread counts; client-side filter |
| Read message body (HTML sandboxed) | ✅ | `<iframe sandbox=""> referrerPolicy="no-referrer"` |
| Archive / Trash / Mark read | ✅ | Provider-native verbs through dispatch table |
| Compose · Reply · Forward | ✅ | Reply prefills `Re:`+quoted body; Forward prefills `Fwd:`+separator |
| Search | ✅ | IMAP `SEARCH BODY` · Gmail `?q=` · Graph `$search` |
| AI Summary / Draft / Prioritize | ✅ when `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` set | Gemini 2.5 Flash/Pro or Claude Haiku/Sonnet; stub otherwise |
| Persistence | ✅ when Supabase env set | Supabase + AES-GCM at-rest crypto; in-memory fallback |

---

## How to run

```bash
git clone https://github.com/yarkn24/mailpilot
cd mailpilot
npm install
npm test              # 22 unit tests (vitest)
npm run test:e2e      # 44 e2e tests (playwright)
npm run typecheck     # tsc --noEmit
npm run build         # next build
npm run dev           # local dev on :3000
```

Env vars to enable each feature: see [`.env.example`](.env.example).

---

## License

Private. All rights reserved.
