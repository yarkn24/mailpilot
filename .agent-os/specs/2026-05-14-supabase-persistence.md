# Spec: Supabase persistence + at-rest encryption

**Date:** 2026-05-14
**Roadmap line:** Phase 3 — Production-grade state
**Status:** in-progress (code shipped, Supabase project setup pending operator)

## Why

The in-memory account store on Vercel serverless vanishes across cold starts.
A user who connects IMAP, closes the tab, and comes back finds the account
gone. Persistence is the unblock for a "FULLY working" deploy.

## What

A dual-backend `lib/email/store.ts`:
- If `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` + `MAILPILOT_ENCRYPTION_KEY`
  set → Supabase Postgres with AES-256-GCM at-rest encryption of secrets.
- Else → in-memory fallback. Zero-config dev experience preserved.

Schema lives in [`lib/db/schema.sql`](../../lib/db/schema.sql) — operator runs
it once in Supabase SQL Editor after creating the project.

## Threat model

- **Stolen DB dump**: encrypted secrets are useless without
  `MAILPILOT_ENCRYPTION_KEY` (server-side env).
- **Stolen `SUPABASE_SERVICE_ROLE_KEY`**: attacker can read row metadata but
  cannot decrypt passwords/refresh tokens without the encryption key.
- **Stolen encryption key only**: attacker needs DB access too; the key alone
  does nothing.

This is the standard "encrypted blob in DB, key in env" pattern — the same
trade-off Vault, AWS KMS, and Stripe use for similar data.

## Schema

```sql
sessions(id text pk, created_at, last_seen_at)
accounts(
  id text pk,
  session_id text fk → sessions,
  provider check ('gmail' | 'graph' | 'imap'),
  email, display_name,
  imap_host, imap_port, imap_user, imap_password_encrypted,
  smtp_host, smtp_port,
  oauth_refresh_token_encrypted,
  ai_consent boolean default false,
  added_at
)
```

RLS enabled. Server side bypasses with SERVICE_ROLE; anon key sees nothing.

## API surface change

All four store functions become `async`:
- `listAccounts(sid)` → `Promise<Account[]>`
- `getAccount(sid, id)` → `Promise<Account | undefined>`
- `addAccount(sid, account)` → `Promise<Account>`
- `removeAccount(sid, id)` → `Promise<boolean>`

All 8 callers updated in this push.

## Test plan

- Unit (intent):
  - "encryption: round-trip of an OAuth refresh token recovers the same string"
  - "encryption: tampered ciphertext fails auth tag check"
  - "store: addAccount without encryption key throws when Supabase enabled"
- Integration:
  - Add an IMAP account, reset the Vercel function, list accounts — returns
    the same account.
- Adversarial:
  - DB dump shows only ciphertext, never plaintext password.

## Out of scope

- Multi-region replication (Supabase free tier is single region — fine).
- User accounts / Supabase Auth — current model is anonymous session
  cookie. Phase 4 may bind to a logged-in user.
- Encryption key rotation — Phase 3.5.
