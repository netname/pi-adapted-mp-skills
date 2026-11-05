# Small change: the shortest route the workflow allows

Use this page when a change fits **one ticket and one implementation session**. It lists the minimum the package's policy still requires, why each step is there, and the order to run them. It does not remove any gate: it shows the lightest form of each one. For anything larger, follow the [workflow](WORKFLOW.md).

## Does your change qualify?

All of these must be true. If one is not, use the full route.

| Check | Why it matters |
| --- | --- |
| One ticket, one session, no dependent tickets | Coordination (claims, serial integration) is what makes multi-ticket work safe; a single ticket does not need it |
| No new or changed boundary, ownership, external contract, persistence, deployment or significant quality constraint | This is the **lightweight** design route in the [architecture policy](../skills/engineering/_shared/ARCHITECTURE.md#scope-and-authority); anything else needs the full route |
| The behavior can be stated as one or a few requirements with examples | A reviewer can only check the change against something written down |
| Your role rows give the implementer and the code reviewers **different model families** | Independent review is required for every candidate, however small |

The package defines **no exemption** — not for documentation, refactors or one-line fixes. If your project wants one (for example "documentation-only edits follow the normal PR process"), the project owner writes it in `docs/agents/architecture.md`. Agents never infer an exemption from missing configuration.

## The route at a glance

| Step | You run | It produces | Why it is still needed |
| --- | --- | --- | --- |
| 1 Clarify | `/skill:grill-with-docs` | Agreed behavior and any glossary/ADR update | Ambiguity is cheapest to fix before code exists |
| 2 Record | `/skill:to-spec` (or add the requirement to an existing spec) | A requirement ID with examples and exclusions | Design, tests and reviews point at this ID |
| 3 Design note | `/skill:design-solution`, lightweight scope | A short `docs/designs/<feature>.md` | Shows what changes and what does not, before anyone edits code |
| 4 Design review | `/skill:review-design` | Two short reports (comprehension, challenge) | A fresh reader catches what the author cannot see |
| 5 Accept | Your message, recorded; `design-check` if configured | Readiness record | Implementation starts only from an accepted, unchanged design |
| 6 Implement | `/skill:implement <ticket>`, standalone | A committed candidate on its own branch, with test evidence | Test-first work at the agreed seam; an exact revision to review |
| 7 Code review | Reviews arranged by `implement` through Herdr | Spec and Standards reports for that exact revision | Independent review by another model family |
| 8 Deliver | `/skill:pr`, then CI and your project's merge rules | A PR with summary, evidence and merge danger | The repository's own gates decide the merge |

Steps 3–5 are short for a small change: a design note of a few paragraphs, two batch review runs that read only that note and the spec, and one sentence of acceptance.

## Before the first small change (once per project)

1. Install the package at user scope and run `/skill:setup-matt-pocock-skills` ([manual](MANUAL.md#configure-each-software-project)).
2. In `docs/agents/delegation.md`, fill the role rows. The implementer and both code-review rows must use different model families.
3. In `docs/agents/testing.md`, fill the Fast and Verify change commands and the worktree setup command.
4. Check one batch review run with `herdr-delegate.mjs inspect --expect-model` ([manual](MANUAL.md#test-one-delegated-child)). Until that passes, the review gate is unverified.

## Step by step

### 1–2. Clarify and record the behavior

In a Pi session in the project:

```text
/skill:grill-with-docs I want the import command to print how many rows it skipped.
```

Answer the questions it asks; it records agreed terms and decisions. Then record the behavior with a stable ID:

```text
/skill:to-spec Record the agreed skipped-rows message as a requirement with an example and exclusions.
```

If the project already has a spec for this feature, add the requirement there instead of creating a second spec.

### 3. Write a lightweight design note

```text
/skill:design-solution Lightweight scope: the import command's existing output boundary does not change.
```

The note should contain, briefly:

- one change reference (C1) with current behavior, proposed behavior and a concrete output example;
- the affected requirement IDs and the components it touches;
- the decisions it reuses, and why no sequence diagram is needed (or one small Mermaid diagram if order or failure handling matters);
- the checks that will prove it (which tests at which seam).

If writing the note reveals a changed boundary or contract, stop: the change is not small.

### 4–5. Review the design and accept it

```text
/skill:review-design Lightweight design docs/designs/import-skipped-rows.md for requirement IMP-7.
```

The coordinator (your planning session) launches two fresh batch reviews through Herdr, checks their effective models and shows you the findings. Resolve any blocker, then accept in your own words — for example: "I accept the reviewed design for IMP-7." If the project's `architecture.md` configures a readiness record, the session completes it and runs `design-check`; it must report `ready: true`.

### 6–7. Implement and get independent review

Start a **fresh** implementation session on its own branch from the accepted baseline, with the role row's implementation model:

```text
/skill:implement Ticket: requirement IMP-7 and docs/designs/import-skipped-rows.md (accepted at <SHA>).
Standalone mode: work on branch ticket/imp-7, test first at the agreed seam, commit,
run Verify change, then arrange the Spec and Standards reviews through Herdr with
the code-review role rows. Fix blocking findings and refresh the reviews.
```

In standalone mode the session commits, runs the Verify change checks, then launches both review axes through Herdr. Every fix creates a new candidate and needs fresh reviews of that revision. Done means: both axes pass on the final SHA, and Verify change passed on that SHA.

### 8. Deliver

```text
/skill:pr
```

Open the PR with that body. CI and your repository's branch protection remain the merge gate; a passing workflow report is not merge authorization.

## Common mistakes

| Mistake | Why it is a problem | Do instead |
| --- | --- | --- |
| Implementing in the planning conversation | The design reviewers and code reviewers must not share the author's reasoning, and the implementer should start from the written artifacts | Start a fresh session for step 6 |
| Reviewing with the implementer's model family | Same-family review repeats the same blind spots | Fix the role rows; check with `inspect --expect-model` |
| Reviewing uncommitted work | The review then describes nothing anyone can reproduce | Commit first; the review helper refuses dirty work |
| Skipping the design note "because it is small" | No exemption exists; small changes still break things | Write the few-paragraph note; it takes minutes |
| Treating "tests pass" as "done" | Tests prove the selected cases, not that the requirement is met | Both review axes and Verify change on the same SHA |
| Growing the change mid-way | A larger change needs the full route's planning | Stop, record the new scope, and choose the route again |

## Related

- [Workflow stages and gates](WORKFLOW.md#stages-owners-and-completion-conditions) — the reference for every stage.
- [Architecture policy: lightweight and full routes](../skills/engineering/_shared/ARCHITECTURE.md#scope-and-authority).
- [Delegation through Herdr](../skills/engineering/_shared/DELEGATION.md) — how the review runs are launched and checked.
- [Testing policy](../skills/engineering/_shared/TESTING.md) — Fast, Verify change and Verify candidate.
