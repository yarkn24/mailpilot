# Agent OS — Mailpilot

> [buildermethods/agent-os](https://github.com/buildermethods/agent-os)
> methodology applied to this repo. Sits alongside Spec Kit (`.specify/`):
>
> - **Agent OS** owns the *product* layer — mission, roadmap, standards,
>   instructions for agents.
> - **Spec Kit** owns the *engineering process* layer — specs, plans, tasks,
>   constitution.

## Layout

```
.agent-os/
├── product/
│   ├── mission.md       # Why this exists
│   ├── roadmap.md       # Phases × deliverables (not dates)
│   └── tech-stack.md    # Locked stack with rationale
├── standards/
│   ├── code-style.md    # TS, React, email-domain rules
│   └── best-practices.md# Security, performance, AI cost, R9 degradation
├── instructions/
│   ├── plan-product.md  # Pre-feature scoping
│   └── create-spec.md   # Spec template
└── specs/
    └── YYYY-MM-DD-*.md  # Per-feature specs, newest first
```

## How agents use this

Every sub-agent in `.claude/agents/` reads:

1. CLAUDE.md (project rules)
2. `.agent-os/product/mission.md` (intent)
3. `.agent-os/standards/code-style.md` + `best-practices.md` (HOW)
4. The relevant `.agent-os/specs/*.md` for the feature in flight

Before writing code, an agent runs through
[`instructions/plan-product.md`](instructions/plan-product.md) to confirm the
feature is roadmap-aligned and provider-aware.

## Why both Agent OS and Spec Kit

The brief asked for "Agent OS methodology" AND "specs-driven dev." Agent OS
is the product-direction framework; Spec Kit is the spec-authoring framework.
They overlap but don't duplicate — Spec Kit's `specs/` are formal artefacts
fed into `/speckit-implement`; Agent OS's `specs/` are product-shape notes
for human review.
