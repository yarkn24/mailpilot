# Spec: Universal providers — Gmail, Microsoft 365, IMAP unified

**Date:** 2026-05-14
**Roadmap line:** Phase 2 — Universal providers
**Status:** in-progress (code shipped, OAuth creds pending operator)

## Why

The brief says "Gmail, Office 365, and IMAP (Yahoo, AOL) with a unified inbox."
Phase 1 shipped IMAP only. Phase 2 closes the universal promise.

## What

Every account — regardless of provider — appears in one inbox with one
switcher, one compose form, one Forward/Reply flow, and one set of AI actions.
The user never sees provider differences except as small capability hints
(Gmail labels vs. Graph categories vs. IMAP folders).

## Provider surface

| Provider | List | Read | Send | Archive | Trash | Search | Mark read |
|---|---|---|---|---|---|---|---|
| Gmail  | ✓ via `/messages?labelIds=INBOX` | `format=full` MIME walk | `messages/send` raw RFC822 | remove `INBOX` label | `/trash` | `?q=` | remove `UNREAD` label |
| Graph  | `/mailFolders/Inbox/messages` `$select` | `?$select=body` | `/sendMail` | `/move` to `archive` | `/move` to `deleteditems` | `?$search` | `PATCH isRead=true` |
| IMAP   | `imapflow` mailbox fetch | RFC822 split | nodemailer SMTP | MOVE w/ fallback | MOVE then `\Deleted` + expunge | SEARCH BODY | `\Seen` flag |

## API surface

- `lib/email/providers/{gmail,graph,imap}.ts` — three implementations of one shape.
- `lib/email/providers/index.ts` — single dispatch table; only place that
  switches on `account.provider`.
- `app/api/compose/route.ts` — dispatches through `provider.sendMessage` for
  Gmail/Graph; falls through to SMTP for IMAP.
- `app/api/inbox/route.ts` — fans out across all connected accounts via
  `provider.listInbox`; dedupes by canonical Message-ID; per-provider failure
  surfaces in `accounts[].error` without blanking the merged list.
- `app/api/oauth/{gmail,graph}/{start,callback}/route.ts` — Authorization Code
  + PKCE flows.

## Capability degradation (R9)

- Gmail labels render under `m.labels`; Graph categories and IMAP folders
  also live there. UI shows them as plain chips — no Gmail-specific color.
- Server-side search uses each provider's native query language internally
  but exposes a single `q` string upstream.
- Threading is server-side on Gmail (`threadId`) and Graph (`conversationId`);
  IMAP exposes thread IDs where available, otherwise fakes them as message
  IDs. UI must not assume threads exist.

## Test plan

- Unit (intent):
  - "dedupe: same Message-ID across providers collapses to one entry"
  - "redact: provider-specific delimiters do not break the regex"
- E2E:
  - Settings page renders all three Connect buttons.
  - Account switcher chips appear in inbox when ≥1 account connected.
  - Forward link prefixes subject with "Fwd: " and removes existing prefix.
- Adversarial:
  - Header injection on `to/cc/bcc/subject` rejected with 400 (covers Gmail
    raw RFC822 path).
  - `/api/oauth/gmail/start` without env returns 503, not 500.

## Out of scope

- Token refresh caching (Phase 3).
- Long-lived push subscriptions / IDLE (Phase 3, separate worker tier).
- Attachment download / upload (Phase 3).
- Multi-recipient `Reply All` heuristics — we currently set To from the
  original `From` only.
