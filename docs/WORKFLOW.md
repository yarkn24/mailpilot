# Mailpilot — Multi-agent Claude Code workflow

How this codebase gets built with Claude Code as the development partner — terminal-first, mostly autonomous, with the operator in a review/approve loop.

## TL;DR for someone evaluating the workflow

- **3 autonomous Claude Code sessions** shipped the entire product. Each session: operator hands off a goal, walks away, comes back to a deployed live URL + a written end-of-session report.
- **8 sub-agents** spawn in parallel for independent work. Multi-agent orchestration is the default, not the exception.
- **`.specify/` (Spec Kit by GitHub) + `.agent-os/` (BuilderMethods Agent OS)** drive specs-driven development. Spec Kit owns engineering process; Agent OS owns product direction.
- **Skills** (`.claude/skills/` + the Superpowers plugin) — 14 Spec Kit skills + `/loop`, `/schedule`, `/to-issues`, `using-superpowers`, plus `frontend-design`, `webapp-testing`.
- **Hooks** (`.githooks/`) — `pre-commit` (typecheck + lint + tests + PII guardrail), `post-merge` (deps drift), `post-commit` (an **auditor** sub-agent reviews every diff and writes findings to `.git/suspicious-audit.log`). Self-improving by design.
- **CLI-first** — every commit, push, PR, and deploy executed via `gh` + `vercel` + `git`. Zero clicks in dashboards during autonomous sessions.
- **Spec Kit + Agent OS together** = the Boris-Cherny-style discipline of "spec → plan → tasks → implement" overlaid with product-shape thinking.

---

## The discipline stack

Three layers of guardrails, each catching a different failure mode:

1. **CLAUDE.md** — project-specific rules (PII handling, provider abstraction, token budgets, fail-loud). Tells Claude *what mistake never to make in this repo*.
2. **Sub-agents** — domain experts spawned per task. Tells Claude *who knows this area best*.
3. **Slash commands + Spec Kit skills + Agent OS instructions** — workflows that turn raw thought into shipped code. Tells Claude *how to move through the work*.

User instructions > CLAUDE.md > sub-agent prompts > default model behavior. Lower layers don't override higher ones.

---

## The agents (`.claude/agents/`)

Eight specialised sub-agents. Each one's system prompt is structured the same way:

```
Your default state — the agent's bias when uncertain
What you know       — domain facts the main agent might not have cached
How you operate     — the agent's decision procedure
What you refuse to do — guardrails (what the agent won't be talked into)
Failure modes you prevent — what would go wrong without this agent
```

| Agent | Owns | Spawned when |
|---|---|---|
| `email-parser` | MIME, threading, dedup, Message-ID, provider quirks (Gmail batch limits, Graph throttling, IMAP IDLE) | Any task touching `providers/` or thread/message processing |
| `ui-designer` | PWA UI, keyboard maps, mobile breakpoints, anti-generic-AI aesthetic | Any task touching `app/`, `components/`, or design decisions |
| `deploy-engineer` | Vercel deploys, env vars, OAuth redirect URIs, marketplace integrations | Any task touching deploy config, env, or production debug |
| `ai-engineer` | Prompt design, token budgets, model selection, redaction-before-inference | Anywhere AI is added or tuned |
| `security-engineer` | OAuth state, header injection, sandboxing, encryption at rest | Surface that touches secrets, user input, or auth |
| `qa-engineer` | Intent-verifying tests, coverage of edge cases, regression nets | Test authoring + review |
| `hacker-engineer` | Adversarial probes — prompt injection, header injection, type confusion, control chars | Reviewing AI + API surfaces for "can this be abused?" |
| `auditor` | Reviews every diff post-commit for suspicious patterns; writes to `.git/suspicious-audit.log` | Automatic, via `.githooks/post-commit` |

The **auditor** is the "self-improving" piece — every commit is scrutinised by a fresh agent that the main agent doesn't control. If something slipped through, it gets logged.

Spawned in parallel via a single message with multiple `Agent` tool calls when work is independent. Sequential when there's a data dependency.

---

## The slash commands (`.claude/commands/`)

Reusable thinking tools:

- **`/devils-advocate`** — Stress-test an architecture decision before locking it in. 4 attack dimensions, ends with a single-sentence kill argument.
- **`/brutal-editor`** — Polish deliverable docs (CLAUDE.md, ARCHITECTURE.md, this file). Cuts, weak ideas, missing parts, structure, biggest problem.
- **`/bullets-to-article`** — Rough notes → finished doc without losing or inventing ideas.
- **`/multi-source-synthesis`** — Competitor research across the modern email-client category → one differentiation brief.

These four cover the *thinking* gap that pure code-gen tools miss.

---

## The Spec Kit skills (`.claude/skills/speckit-*`)

[Spec Kit (github/spec-kit)](https://github.com/github/spec-kit) drives spec-driven development. Each feature follows this sequence:

```
/speckit-constitution      Define what this project never compromises on
        ↓
/speckit-specify           Write the spec — user-visible behavior, edge cases
        ↓
/speckit-clarify           (optional) Resolve ambiguity before planning
        ↓
/speckit-plan              Translate spec to implementation plan
        ↓
/speckit-checklist         (optional) Quality gate on the plan
        ↓
/speckit-tasks             Break plan into tasks
        ↓
/speckit-analyze           (optional) Cross-artifact consistency check
        ↓
/speckit-implement         Execute the tasks with verification
```

Plus git extension skills (`speckit-git-commit`, `speckit-git-feature`, `speckit-git-initialize`, `speckit-git-remote`, `speckit-git-validate`) for branch hygiene per feature.

---

## A typical feature loop

Goal: ship "AI thread summary" feature.

1. **`/speckit-specify`** — capture spec: user opens thread → clicks "Summarize" → 200-word summary in <2s → cached → respects AI opt-in.
2. **`/devils-advocate`** — stress test: what if the thread is 200 messages? Bilingual? Includes a confidential signature block? Token cost runaway?
3. **`/speckit-plan`** — implementation plan with token budgets, redaction layer, cache key strategy, error states.
4. **`/speckit-tasks`** — broken into: `[1] add capabilities() flag`, `[2] redaction utility`, `[3] AI route handler`, `[4] UI button + state`, `[5] cache layer`, `[6] e2e test`.
5. **Sub-agent dispatch:**
   - `email-parser` owns task 1, 2 (MIME extraction, redaction)
   - Inline (main agent) owns task 3, 5 (route handler, cache)
   - `ui-designer` owns task 4 (button placement, loading state, keyboard binding)
   - `deploy-engineer` reviews task 3 for env var / rate limit concerns
6. **`/speckit-implement`** — TDD pass per task. Tests written from spec, not from implementation.
7. **`/brutal-editor`** — pass over PR description before opening.
8. **`speckit-git-commit`** — conventional commit, single feature per PR.

---

## Quality gates (the "before claiming done" checklist)

Before any task is marked complete:

- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (intent-verifying tests, not seed-counting tests)
- [ ] `pnpm build` succeeds (catches SSR errors that `dev` mode hides)
- [ ] No `console.log` of email content / addresses / subjects
- [ ] Feature works on 360px viewport (mobile-first verification)
- [ ] Feature degrades gracefully when AI is opted out
- [ ] Provider feature degrades gracefully across all three adapters

If any item fails: **fail loud, don't ship**. Reported back as "blocked on X" — never as "done with caveats."

---

## What this workflow prevents

| Failure mode | Caught by |
|---|---|
| AI hallucinates a Gmail API field that doesn't exist | `email-parser` agent (knows real API surface) |
| New UI feature renders broken on IMAP accounts | `ui-designer` + R9 in CLAUDE.md (capabilities-based UI) |
| OAuth redirect URI mismatch in preview deploy | `deploy-engineer` (knows the silent killers) |
| Test passes but business logic was wrong | R6 in CLAUDE.md (tests verify intent) |
| Refactor across providers silently breaks one | R10 + checkpoint discipline (R7) |
| AI cost runaway from unbounded context | R4 token budgets + `/devils-advocate` review |
| Spec is ambiguous, two devs implement different things | `/speckit-clarify` + `/speckit-analyze` |

---

## Where the workflow doesn't go

- **Pure design exploration:** generic skills (`frontend-design`, `design-an-interface`) handle this — they aren't part of the per-feature loop.
- **One-off scripts / migrations:** use TDD skill directly; full Spec Kit ceremony is overkill.
- **Critical incidents:** `systematic-debugging` skill drives, not the spec workflow.

The point isn't to use every tool every time. It's that the *right* tool is reachable and named when needed.

---

## Autonomous execution mode

Three autonomous sessions built this entire product. Each session followed the same shape:

```
operator: <high-level goal for the session>
   ▼
Claude Code (main agent):
   • Reads CLAUDE.md + relevant .agent-os/ + .specify/ context
   • Breaks the goal into TodoWrite items (3–12 atomic tasks)
   • For each task:
       1. Plan: 2–3 alternative approaches, pick the best
       2. Backup: snapshot via git status / config copy
       3. Execute via Read/Edit/Write/Bash/Agent
       4. Verify: typecheck + build (and tests if not gated)
       5. Log: what was done, why, alternatives elided
   • For independent task groups: parallel sub-agents
   • On failure: real-time troubleshoot protocol (logs cause, retries, fails loud)
   • At session end: writes docs/SESSION_REPORT.md with
       A. Chronological actions
       B. Obstacles + how solved
       C. Things deliberately deferred (require operator)
       D. Rollback commands for every major action
       E. Suggested next steps
```

The operator's role: **set the goal, review the report, approve the next step.** No mid-task babysitting.

### What an autonomous session won't do without explicit approval

Anything irreversible at organisation scope:
- File deletion (logged for operator review instead)
- Force pushes
- External API calls with cost or side effects (sending email, posting public messages)
- Bypassing safety hooks (`--no-verify`, `--no-gpg-sign`)
- System-wide configuration changes

Everything else: the agent decides, executes, logs.

---

## Where this stack lines up with the broader AI-native engineering category

| Concept | This repo's instantiation |
|---|---|
| Boris-Cherny-style Claude Code workflows | Spec Kit + Agent OS + sub-agents + hooks all wired into the same project, not stitched together ad-hoc |
| `claude.md` discipline | [`CLAUDE.md`](../CLAUDE.md) project rules + inherited `~/.claude/CLAUDE.md` Karpathy rules |
| `design.md` / spec-driven development | [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) + [`.agent-os/product/mission.md`](../.agent-os/product/mission.md) + per-feature specs in [`.agent-os/specs/`](../.agent-os/specs/) |
| Skills architecture | 14 Spec Kit skills in `.claude/skills/`; global plugin skills (Superpowers, frontend-design, webapp-testing, Vercel) used as needed |
| Plugins | `Superpowers` (used: `using-superpowers`, `verification-before-completion`, `writing-skills`, etc.) · `vercel` · `playwright` · `chrome-devtools-mcp` · `exa` · `commit-commands` · `claude-md-management` |
| Self-improving agents | `auditor` post-commit hook reviewing every diff |
| Multi-agent orchestration | 8 sub-agents spawned in parallel when work is independent |
| Continuous autonomous execution | Goal-driven autonomous sessions; `/loop` and `ScheduleWakeup` patterns for cron-like re-entry |
| Terminal-first / CLI-first | `gh`, `vercel`, `git`, `npm`, `playwright` — all driven from `Bash` tool calls, never a dashboard |
| AI-driven SDLC | Commits, pushes, PRs, deploys all initiated by Claude; pre-commit hook runs the test suite as part of the workflow |
