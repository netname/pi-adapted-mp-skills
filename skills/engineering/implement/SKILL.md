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

Implement one ticket in the assigned worktree. Read `../_shared/TESTING.md` and the project's testing contract. Use `../tdd/SKILL.md` at approved seams.

1. Read the ticket, spec, project instructions and assigned immutable base. Confirm this worktree is clean and based on the coordinator's integration revision. Never reset or discard someone else's work.
2. Implement the scoped change with focused Fast checks. Do not edit the tracker or merge another worker's branch.
3. Commit the candidate, run Verify change against that revision, and return base/head SHAs, implementation model family, commands, exits, logs, environment ID and remaining issues. A failed required check means blocked, not done.
4. In coordinated mode, stop here: the coordinator owns review, integration and closure. Do not dispatch duplicate reviews.
5. When invoked standalone, act as your own coordinator after committing: read `../code-review/SKILL.md`, arrange independent reviewers through Paseo, fix blocking findings, commit and verify the new candidate, then refresh the affected reviews. Report the final revision and any incomplete axis. Never imply a merge happened unless it did.
