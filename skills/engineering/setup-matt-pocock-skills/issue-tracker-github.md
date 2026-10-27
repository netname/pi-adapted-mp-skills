# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations, run
through Pi's `bash` tool.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v`; `gh` does this automatically when run inside a clone.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/skill:triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Wayfinding operations

Used by `/skill:wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (`gh api` on the sub-issues endpoint). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only, the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`, the session's first write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.


## Implementation coordination (separate from Wayfinding)

Wayfinding resolves planning questions. Implementation uses the states below; an issue being closed or a planning question being resolved does not establish verified integration.

Only one coordinator writes execution state for an effort. Record its run ID, host, integration branch and starting SHA, concurrency limit and repair budget in the effort record before dispatch. This is a single-writer ownership record, not an atomic lock. On restart, inspect live sessions and reconcile saved runs before launching replacements; unknown ownership blocks dispatch.

For each implementation ticket, retain these fields in a marked Implementation state section. Keep triage labels/Status separate from Execution status; the graph export maps Execution status to its status field:

| Field | Meaning |
| --- | --- |
| Execution status | ready, running, review, blocked, integrated |
| Blocked by | Stable implementation ticket IDs |
| Claim | Active Paseo run ID, or empty when unclaimed |
| Candidate | Host, branch, absolute worktree path, immutable base/head and implementation model families |
| Verification | Profile, command, environment ID, exit code and durable log/manifest references |
| Reviews | Separate Spec and Standards outcomes, effective model settings, base/head and persisted reports |
| Integration | Resulting integrated SHA and combined verification/review evidence |
| History | Timestamped transitions, failures, cancelled runs and repair attempts; append rather than erase |

A ticket becomes integrated only after the coordinator verifies the resulting revision and its evidence. Only this status unblocks dependents. ready means dependency eligibility, not authorization to skip required scope, design or test gates. Clear a claim only after its run is finished/cancelled and the outcome is recorded.

Export graph.json for scripts/frontier.mjs from these authoritative records. The export is disposable, never a second tracker; include verified=true and integratedSha only after checking actual Git and evidence. Do not infer verified=true from an issue's closed state. Retain evidence and reachable commits before removing worktrees. Preserve records across restarts and back up local state.

### Remote storage and closure

Use a parent effort issue for the coordinator record and a marked Implementation state section in each child issue's body for current fields. Append evidence and transition history as comments. Assignments/labels are UI aids, not locks or substitutes for these fields. Store large logs in a durable CI/artifact store and link them with immutable revision identifiers.

Keep implementation issues open until the delivery PR merges. Native blocker counts based on open issues can therefore remain nonzero after a blocker is integrated. For implementation dispatch, consult recorded dependencies and verified integrated states; the Wayfinding closed-issue query above is not the implementation frontier. On merge, close the delivered tickets according to project policy. Record a different lifecycle explicitly if the project requires one.
