---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
disable-model-invocation: true
license: MIT
metadata:
  upstream: mattpocock/skills
  upstream-commit: c55ee46073ed923f86ce59a5eb3b6d895095d1b7
  upstream-path: skills/productivity/handoff
  invocation: user
  adapted-for: pi
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save it inside the repo at `.scratch/handoffs/<ISO-timestamp>-<short-slug>.md` (create the directory if needed) rather than in the OS temporary directory, then print the file's absolute path so the user can hand it to the next session.

The handoff is **git-ignored by default**: it is a one-session briefing, not shared documentation. Check `.gitignore` and, if `.scratch/handoffs/` is not already covered, add that pattern (create `.gitignore` if there isn't one) as part of the same change. A repo may deliberately opt in to committing handoffs, but committing is never the default and must never happen by accident.

Include a "suggested skills" section in the document, naming the skills the next agent should run, each as a `/skill:<name>` label.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
