# Agent OS instruction: create-spec

> Use when starting a new spec under `.agent-os/specs/`. Pairs with Spec Kit's
> `/speckit-specify`. The two are complementary — Agent OS provides the
> product-shape lens; Spec Kit provides the engineering-process lens.

## Template

```markdown
# Spec: <feature name>

**Date:** YYYY-MM-DD
**Roadmap line:** Phase N, deliverable "<title>"
**Status:** draft | in-progress | shipped

## Why
1-2 sentences tying back to mission.md.

## What
Single paragraph describing the user-visible change.

## Provider surface
| Provider | Behavior |
|---|---|
| Gmail | ... |
| Graph | ... |
| IMAP | ... |

## API surface
- Route added/changed: <path>
- Provider verb added/changed: <name>
- Shape changes: <list>

## Capability degradation (R9)
What happens on providers that don't support this feature?

## Test plan
- Unit (intent): <list>
- E2E: <list>
- Adversarial: <list>

## Out of scope
Explicit list.
```

## Where to file

`.agent-os/specs/YYYY-MM-DD-<short-slug>.md` — newest first.
