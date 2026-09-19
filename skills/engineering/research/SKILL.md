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

Dispatch one detached `mp-researcher` child to do the research, so you keep working while it reads.

This skill runs through `pi-subagents`, so before launching, confirm the `subagent` tool is
available (registered by the `pi-subagents` extension; `pi list --approve` shows it). If it is
missing, stop and print:

```
pi install npm:pi-subagents
```

Then confirm the child's web tools are registered: `web_search`, `fetch_content`,
`get_search_content`, and `source_check` (from `pi-web-access`). If any is missing, stop and print:

```
pi install npm:pi-web-access
```

A missing tool is a setup failure, not permission to do the research yourself or to weaken the
citation guarantee.

Then:

1. Give the child the question in the asker's own terms, and give it a **unique, explicit output
   path** for its note (for example `.scratch/research/<name>.md`) through the `subagent` call's
   `output:` field, so two concurrent children can never pick the same file.
2. Launch it detached (`async: true`) with a fresh, isolated context, and save its run identity.
3. Collect its result before the question is considered answered: read the returned note (the run
   reports where its `output:` artifact landed — a relative path may be routed under `pi-subagents`'
   managed artifact storage) and persist it to the repo path you chose.
4. A child that fails, is refused, is abandoned, or is still running leaves the question
   **unresolved and visible**. Report it as not completed, with the reason, and never fill the gap
   with uncited prose.
5. Answer with the child's findings, naming where the cited note was saved.

The child investigates **primary sources** (official docs, source code, specs, first-party APIs),
follows every claim back to the source that owns it, and writes a single cited Markdown file. That
output contract lives in `mp-researcher`; the dispatch mechanics (fresh vs. fork, run identity,
steering, cancellation) belong to the bundled `pi-subagents` skill.
