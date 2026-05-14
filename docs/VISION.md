# Mailpilot — Vision & Roadmap

## Why this exists

Email is the last unlovable productivity tool. Every other surface — calendar, docs, chat, code — has had its AI moment. Email has had spam filters and an autocomplete that suggests "Best,". The hard part isn't the AI; it's that "email" is three completely different transport layers (SMTP/IMAP, Gmail API, Microsoft Graph) pretending to be one thing.

Mailpilot is built on a single bet: **you can ship a universal client that doesn't feel like the lowest common denominator if you treat the provider boundary as the first abstraction, not the last.**

## The product loops

Three loops drive every design decision:

### 1. The trust loop
- AI is **opt-in per mailbox**, default OFF
- Email content goes through a **redaction layer** before any LLM call
- Bodies are **never stored** long-term — metadata only
- Tokens encrypted at rest with per-user KEKs
- Open-source the privacy posture

Without this loop, the AI features are non-starters at any company with a half-serious legal team.

### 2. The speed loop
- Optimistic UI for every mutation — archive, delete, mark read, send
- Keyboard-first; mouse is a fallback
- 100ms response time as a hard contract
- Server Components for shell; client only when interactivity needs it
- Mobile-first responsive — 360px is the design target, not the afterthought

Email is muscle memory. 200ms feels broken.

### 3. The fan-in loop
- One inbox across Gmail, Microsoft 365, and any IMAP host (Yahoo, AOL, Fastmail, custom)
- Per-provider features (Gmail labels, M365 categories) **surfaced via capability detection**, not blended into a fake unified model
- Search fans out in parallel; results merged with provider-aware ranking
- "Share to Mailpilot" via PWA share_target — capture inbound from other apps

## Year 1 milestones

| Quarter | Theme | Concrete |
|---|---|---|
| Q3 2026 | **Connect & read** | Gmail + IMAP adapters, unified inbox, threading, search, keyboard nav |
| Q4 2026 | **Write & send** | Composer, drafts (server-side), reply/forward, scheduled send, undo send |
| Q1 2027 | **AI-first** | Thread summary, reply draft (tone-matched), priority bands, smart triage |
| Q2 2027 | **Microsoft 365** | Graph adapter, M365 sign-in, calendar surface (read-only proximity context) |
| Q3 2027 | **Power user** | Plugins/extensions surface, custom commands, AI memory across threads |

## What we're explicitly **not** building

- **Native iOS/Android apps** — PWA covers 90% of the value at 10% of the cost. Native ships in year 2 if the PWA isn't enough.
- **Email server / sending infrastructure** — we use provider-native send paths (Gmail API, Graph, SMTP via provider) to keep DKIM/DMARC alignment trivial.
- **Calendar / tasks / notes** — explicitly out of scope. Email-only. Saying no is a feature.
- **Generic AI chat in the sidebar** — the AI shows up where it has a job (summarize, draft, prioritize), not as a wandering assistant.
- **Cross-tenant message storage** — bodies live at the provider. We index metadata. This is a constraint, not a limitation.

## Defaults that won't change

These are the constitution — if any of these flip, the product breaks in a way we won't ship through:

1. **AI opt-in default OFF.** Every account, every feature.
2. **No long-term body storage.** Cache only; fetch from provider on demand.
3. **Redaction before LLM.** No exception, no flag to disable.
4. **PWA-first.** Whatever ships, ships to the web first.
5. **Provider abstraction.** No Gmail-shaped code leaking into UI or business logic.
