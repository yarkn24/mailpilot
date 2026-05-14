# Assignment — original brief + coverage checklist

## The brief (verbatim)

> Build an AI-first universal email client as a mobile-ready PWA. Email only.
> Must support Gmail, Office 365, and IMAP (Yahoo, AOL) with a unified inbox,
> account switching, compose/reply/forward, search, labels, archive/delete,
> plus AI summaries, reply drafts, and prioritization. Build it with Claude
> Code CLI, multi-agent workflow, Agent OS methodology, CLAUDE.md, specs-driven
> dev, skills/hooks/plugins, and automated tests.

## Coverage — atomic checklist

### Product

| # | Item | Status | Live demo verified | Where in code |
|---|---|---|---|---|
| P1 | Mobile-ready PWA | ✅ done | yes — installable + manifest + SW | `app/manifest.ts`, `public/sw.js` |
| P2 | Gmail OAuth + REST adapter | ✅ live | yes — `/api/oauth/gmail/start` → real Google consent screen with PKCE | `lib/oauth/gmail.ts`, `lib/email/providers/gmail.ts`, `app/api/oauth/gmail/*` |
| P3 | Microsoft 365 OAuth + Graph REST adapter | ✅ code · ⏳ creds | code complete; operator's personal Hotmail couldn't open an Entra tenant. Outlook/Hotmail/Live accounts route through IMAP preset (`outlook.office365.com:993`) | `lib/oauth/graph.ts`, `lib/email/providers/graph.ts`, `app/api/oauth/graph/*` |
| P4 | IMAP (Yahoo, AOL, iCloud, Fastmail, Outlook, custom) | ✅ done | yes — auto-detect presets + live connection test before save | `lib/email/providers/imap.ts` |
| P5 | Unified inbox across all providers | ✅ done | yes — `provider.listInbox()` fans out via dispatch table; deduped by Message-ID | `app/api/inbox/route.ts`, `lib/email/dedupe.ts` |
| P6 | Account switching | ✅ done | yes — chip switcher in inbox header with per-account unread counts | `app/inbox/InboxList.tsx` |
| P7 | Compose | ✅ done | yes — Gmail `messages/send` raw RFC822, Graph `/sendMail`, IMAP via Nodemailer SMTP | `app/api/compose/route.ts`, `app/compose/ComposeForm.tsx` |
| P8 | Reply | ✅ done | yes — pre-fills `Re: <subject>`, `To = original From`, quoted body | `app/inbox/[accountId]/[id]/MessageView.tsx` (composeHref helper) |
| P9 | Forward | ✅ done | yes — pre-fills `Fwd: <subject>` + `---------- Forwarded message ----------` separator | same |
| P10 | Search | ✅ done | yes — Gmail `?q=`, Graph `$search`, IMAP `SEARCH BODY` | `app/api/search/route.ts`, each provider's `searchInbox()` |
| P11 | Labels | ✅ done | yes — provider capability flag drives UI; chips render Gmail labels, Graph categories, IMAP folders | `lib/email/types.ts` (ProviderCapabilities), `app/inbox/InboxList.tsx` |
| P12 | Archive | ✅ done | yes — Gmail remove INBOX label, Graph `/move` to archive, IMAP MOVE with fallback | each provider's `archive()` + `app/api/actions/route.ts` |
| P13 | Delete (trash) | ✅ done | yes — Gmail `/trash`, Graph `/move` to deleteditems, IMAP MOVE + `\Deleted` + expunge | each provider's `trash()` |

### AI

| # | Item | Status | Notes |
|---|---|---|---|
| A1 | AI summaries | ✅ code · ⏳ key | Multi-vendor: Gemini 2.5 Flash if `GEMINI_API_KEY` set, else Claude Haiku 4.5 if `ANTHROPIC_API_KEY` set, else stub. Token budget 4k/300, redaction before model boundary. |
| A2 | AI reply drafts | ✅ code · ⏳ key | Gemini 2.5 Pro / Claude Sonnet 4.6; tone-controlled (neutral/warm/brief). 6k/800. |
| A3 | AI prioritization | ✅ code · ⏳ key | Batched JSON output; classifies high/normal/low. 8k/200. |

All three currently return a stub message with clear "set GEMINI_API_KEY (free) or ANTHROPIC_API_KEY" hint until a key is configured.

### Claude Code discipline

| # | Item | Status | Where |
|---|---|---|---|
| C1 | CLAUDE.md | ✅ done | `CLAUDE.md` — 10 project rules + Karpathy global rules inherited |
| C2 | Multi-agent workflow | ✅ done | `.claude/agents/` — 8 specialised sub-agents (`email-parser`, `ui-designer`, `deploy-engineer`, `ai-engineer`, `security-engineer`, `qa-engineer`, `hacker-engineer`, `auditor`) |
| C3 | Agent OS methodology | ✅ done | `.agent-os/` — product (mission/roadmap/tech-stack), standards (code-style/best-practices), instructions, specs |
| C4 | Specs-driven development | ✅ done | `.specify/` (Spec Kit by GitHub) + `.agent-os/specs/` (per-feature spec files) |
| C5 | Skills | ✅ done | 14 Spec Kit skills + Superpowers plugin (`using-superpowers`, `verification-before-completion`, `writing-skills`, ...) + `frontend-design`, `webapp-testing`, `vercel:*` |
| C6 | Hooks | ✅ done | `.githooks/` — 3 hooks: `pre-commit` (typecheck + lint + tests + PII guard), `post-merge` (deps drift), `post-commit` (auditor sub-agent reviews every diff) |
| C7 | Plugins | ✅ done | Superpowers · Vercel · GitHub · Playwright · Chrome DevTools MCP · Exa · commit-commands · claude-md-management — inventory in `CLAUDE.md` |
| C8 | Automated tests | ✅ done | 22/22 unit (Vitest) + 44/44 E2E (Playwright, mobile + desktop) passing |

## Live demo links

- **Live URL:** https://mailpilot-virid.vercel.app
- **Settings page:** https://mailpilot-virid.vercel.app/settings
- **Gmail OAuth (works):** https://mailpilot-virid.vercel.app/api/oauth/gmail/start → real Google consent screen
- **Repo:** https://github.com/yarkn24/mailpilot

## What to look at for a code-quality review

1. `lib/email/providers/index.ts` — the single dispatch table (CLAUDE.md R2)
2. `lib/ai/provider.ts` — multi-vendor AI abstraction (Gemini + Anthropic)
3. `lib/email/dedupe.ts` — Message-ID canonical + fallback for cross-provider dedup
4. `lib/email/redact.ts` — PII redaction layer that runs before any model call (CLAUDE.md R1)
5. `lib/crypto/aes.ts` — AES-256-GCM at-rest encryption for IMAP passwords + OAuth refresh tokens
6. `.githooks/post-commit` — the auditor self-improvement hook
7. `.agent-os/specs/2026-05-14-*.md` — three feature specs written before implementation
8. `docs/WORKFLOW.md` — multi-agent workflow narrative
9. `tests/unit/redact-adversarial.test.ts` — prompt-injection + adversarial PII tests
10. `tests/e2e/04-hacker-adversarial.spec.ts` — header injection, type confusion, control-char probes

## What's deliberately not built (and why)

Documented in `docs/VISION.md`:

- Calendar, contacts, tasks, chat → email only per brief.
- Server-side ML / training on user mail → privacy posture.
- Long-lived IMAP IDLE / Gmail watch / Graph subscriptions → needs stateful
  worker tier, not Vercel serverless.
- Native iOS/Android app → PWA covers the brief.
