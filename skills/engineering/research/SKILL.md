---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
license: MIT
metadata:
  upstream: mattpocock/skills
  upstream-commit: c55ee46073ed923f86ce59a5eb3b6d895095d1b7
  upstream-path: skills/engineering/research
  invocation: model
  adapted-for: pi
---

Read `../_shared/DELEGATION.md`. Launch one fresh background researcher through Paseo with the complete `agents/mp-researcher.md` brief from this package, the question, primary-source access and a unique absolute output path in its assigned workspace. Claim the ticket before dispatch.

Keep the run ID and collect the cited note before treating the question as answered. Persist and link the result where the tracker can retrieve it; a temporary path on another host is not a durable context pointer. The coordinator serializes ticket/map writes and any commits. Research workers write only their allocated artifact.

Missing source capabilities, a failed run or missing output leaves the question explicitly unresolved. Never substitute uncited prose. Preserve the brief's bounded research, direct-evidence versus inference distinction, contradictions and open questions.
