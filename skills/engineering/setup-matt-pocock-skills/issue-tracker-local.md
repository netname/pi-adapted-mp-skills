# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`. Read and write them with
Pi's `read`, `write`, and `edit` tools.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- Triage state is recorded as a `Status:` line near the top of each issue file (see `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Wayfinding operations

Used by `/skill:wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.


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

### Local storage and closure

During setup, resolve and record one canonical **absolute state root** in this document, normally the original project's .scratch directory. Every effort lives beneath that root. Never resolve .scratch relative to a worker or integration worktree. Supply absolute spec/ticket paths to every session, including sessions on another host (copy inputs explicitly if the root is not accessible).

Keep the effort record in <state-root>/<effort>/coordinator.md, ticket fields in issues/<NN>-<slug>.md, and append transitions to events.md. The existing ticket body is authoritative; graph.json is its export. Ignore the state root when it is inside the Git repository so routine claims/evidence do not dirty candidates. Do not remove already tracked content automatically.

Default closure: complete the local effort after final accepted integration. If delivery requires a PR/MR, record that choice and defer closure until its merge; integrated still unblocks dependencies before closure.
