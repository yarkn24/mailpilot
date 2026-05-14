# Mailpilot — Claude Code Project Rules

AI-first universal email client (PWA). Gmail + Office 365 + IMAP (Yahoo, AOL).
Unified inbox, AI summaries, AI reply drafts, AI prioritization.

This file overrides defaults for this project. The user's global `~/.claude/CLAUDE.md`
(Karpathy's 4 rules) still applies — these are additions, not replacements.

---

## Stack (locked)

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind v4
- **PWA:** Service Worker + Web App Manifest, offline-first cache, push notifications
- **Auth:** Clerk (Marketplace) for app users; per-provider OAuth (Gmail, Microsoft Graph) for mailbox access
- **Email transport:** Gmail API, Microsoft Graph, ImapFlow (Node) for IMAP
- **AI:** Vercel AI SDK + Claude (Haiku for summaries/triage, Sonnet for drafts)
- **State:** TanStack Query for server state, Zustand for client state
- **DB:** Postgres (Neon via Vercel Marketplace) for metadata + indices; emails stay at provider
- **Deploy:** Vercel (preview per branch, prod on main)
- **Tests:** Vitest (unit), Playwright (e2e), MSW (network mocks)

Don't deviate from this stack without asking. If something here is wrong for the use case, surface it — don't silently swap.

---

## Project-specific rules

### R1 — Email data is never logged
Email bodies, subjects, attachments, addresses are PII. Never `console.log` them, never include in error traces, never send to AI providers without explicit user consent flow. Redact addresses to `<email>` in logs.
**Why:** Compliance + trust. One leaked log line ends this product.

### R2 — Provider abstraction is mandatory
Every email operation goes through `providers/EmailProvider` interface. Never call Gmail API or Graph API directly from UI components or business logic. New provider = implement interface, not patch call sites.
**Why:** Three providers, one UX. Direct coupling kills the universal promise.

### R3 — AI features are opt-in per account
User toggles AI per-mailbox in settings. Default OFF. If account has AI off, the AI buttons don't render — not "render and disable."
**Why:** Some employers ban LLM email processing. Don't force compliance breach.

### R4 — Token budget per AI feature
- Summary: 4,000 input + 300 output
- Reply draft: 6,000 input + 800 output
- Prioritization (batch): 8,000 input + 200 output
If budget would be exceeded, truncate input from oldest content, never silently drop the user-visible "from" address or subject.
**Why:** Cost control + predictable latency.

### R5 — Optimistic UI for everything
Archive, delete, mark read, send — all optimistic. Roll back with toast on failure. Never block UI on network for these.
**Why:** Email is muscle memory. 200ms feels broken.

### R6 — Tests verify intent, not just behavior
A test that says `expect(getInbox()).toHaveLength(10)` is useless if seeded data has 10 items. Tests must encode WHY: "unified inbox merges Gmail + IMAP and dedupes by Message-ID." If business logic could change without breaking the test, the test is wrong.
**Why:** Adapted from the 12-rule template (Rule 9). Shallow tests give false confidence.

### R7 — Checkpoint after each significant step
Multi-step tasks (refactor across providers, add new provider, ship a feature): after each step, state what's done, what's verified, what's left. Don't continue from a state you can't describe back.
**Why:** Adapted from 12-rule template (Rule 10). Long refactors silently drift otherwise.

### R8 — Fail loud, never silent
"Migration completed" is wrong if records were skipped. "Tests pass" is wrong if any were `skip`'d. "Provider connected" is wrong if scopes are partial. Default to surfacing uncertainty.
**Why:** Adapted from 12-rule template (Rule 12). Silent failures in email clients lose mail.

### R9 — UI never reaches across providers
A Gmail-specific feature (e.g. Gmail labels with colors) must degrade gracefully on IMAP/O365, not throw. Feature detection > hardcoded provider checks.
**Why:** Universal client. Gmail-only UI poisons the unified experience.

### R10 — Read before you write (especially in `providers/`)
Three provider implementations diverge fast. Before adding to one, read the equivalent in the other two. Match shape. If shape can't match, surface conflict — don't blend.
**Why:** Adapted from 12-rule template (Rule 8) + provider-specific failure mode.

---

## Test commands

```bash
pnpm test                  # vitest unit
pnpm test:e2e              # playwright
pnpm test:e2e:ui           # playwright with UI mode
pnpm typecheck             # tsc --noEmit
pnpm lint                  # eslint
pnpm build                 # next build (use this to catch SSR errors)
```

Run `pnpm typecheck && pnpm test && pnpm build` before claiming any task done.

---

## Slash commands available

Defined in `.claude/commands/`:
- `/devils-advocate` — Stress-test an architectural decision or feature scope
- `/brutal-editor` — Polish deliverable docs (CLAUDE.md, ARCHITECTURE.md, WORKFLOW.md)
- `/bullets-to-article` — Turn rough notes into a structured doc
- `/multi-source-synthesis` — Synthesize multiple sources (e.g. competitor research) into one brief

## Sub-agents available

Defined in `.claude/agents/`:
- `email-parser` — MIME parsing, threading, dedup, Message-ID logic
- `ui-designer` — Distinctive PWA UI; works inside `frontend-design` skill discipline
- `deploy-engineer` — Vercel deploy, env vars, preview URLs, prod promotions

## Skills used

Global skills (from `~/.claude/`) actively leveraged:
- `frontend-design` — Avoid generic AI UI aesthetic
- `webapp-testing` — Playwright-driven UI verification
- `vercel:*` — Deploy, env, storage, AI SDK, Next.js patterns

---

## Deliverables (Taj's assignment)

1. ✅ Private GitHub repo: `yarkn24/mailpilot`
2. ⏳ Live Vercel URL
3. ✅ CLAUDE.md (this file)
4. ⏳ `docs/ARCHITECTURE.md` (one-page)
5. ⏳ `docs/WORKFLOW.md` (multi-agent workflow writeup)
6. ✅ Agents/skills/hooks/plugins list (this file's sections above)

---

## When in doubt

Ask. Don't guess on:
- Provider API quirks (Gmail batch limits, Graph throttling, IMAP IDLE)
- AI prompt formatting that affects cost
- Anything touching PII handling
- Anything that ships to production without preview review

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
