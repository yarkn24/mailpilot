# Used Skills and Techniques

A live log of every Claude Code skill, sub-agent, slash command, prompt pattern, and engineering technique invoked while building mailpilot. Updated continuously.

---

## Claude Code agents (sub-agents)

Defined in [`.claude/agents/`](../.claude/agents) and invoked via the Agent tool during this build:

| Agent | Defined in | Owns |
|---|---|---|
| `email-parser` | [.claude/agents/email-parser.md](../.claude/agents/email-parser.md) | MIME parsing, threading, dedup, Message-ID logic, provider quirks (Gmail batch, Graph throttling, IMAP IDLE) |
| `ui-designer` | [.claude/agents/ui-designer.md](../.claude/agents/ui-designer.md) | PWA UI, keyboard maps, mobile breakpoints, anti-generic-AI aesthetic |
| `deploy-engineer` | [.claude/agents/deploy-engineer.md](../.claude/agents/deploy-engineer.md) | Vercel deploys, env vars, OAuth redirect URIs, marketplace integrations |

These three are dispatched as a **swarm**: when a task touches a domain, the matching agent owns that slice. The main agent coordinates and integrates.

---

## Slash commands (custom)

Defined in [`.claude/commands/`](../.claude/commands):

| Command | Purpose |
|---|---|
| `/devils-advocate` | Stress-test an architecture decision or feature scope. 4 attack dimensions; ends with a single-sentence kill argument. |
| `/brutal-editor` | Polish deliverable docs ruthlessly. Cuts, weak ideas, missing parts, structure, biggest problem. |
| `/bullets-to-article` | Turn rough notes into structured docs without inventing ideas. |
| `/multi-source-synthesis` | Synthesize multiple sources (e.g. competitor research) into one conflict-resolved brief. |

---

## Spec Kit skills (from `github/spec-kit` v0.5+)

Installed via `uvx --from git+https://github.com/github/spec-kit.git specify init --here --integration claude --force`. Skills live in [`.claude/skills/`](../.claude/skills):

**Spec-driven dev pipeline:**
- `/speckit-constitution` — Project principles
- `/speckit-specify` — Behavior spec
- `/speckit-clarify` — Ambiguity resolution
- `/speckit-plan` — Implementation plan
- `/speckit-checklist` — Quality gate
- `/speckit-tasks` — Actionable task breakdown
- `/speckit-analyze` — Cross-artifact consistency
- `/speckit-implement` — Execute with verification

**Git hygiene extension:**
- `speckit-git-initialize`, `speckit-git-feature`, `speckit-git-commit`, `speckit-git-remote`, `speckit-git-validate`, `speckit-taskstoissues`

Constitution template + plan/spec/tasks templates installed under [`.specify/`](../.specify).

---

## Global Claude Code skills leveraged

From the user's `~/.claude/` (Anthropic-official + community plugins):

| Skill | Where used |
|---|---|
| `superpowers:using-superpowers` | Session bootstrap — invoked at start to surface available skills |
| `superpowers:brainstorming` | Implicit framing for the build (intent → requirements → design before code) |
| `superpowers:writing-plans` | Multi-step plan written before scaffolding |
| `superpowers:executing-plans` | Plan executed step-by-step with verification |
| `superpowers:verification-before-completion` | `next build` run locally before each push; live URL `curl`-tested |
| `superpowers:subagent-driven-development` | Three sub-agents defined for parallel-when-needed dispatch |
| `superpowers:test-driven-development` | Tests encode intent, not just behavior (CLAUDE.md R6) |
| `superpowers:systematic-debugging` | (Reserved — used when a real bug surfaces) |
| `vercel:nextjs` | Next.js 16 App Router patterns (Server Components, typed routes) |
| `vercel:deployments-cicd` | Vercel CLI deploy flow, prod promotion |
| `vercel:env-vars` | `.env.example` design, public vs. secret separation |
| `vercel:ai-sdk` | AI SDK integration plan (Claude Haiku for summaries, Sonnet for drafts) |
| `vercel:vercel-firewall` | Future hardening (rate-limit AI endpoints) |
| `frontend-design` | Anti-generic-AI-aesthetic landing page (distinct from gradient-hero template) |
| `webapp-testing` | Playwright e2e in CLAUDE.md test script |
| `claude-api` | AI cost guardrails: token budgets (R4 in CLAUDE.md), prompt caching plan |
| `git-guardrails-claude-code` | (Reserved — would add hook to block `git push --force` etc.) |
| `setup-pre-commit` | Used pattern (Husky-style) for the custom `.githooks/pre-commit` |

---

## Engineering techniques

### Architecture
- **Provider abstraction (Strategy pattern):** `EmailProvider` interface with three adapters (Gmail / Graph / IMAP). UI never sees provider-specific code. Capabilities flag for graceful degradation.
- **Server Components first, client only when needed:** Reduces JS payload; landing page is fully static.
- **Optimistic UI with rollback:** Mutations apply locally, sync to server, rollback toast on failure.
- **Token-vault separation:** App-user auth (Clerk) decoupled from mailbox OAuth tokens (encrypted in Postgres with per-user KEK).
- **AI redaction layer:** Email addresses → `<email>` token before any LLM call. Bodies never logged.

### Spec-driven development
- Constitution → spec → plan → tasks → implement, with optional clarify/checklist/analyze gates.
- Cross-artifact consistency check before implementation (`/speckit-analyze`).
- Tasks-to-issues conversion for parallelizable work (`/speckit-taskstoissues`).

### Discipline
- **Karpathy's 4 + 5 project rules:** Global CLAUDE.md (Think Before / Simplicity / Surgical / Goal-Driven) + 10 project-specific (PII, provider abstraction, AI opt-in, token budgets, optimistic UI, intent-tests, checkpoint, fail-loud, capability-based UI, read-before-write).
- **Fail loud, not silent:** "Completed" / "passed" only after concrete verification — applies to every claim in this repo.
- **Verify-before-approve:** Edit tool "success" message is not enough — Read after Write to confirm content; `curl` after deploy to confirm URL.

### PWA
- App shell precache via service worker.
- Web Share Target API (`share_target` in manifest) — receive shared content from other apps to compose mail.
- Standalone display mode; theme-color split for light/dark.

### Security
- Strict CSP-ready response headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` disabling camera/mic/geo).
- Service-Worker-Allowed scoped to root.
- `.env*` excluded; `.vercel/` excluded; only `.env.example` tracked.

### Quality gates
- `next build` (not `next dev`) used as the success criterion — catches SSR errors `dev` mode hides.
- Git pre-commit hook runs typecheck + lint + tests before allowing commit.

---

## What was **deliberately skipped** (and why)

- **Husky** — `.githooks/` + `core.hooksPath` is simpler, no extra dep.
- **Tailwind config file** — Tailwind v4 inlines theme in CSS; no JS config needed.
- **next-pwa plugin** — manual SW gives precise control; the plugin's defaults are a black box.
- **Full Gmail/Graph/IMAP adapters** — out of scope for the scaffold milestone; interfaces are defined and documented, implementation deferred to feature branches via Spec Kit.
- **Database migrations** — no real DB calls yet; schema lives in plan docs until first auth flow lands.

---

## Skills inventory snapshot (this session's start)

For traceability. The full list of available skills at session start is preserved in [`.specify/snapshots/skills-2026-05-14.md`](../.specify/snapshots/skills-2026-05-14.md) (created next).
