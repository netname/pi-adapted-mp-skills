---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
license: MIT
metadata:
  upstream: mattpocock/skills
  upstream-commit: c55ee46073ed923f86ce59a5eb3b6d895095d1b7
  upstream-path: skills/engineering/implement
  invocation: user
  adapted-for: pi
---

This skill reviews through a `pi-subagents` child, so first confirm the `subagent` tool is available
(registered by the `pi-subagents` extension; `pi list --approve` shows it). If it is missing, stop
and print:

```
pi install npm:pi-subagents
```

Then continue.

Implement the work described by the user in the spec or tickets.

Use the `tdd` skill where possible, at pre-agreed seams: from this skill's directory, read `../tdd/SKILL.md` and follow it.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use the `code-review` skill to review the work: from this skill's directory, read `../code-review/SKILL.md` and follow it.

Commit your work to the current branch.
