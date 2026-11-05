# Delegation through Herdr

Herdr (TUI) is the default transport; this package does not require pi-subagents. These instructions are shared by research, review, architecture exploration and implementation coordination.

Herdr keeps each delegated session in its own pane on a background server, so it survives the coordinator's terminal closing. `scripts/herdr-delegate.mjs` from this package launches those sessions and writes a **run record** of what actually ran. Herdr and the helper move sessions; they do not choose work, judge results or enforce this policy.

## Preflight and launch

1. Read the project's `docs/agents/delegation.md`. Check the actual host: `herdr status server` shows `status: running`, `herdr integration status` shows the integrations for the harnesses in the role table, and each harness lists the configured model (`pi --list-models <pattern>`; for Claude Code, a signed-in CLI). Use `herdr --help`, `herdr <command> --help` and `node <package>/scripts/herdr-delegate.mjs` for syntax; do not invent flags. Missing delegation blocks delegated work, not planning.
2. Run the coordinator inside a Herdr pane (or set `HERDR_SESSION` to the project's named session), so its `herdr` and helper commands reach the same server.
3. Select the role row in `delegation.md`. Pass the role brief from this package's `agents/` directory as a file: `--brief <absolute path>`. Herdr does not load these files; they are portable prompts, not provider configuration. Put the task (spec, ticket, base/head, allowed actions, completion contract) in its own file and pass `--task`.
4. Launch a **fresh** session, never a continuation of the implementer's conversation:
   - Implementation and research: `--mode interactive`. The helper creates the workspace (`--cwd`) or the per-ticket worktree and branch (`--worktree --repo --branch --base <immutable SHA>`), runs `herdr agent start --kind <harness>`, and submits the brief and task paths. A human can attach with `herdr agent attach <name>`.
   - Code and design review, exploration and evidence audit: `--mode batch`. The harness runs non-interactively (`pi -p --mode json`, `claude -p --output-format json`) in its own pane, and the helper writes the final answer to `--output`. The report never depends on reading the screen.
   - Put the model and the permissions after `--`, using the harness's own flags from the role row (for example `--model <provider/id>` and `--tools read,grep,find,ls` for Pi; `--model <id>`, `--tools Read,Grep,Glob` and `--permission-mode dontAsk` for Claude Code). Tool flags limit the session; prompt restrictions alone are not a sandbox. The Pi flags are checked live; the Claude Code batch flags are not yet (see Limits).
   - Where files go. The record (`--record`) goes outside the delegated checkout, or in a Git-ignored path inside it such as `.scratch/`, so the checkout stays clean. Code review, exploration and evidence-audit output follows the same rule. Design-review reports may be tracked files inside the repository (`docs/designs/reviews/…`), because `design-check` reads them from there. Research and implementation write their own artifacts. The helper refuses any other location, and refuses a record or output that already exists.
   - Use one run name per launch (Herdr agent names: a lowercase letter first, `[a-z0-9_-]`, at most 32 characters).
   - **Time limit.** Every batch run has one: `--timeout-ms` (default 30 minutes). On expiry the helper kills the harness and everything it started, and records `failed` with `failureReason: timeout`. Interactive sessions have no exit status to limit; bound them with `herdr agent wait <name> --until done --timeout <ms>` and stop the session when the wait fails.
   - **Worktree setup.** Pass the project's setup command from `docs/agents/testing.md` as `--setup "<command>"` (for example `npm ci`). It runs in the new checkout before the harness starts, with `--setup-timeout-ms` (default 10 minutes) and a log next to the record. If it fails, the harness is not started and the record says `failed` with `setup` or `setup-timeout`.
   - **Run resources.** `--ports N` finds N ports that are free at launch and passes them, with the run ID, as `MP_RUN_ID`, `MP_RUN_PORT` and `MP_RUN_PORT_1…N` to the setup command and to a batch harness; an interactive session receives them in its first prompt. The ports are not reserved: anything shared beyond a port still needs the lease that the [testing policy](TESTING.md#environment-ownership) describes.

   A complete batch launch, for the Spec axis of a code review (paths are examples):

   ```bash
   node "$MP_SKILLS/scripts/herdr-delegate.mjs" launch \
     --record "$PROJECT/.scratch/import/runs/spec-a2.json" \
     --role spec-review --name spec-a2 --harness claude --mode batch \
     --brief "$MP_SKILLS/agents/mp-review-spec.md" \
     --task "$PROJECT/.scratch/import/runs/spec-a2.task.md" \
     --output "$PROJECT/.scratch/import/runs/spec-a2.report.md" \
     --cwd "$CANDIDATE_WORKTREE" \
     -- --model claude-sonnet-5-5 --tools Read,Grep,Glob --permission-mode dontAsk
   ```

   ```bash
   node "$MP_SKILLS/scripts/herdr-delegate.mjs" inspect \
     "$PROJECT/.scratch/import/runs/spec-a2.json" --expect-model anthropic/claude-sonnet-5-5
   ```

   Here the record and report sit in the original project's ignored `.scratch/`, outside the candidate worktree. For a worker, use `--mode interactive --worktree --repo "$PROJECT" --branch ticket/a --base <integration SHA>` instead of `--cwd`, add the project's worktree setup and ports (for example `--setup "npm ci" --ports 1`), and use the Implementation row's arguments. The review run above uses the default 30-minute limit; add `--timeout-ms` to change it.
5. Record the run ID (`<herdr session>:<name>:<terminal id>` in the run record), host, worktree, role, harness and the arguments. Then verify the **effective** model: `herdr-delegate.mjs inspect <record> --expect-model <provider/model>`. It reads the model from the harness's own session file (interactive) or output stream (batch) and fails on a mismatch or an unknown model. The expected value is `provider/id`. For Pi it is the same as `--model`. For Claude Code the helper reports `anthropic/<id>`, so `--model claude-sonnet-5-5` is checked as `--expect-model anthropic/claude-sonnet-5-5`. Run `inspect <record>` without `--expect-model` to see the exact value. A role name, a configured argument or a worker's own statement is not verification. If inspection fails, mark independence unverified and block the review gate.
6. Research needs source search and retrieval (or direct local primary-source access for a local-only question), not specific tool names. Reviewers need read access to the target and supplied artifacts only; they never edit the candidate or run tests. The coordinator runs verification.
7. Observe completion. Interactive: `herdr agent wait <name> --until done` (do not wait for `idle`: a session that has not started yet is idle), then collect the allocated artifact. Batch: the record's `status` becomes `completed`, or `failed` with the exit code and a `failureReason` (`timeout`, `exit`, `unparsable`, `aborted`, `harness-error`, `empty`, `setup`, `setup-timeout`). If `inspect` reports `live.status: stale`, the run is still marked running past its limit: its process was lost (for example in a server restart), so treat it as failed. A finished process is not a passing review. Failed, cancelled, timed-out or missing output stays explicitly unresolved. Stop duplicate or stale sessions (`herdr agent list`, `herdr workspace close`) before retrying.
8. After a coordinator restart, reconcile from the run records and `herdr agent list` / `herdr pane list`: the same terminal ID is the same session. A record whose session is gone stays unresolved; do not relaunch a claimed ticket merely because the coordinator restarted.

## Independence

The project's role mapping records a **model family** (for example Claude, DeepSeek or GPT) separately from the harness (Claude Code, Pi). Both review axes must use a family different from every implementation worker that contributed to their target. The axes may use the same review family in separate fresh sessions. Never silently substitute the implementation model when a reviewer is unavailable. Derive the family from the inspected effective model, not from the harness.

Research may run concurrently. Implementation may run concurrently only in separate worktrees with safe runtime resources. A single coordinator owns tracker updates and integration merges. Workers do not recursively dispatch review or change tracker status.

## Limits

- **Verified live** with herdr 0.9.5 and pi 1.4.0 on Windows: batch Pi review (effective model read from the stream), interactive Pi worker in a new worktree, the path guards, a batch time limit that killed the run and left no orphan process, a worktree setup command receiving `MP_RUN_ID` and two free ports, a failing setup that stopped the launch, and a failed Claude Code run reported as `failed`. **Not yet verified live:** a successful Claude Code batch run (its `--tools`/`--permission-mode` behavior in print mode and `modelUsage` reading are covered by unit tests only), an interactive Claude Code session, and `herdr --remote` from another machine. Run the one-child check in the manual for each harness before relying on it.
- `inspect --expect-model` passes only when **every** model the run reports matches. Claude Code's `modelUsage` can list more than one model if the CLI calls a smaller model for auxiliary work, and then the check fails even though the review model was correct. This has not been observed yet; it is listed because the Claude batch path is unverified. If it happens, record the reported models and treat independence as unverified. Do not weaken the check. Report it so the helper can learn to tell the main model from auxiliary ones.
- After `herdr server stop` or a reboot, sessions stop. Herdr restores the layout; an interactive session resumes only when its harness integration is installed (`herdr integration install pi`, `herdr integration install claude`). A batch run that was interrupted stays `running` in its record until `inspect` reports it `stale`; treat it as failed and relaunch under a new name.
- On Windows, Git Bash rewrites a leading `/` in arguments passed to native programs. The helper is unaffected; when typing `herdr agent prompt` by hand in Git Bash, set `MSYS_NO_PATHCONV=1`.
- A project-scope Pi install may not reach a worker's worktree (Herdr puts them under `~/.herdr/worktrees/`): an npm or git install lives in the untracked `.pi/npm/` tree, and a path install is recorded in `.pi/settings.json` relative to `.pi/`, so it resolves elsewhere from the worktree. Give workers this package's skill files by absolute path, or install the package at user scope; check in the worker's first output that the files were read.

## Sources

- https://herdr.dev/tui/docs/agent-automation/
- https://herdr.dev/tui/docs/cli-reference/
- https://herdr.dev/tui/docs/integrations/

The installed Herdr version defines the transport CLI. This document defines workflow requirements, not a compatibility promise; the helper was checked against herdr 0.9.5 and pi 1.4.0.
