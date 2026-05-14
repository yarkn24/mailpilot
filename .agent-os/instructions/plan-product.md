# Agent OS instruction: plan-product

> Run this before scoping a new feature. Lives alongside Spec Kit's
> `/speckit-plan` so the two methodologies cohere.

## Steps

1. Re-read [`product/mission.md`](../product/mission.md) and
   [`product/roadmap.md`](../product/roadmap.md). If the feature isn't on the
   roadmap, ask whether to add it before designing.
2. Identify the **provider surface** it touches (Gmail / Graph / IMAP / all).
3. Check `lib/email/providers/index.ts` — does the dispatch layer need a new
   verb, or does this fit an existing one?
4. Identify the **AI surface**: does this use one of the three pinned models?
   If new, document budget in CLAUDE.md R4.
5. Write a one-screen plan in `.agent-os/specs/YYYY-MM-DD-<slug>.md` covering:
   - Why (link to roadmap line)
   - What (single paragraph)
   - Interfaces touched
   - Capability degradation across providers (R9)
   - Test plan (intent-first, not output-first)
6. Hand off to `/speckit-specify` for the formal spec, then `/speckit-tasks`
   for the implementation TODOs.

## Failure modes to prevent

- Adding a provider-specific feature without thinking through R9 degradation.
- Adding AI without an opt-in toggle (violates R3).
- Skipping the redaction layer because "the input looked clean."
- Logging email content because "it's just dev."
