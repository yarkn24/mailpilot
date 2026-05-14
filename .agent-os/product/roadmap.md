# Mailpilot — Roadmap

> Agent OS roadmap format: phases × deliverables, not dates.

## Phase 0 — Scaffold (shipped)

- [x] Next.js 16 App Router + Tailwind v4 + TS strict
- [x] PWA manifest + service worker
- [x] CLAUDE.md project rules + 8 sub-agents + 4 slash commands
- [x] Spec Kit (`.specify/`) + Agent OS (`.agent-os/`) installed
- [x] 3 git hooks: pre-commit (typecheck+lint+test+PII), post-merge, post-commit auditor

## Phase 1 — IMAP MVP (shipped)

- [x] IMAP connect/list/read/archive/trash/mark-read/search via ImapFlow
- [x] SMTP send via Nodemailer
- [x] Unified inbox merge across multiple IMAP accounts
- [x] AI summarise / draft reply / prioritise endpoints (Claude Haiku + Sonnet)
- [x] PII redaction layer before any model call
- [x] Per-account AI opt-in (default OFF)

## Phase 2 — Universal providers (in flight)

- [x] Gmail OAuth + Gmail REST adapter (list/read/send/archive/trash/search)
- [x] Microsoft Graph OAuth + Graph REST adapter (same operations)
- [x] Provider abstraction = single dispatch layer
- [x] Compose route uses native send for Gmail/Graph; SMTP for IMAP
- [x] Unified inbox merges Gmail + Graph + IMAP through the same adapter API
- [x] Account switcher chips in inbox header
- [x] Forward + Reply All UI flows
- [ ] Gmail/Graph credentials installed in Vercel env (operator step)

## Phase 3 — Production-grade state

- [ ] Persistent account store (Neon Postgres + per-user KEK encryption)
- [ ] Long-lived sync tier (IMAP IDLE, Gmail watch, Graph subscriptions) in a
      separate stateful worker — Vercel serverless cannot host this
- [ ] Token refresh cache (currently we refresh every call)
- [ ] Attachment download + upload
- [ ] Full RFC 822 parsing via `mailparser`

## Phase 4 — AI polish

- [ ] Streaming summaries (token-by-token UI)
- [ ] Thread-level prioritisation (currently per-message)
- [ ] User-defined rules ("flag anything from billing@*")
- [ ] On-device PII redaction via WebAssembly (no model boundary at all)

## Explicit non-goals — see [`product/mission.md`](mission.md)
