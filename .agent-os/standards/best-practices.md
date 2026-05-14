# Best practices — Mailpilot

> Agent OS standards. These compound with `code-style.md` and CLAUDE.md.

## Security

- Sandboxed iframe for every HTML email body (`sandbox=""`, `referrerPolicy="no-referrer"`).
- Header-injection defense in `/api/compose`: reject `\r` / `\n` in any header.
- OAuth state is single-use, 5-minute TTL, bound to session cookie.
- PKCE on every OAuth flow (Gmail and Graph).
- No secrets in client bundles. `loadConfig()` lives in route handlers only.

## Performance

- Inbox merge fans out with `Promise.allSettled` so one slow provider can't
  block the whole inbox.
- Server-side dedupe runs once per request, not in the client.
- Account switcher filters client-side from the already-fetched list — no
  network on tab change.
- Service worker caches the app shell; messages are always fresh.

## AI cost discipline

- Summary: 4,000 input / 300 output tokens.
- Reply draft: 6,000 / 800.
- Prioritisation batch: 8,000 / 200.
- Truncate from oldest content if budget would be exceeded; never silently
  drop the user-visible "From" or "Subject".

## Provider portability

- Capability flags drive UI: `serverSideThreading`, `serverSideSearch`,
  `labels: "gmail" | "categories" | "folders"`, `push`.
- A Gmail-only feature degrades gracefully on IMAP/M365 (R9) — never throws.

## Tests as documentation

- Each unit test name encodes WHY, not WHAT. Example:
  "dedupe: collapses two providers reporting the same Message-ID into one".
- Adversarial probes (PII leak attempts, prompt injection, header injection)
  live as their own files so reviewers can audit them quickly.
