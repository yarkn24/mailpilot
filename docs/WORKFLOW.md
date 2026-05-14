# Mailpilot — Multi-agent Claude Code workflow

How this codebase gets built with Claude Code as the development partner.

---

## The discipline stack

Three layers of guardrails, each catching a different failure mode:

1. **CLAUDE.md** — project-specific rules (PII handling, provider abstraction, token budgets, fail-loud). Tells Claude *what mistake never to make in this repo*.
2. **Sub-agents** — domain experts spawned per task. Tells Claude *who knows this area best*.
3. **Slash commands + Spec Kit skills** — workflows that turn raw thought into shipped code. Tells Claude *how to move through the work*.

User instructions > CLAUDE.md > sub-agent prompts > default model behavior. Lower layers don't override higher ones.

---

## The agents

| Agent | Owns | Spawned when |
|---|---|---|
| `email-parser` | MIME, threading, dedup, Message-ID, provider quirks (Gmail batch limits, Graph throttling, IMAP IDLE) | Any task touching `providers/` or thread/message processing |
| `ui-designer` | PWA UI, keyboard maps, mobile breakpoints, anti-generic-AI aesthetic | Any task touching `app/`, `components/`, or design decisions |
| `deploy-engineer` | Vercel deploys, env vars, OAuth redirect URIs, marketplace integrations | Any task touching deploy config, env, or production debug |

Each agent's system prompt encodes the failure modes it prevents — not just what it knows, but what it *stops Claude from doing wrong*.

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
