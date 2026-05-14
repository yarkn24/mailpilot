# Voice — mailpilot's writing & design language

Every doc, every UI string, every agent definition in this repo follows this voice. If new copy doesn't match, rewrite it.

## The voice in one paragraph

Short, declarative, principled. State what is, not what *could be*. Don't hedge. Don't apologize. Don't decorate. If a sentence would be tighter without an adverb, cut the adverb. If a paragraph repeats the heading, cut the paragraph.

## The five rules

1. **Lead with the verb, not the qualifier.**
   ✗ "We aim to provide a way for users to..."
   ✓ "Connect a mailbox. Read it. Move on."

2. **One idea per sentence.**
   ✗ "Mailpilot connects Gmail, Microsoft 365, and IMAP providers, and gives users a unified inbox while also providing AI features like summarization and prioritization."
   ✓ "Three providers, one inbox. AI summarizes, drafts, prioritizes."

3. **Banned words.**
   `seamless`, `leverage`, `synergy`, `passionate`, `cutting-edge`, `solution`,
   `journey`, `unlock`, `empower`, `dynamic`, `revolutionary`, `next-generation`,
   `world-class`, `robust`, `streamline`, `optimize` (as a marketing verb),
   `delight` (as a noun for users).

4. **Numbers beat adjectives.**
   ✗ "fast response time"  →  ✓ "100ms or it didn't happen"
   ✗ "large mailboxes"  →  ✓ "50,000 messages, 2GB inbox"

5. **Failure modes, not features.**
   When introducing a new component (agent, route, doc), include a *"Failure modes you prevent"* section. Features are easy to claim. Failure modes are hard to fake.

## Section headers (use these for any "role" doc)

For agent / role / component definitions, use this skeleton in order:

```
## Your default state
## What you know
## How you operate
## What you refuse to do
## Failure modes you prevent
```

Skip a section only if it would be empty. Don't pad to fill it.

## Tone reference (canonical example)

The clearest example of this voice in the repo is [`.claude/agents/auditor.md`](../.claude/agents/auditor.md). Read it before writing new agent definitions. Match its rhythm: short opening line, declarative sub-bullets, no marketing softness, "what you refuse to do" as a serious section.

## Product UI applies the same rules

- Buttons say verbs: "Connect mailbox", "Archive", "Summarize". Never "Get started" or "Learn more".
- Empty states state the fact, not the feeling: "No messages." Not "You're all caught up — nothing to read!"
- Error messages say what went wrong and what the user can do — in that order. No "Oops!", no "Something went wrong."
- Loading states explain what's loading. "Fetching 47 messages" beats "Loading…".

## When you're tempted to break the voice

Ask: "would the auditor agent send this back?" If yes, rewrite.
