---
name: code-review
description: "Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes: Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to \"review since X\"."
license: MIT
metadata:
  upstream: mattpocock/skills
  upstream-commit: c55ee46073ed923f86ce59a5eb3b6d895095d1b7
  upstream-path: skills/engineering/code-review
  invocation: model
  adapted-for: pi
---

Read `../_shared/ARCHITECTURE.md` and the accepted design/ADRs linked by the ticket. Supply them to both existing review axes: Spec checks requirement coverage, Standards checks accepted boundaries and decisions. Flag material deviations for design review; do not add a redundant third code-review axis.

Review a **committed, clean candidate** on two independent axes: Standards and Spec. Read `../_shared/DELEGATION.md` for transport and model independence. Dirty work-in-progress is not supported by this gate: commit the intended candidate first; do not silently omit staged, unstaged or untracked files.

## Capture

Use the supplied base and head; if the base is unknown, establish it before review. Identify the originating spec from the supplied ticket, commit references or explicit spec path. Do not infer requirements. A user-authorized standalone review without a spec may skip that axis visibly; coordinated implementation requires its spec.

Run the package's helper (replace PACKAGE and paths):

```bash
node PACKAGE/scripts/review-target.mjs --repo /absolute/worktree --base BASE --head HEAD
```

It rejects dirty worktrees and a head that differs from the checkout, resolves immutable SHAs, captures the merge-base diff and commit list, and returns an external temporary artifact directory with a manifest. An empty diff is not a successful review. Keep the candidate worktree frozen until both reviews finish; the coordinator is its sole writer.

## Dispatch

Launch two fresh Paseo sessions concurrently with the complete role briefs from this package's `agents/mp-review-standards.md` and `agents/mp-review-spec.md`. Supply the manifest, diff, commit list, exact candidate source, relevant project standards and spec. Explicitly include project instructions; do not rely on harness auto-discovery. Copy artifacts and verify revisions if using another host.

Both reviewers must use a model family different from every implementing worker in this target. Verify effective session settings before accepting results. Configure read-only permissions where supported, and instruct reviewers not to edit or run tests. If the host cannot enforce read-only access, record that limitation and check the candidate for mutations before accepting findings.

## Collect and refresh

Report Standards and Spec separately, preserving each finding's evidence/severity without reranking across axes. Optional smell suggestions are nonblocking unless they expose a concrete defect or violate a documented requirement. Missing, failed or timed-out axes remain incomplete; never synthesize a pass over them.

The coordinator checks HEAD and clean status again before accepting the report. Associate findings and disposition with the manifest's base/head. Every code fix or integration merge changes the target and invalidates approval: commit, rerun relevant verification, capture again and refresh review of the new candidate. Close only when required checks and both applicable axes pass. Archive artifacts in the project's evidence store before removing the temporary directory.
