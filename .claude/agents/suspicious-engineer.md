---
name: suspicious-engineer
description: DEPRECATED — renamed to `auditor`. See .claude/agents/auditor.md. This file kept temporarily for backward compatibility; will be removed in a follow-up.
tools: Read, Grep, Glob, Bash
---

This agent was renamed. See [auditor.md](./auditor.md).

The behavior is unchanged: audits every commit via `.githooks/post-commit`,
doubts everything, raises HIGH/MED/LOW concerns without blocking. The new
name is shorter and more honest about the role (audit, not just suspicion).
