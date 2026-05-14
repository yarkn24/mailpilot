# Spec: Multi-vendor AI provider (Gemini + Anthropic)

**Date:** 2026-05-14
**Roadmap line:** Phase 1 — AI; Phase 4 — AI polish (model agnosticism is the first step)
**Status:** in-progress

## Why

The AI features (summary, draft, prioritize) shouldn't be hardcoded to a
single vendor. Free-tier Gemini lets a reviewer try the live AI path without
the operator paying for an Anthropic key; Anthropic remains the quality
fallback. This makes the product **AI-first** without being **single-vendor**.

## What

A `lib/ai/provider.ts` module exposes one shape (`AIProvider.generate`) and
picks between Gemini and Anthropic based on which env key is present. Three
API routes (`/api/summarize`, `/api/draft`, `/api/prioritize`) call this
shape only — they never import vendor SDKs directly.

## Surface

- Selection priority: `GEMINI_API_KEY` → Gemini, else `ANTHROPIC_API_KEY` →
  Anthropic, else `null` → stub.
- Tier mapping:
  - `"fast"` → `gemini-2.5-flash` / `claude-haiku-4-5`
  - `"quality"` → `gemini-2.5-pro` / `claude-sonnet-4-6`
- Response includes `vendor` so the UI can label which model answered.
- Token budgets unchanged from CLAUDE.md R4.
- Redaction (`redactForAI`) still runs **before** the model boundary,
  regardless of vendor.

## Capability degradation (R9)

Gemini and Anthropic have slightly different shapes:
- Gemini supports `responseMimeType: "application/json"` for strict JSON.
  Anthropic relies on prompt-level instruction. The `prioritize` route uses
  the hint when available and post-processes either way (strips ` ```json `
  fences).
- Both support system instructions; the provider module abstracts the
  difference.
- Cache control is Anthropic-specific; we don't expose it via the unified
  shape. Gemini's caching API is separate and not needed yet for these
  small prompts.

## Test plan

- Unit (intent):
  - "provider selection: GEMINI_API_KEY wins over ANTHROPIC_API_KEY"
  - "provider selection: neither key → null (stub path)"
  - "AITier → model name mapping is correct per vendor"
- Integration (E2E):
  - `/api/summarize` with `GEMINI_API_KEY` returns `vendor: "gemini"`.
  - `/api/summarize` without either key returns stub with `vendor: "none"`.

## Out of scope

- Streaming responses — both vendors support it; not wired into the UI yet.
- Image inputs for AI — out of email-only scope.
- Model fine-tuning — never; we are a client.
