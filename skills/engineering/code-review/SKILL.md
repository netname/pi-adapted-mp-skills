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

Two-axis review of the diff between `HEAD` and a fixed point the user supplies:

- **Standards**: does the code conform to this repo's documented coding standards?
- **Spec**: does the code faithfully implement the originating issue / spec?

Each axis runs in its own **fresh, isolated context**: the `mp-review-standards` child and the
`mp-review-spec` child are dispatched concurrently so they don't pollute each other's context.
This skill keeps their findings separate and synthesizes only after both have returned.

The issue tracker should have been provided to you. If `docs/agents/issue-tracker.md` is missing, tell the user to run `/skill:setup-matt-pocock-skills`.

Before dispatching anything, confirm the `subagent` tool is available to you (it is registered by
the `pi-subagents` extension; `pi list --approve` shows the package). If it is missing, stop and
print:

```
pi install npm:pi-subagents
```

## Process

### 1. Pin the fixed point

Whatever the user said is the fixed point (a commit SHA, branch name, tag, `main`, `HEAD~5`, etc.). If they didn't specify one, ask for it.

Confirm the fixed point resolves (`git rev-parse <fixed-point>`) and the diff is non-empty before dispatching. A bad ref or empty diff should fail here, not inside two sub-agents.

### 2. Identify the spec source

Look for the originating spec, in this order:

1. Issue references in the commit messages (`#123`, `Closes #45`, GitLab `!67`, etc.), fetched via the workflow in `docs/agents/issue-tracker.md`.
2. A path the user passed as an argument.
3. A spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature.
4. If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** child is skipped and the final report says so.

### 3. Capture the review target as files

The review children are read-only — they have `read`, `grep`, `find`, and `ls`, and no shell — so
they cannot run `git` themselves. Capture the target once with `bash`, into files both children can
`read`:

```bash
mkdir -p .scratch/reviews
git diff <fixed-point>...HEAD > .scratch/reviews/<slug>-diff.patch
git log <fixed-point>..HEAD --oneline > .scratch/reviews/<slug>-commits.txt
```

`<fixed-point>` is the ref you pinned in step 1 and `<slug>` is a short name for this review (the
branch or ticket). Pass both repo-relative paths to both children. `.scratch/` is git-ignored by
setup's default (D5), so these files never enter shared history.

### 4. Dispatch both axes, concurrently and in fresh contexts

Dispatch the two children in one concurrent launch, each with a **fresh context**, and **do not
synthesize anything until both have returned**:

- **`mp-review-standards`** — the Standards axis.
- **`mp-review-spec`** — the Spec axis.

The bundled `pi-subagents` skill owns the dispatch mechanics (how a concurrent batch is launched,
run identity, cancellation). Do not restate them here. Both children are read-only by their own
tool ceiling; do not widen it.

Give both children the diff path and the commit-list path from step 3. Give the Spec child the spec
source from step 2 as well. If step 2 found no spec, do **not** launch `mp-review-spec`, and say in
the final report that the Spec axis was skipped for lack of a spec.

The two axes are fixed by this skill: Standards and Spec, nothing else. The children already carry
their own briefs — including the Standards axis's smell baseline — so do not paraphrase them into
the task prompts.

**If an axis fails, aborts, or times out, report it as not completed, with the reason.** Never drop
a missing axis silently and never synthesize a verdict over one; an axis that did not run is a
result to state, not an absence to hide.

### 5. Aggregate

Present the two reports under `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings, because the two axes are deliberately separate (see _Why two axes_).

End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes: that's the reranking the separation exists to prevent. If an axis was skipped or did not complete, say so in that line.

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
