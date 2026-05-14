# Code style — Mailpilot

> Agent OS standards file. Loaded by every agent operating on this repo.

## Universal

- TypeScript strict; no `any` (use `unknown` + narrowing).
- No file-scope `let` mutable state in modules — use closures or maps with
  comment justifying lifetime.
- Comments live on the line above the code, never alongside. One line max
  unless documenting a non-obvious invariant.
- Imports: built-ins, then external, then `@/` internal. Sort alphabetically
  within groups.
- Filenames: `kebab-case.ts` for libs, `PascalCase.tsx` for React components,
  `route.ts` for App Router endpoints.

## React

- Server Components by default; `"use client"` only for components that need
  browser APIs or React state.
- Forms post directly to API routes (no Server Actions yet — keeps mental model
  flat while we still have three providers diverging).
- Optimistic UI for archive/delete/markRead/send (R5 in CLAUDE.md).

## Email-domain rules

- **Never** `console.log` email content, addresses, subjects, headers. Redact
  to `<email>` if logging is unavoidable.
- Every provider call goes through `lib/email/providers/index.ts`. No direct
  Gmail/Graph fetches from UI or API routes.
- Per-account state always keyed by `accountId`, never by email address — the
  same address can exist on multiple providers.

## AI

- Token budgets enforced in code, not just docs. See CLAUDE.md R4.
- Redact PII before model boundary. The redaction layer lives in
  `lib/ai/redact.ts` and is tested under concurrent load.
- Model IDs pinned at module scope, never read from env or guessed at runtime.

## Tests

- Vitest unit tests test **intent**, not just outputs (R6). A test that says
  "10 items returned" is a lint failure if the seeded data has 10 items.
- Playwright E2E tests record video (`video: 'on'`) so failures can be replayed.
- Adversarial tests live in `tests/e2e/hacker-*.spec.ts`.

## Errors

- Fail loud (R8). Silent fallbacks belong in `eslintignore`, not codebases.
- Provider errors degrade gracefully at the inbox merge layer — one provider
  failing must not blank the entire list.
