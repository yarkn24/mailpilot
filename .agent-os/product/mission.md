# Mailpilot — Mission

> An AI-first universal email client that lives in a browser.

## Pitch

Mailpilot is a mobile-ready PWA email client that unifies Gmail, Microsoft 365,
and any IMAP mailbox (Yahoo, AOL, iCloud, custom) into one inbox — and adds
opt-in AI for summarisation, reply drafting, and prioritisation without forcing
the user into a single AI vendor or scope creep.

## Users

- People juggling 2+ inboxes across providers (personal Gmail + work M365 + a
  legacy Yahoo, etc.).
- Privacy-aware users who want AI features they can switch OFF per mailbox.
- Mobile-primary users who want a single PWA, no app-store gauntlet.

## Pain it removes

1. Three apps for three providers.
2. AI features that ship as opt-OUT and sit at the provider layer.
3. Native mobile clients that don't unify Gmail labels with M365 categories
   with IMAP folders.

## Non-goals (deliberate)

- Calendar, contacts, tasks, chat — email only.
- Server-side ML/training on user mail.
- Long-lived IMAP IDLE / Gmail watch / Graph subscriptions in the serverless
  tier (lives in a separate stateful worker — see VISION.md).
- A native iOS/Android app — PWA covers the brief.
- A new AI model — we are a client to existing models.

## Success signals

- Time-to-first-useful-summary < 3 seconds on a typical thread.
- Account switching feels instant; no perceptible network round-trip.
- A user can fully manage all three providers without leaving the app.
- AI features have verbs as labels, never adjectives (no "✨ AI" sparkles).
