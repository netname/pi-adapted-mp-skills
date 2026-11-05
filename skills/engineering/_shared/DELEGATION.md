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
   - Put the model and the permissions after `--`, using the harness's own flags from the role row (for example `--model <provider/id>` and `--tools read,grep,find,ls` for Pi; `--model <id>`, `--tools Read,Grep,Glob` and `--permission-mode dontAsk` for Claude Code). Tool flags limit the session; prompt restrictions alone are not a sandbox.
   - Keep the record (`--record`) and review output outside the delegated worktree; the helper refuses otherwise. Use one run name per launch (Herdr agent names: a lowercase letter first, `[a-z0-9_-]`, at most 32 characters).
5. Record the run ID (`<herdr session>:<name>:<terminal id>` in the run record), host, worktree, role, harness and the arguments. Then verify the **effective** model: `herdr-delegate.mjs inspect <record> --expect-model <provider/model>`. It reads the model from the harness's own session file (interactive) or output stream (batch) and fails on a mismatch or an unknown model. A role name, a configured argument or a worker's own statement is not verification. If inspection fails, mark independence unverified and block the review gate.
6. Research needs source search and retrieval (or direct local primary-source access for a local-only question), not specific tool names. Reviewers need read access to the target and supplied artifacts only; they never edit the candidate or run tests. The coordinator runs verification.
7. Observe completion. Interactive: `herdr agent wait <name> --until done` (do not wait for `idle`: a session that has not started yet is idle), then collect the allocated artifact. Batch: the record's `status` becomes `completed` or `failed` with the exit code. A finished process is not a passing review. Failed, cancelled, timed-out or missing output stays explicitly unresolved. Stop duplicate or stale sessions (`herdr agent list`, `herdr workspace close`) before retrying.
8. After a coordinator restart, reconcile from the run records and `herdr agent list` / `herdr pane list`: the same terminal ID is the same session. A record whose session is gone stays unresolved; do not relaunch a claimed ticket merely because the coordinator restarted.

## Independence

The project's role mapping records a **model family** (for example Claude, DeepSeek or GPT) separately from the harness (Claude Code, Pi). Both review axes must use a family different from every implementation worker that contributed to their target. The axes may use the same review family in separate fresh sessions. Never silently substitute the implementation model when a reviewer is unavailable. Derive the family from the inspected effective model, not from the harness.

Research may run concurrently. Implementation may run concurrently only in separate worktrees with safe runtime resources. A single coordinator owns tracker updates and integration merges. Workers do not recursively dispatch review or change tracker status.

## Limits

- After `herdr server stop` or a reboot, sessions stop. Herdr restores the layout; an interactive session resumes only when its harness integration is installed (`herdr integration install pi`, `herdr integration install claude`). A batch run that was interrupted stays `running` in its record; treat it as failed and relaunch under a new name.
- On Windows, Git Bash rewrites a leading `/` in arguments passed to native programs. The helper is unaffected; when typing `herdr agent prompt` by hand in Git Bash, set `MSYS_NO_PATHCONV=1`.
- A project-scope Pi install may not reach a worker's worktree (Herdr puts them under `~/.herdr/worktrees/`): an npm or git install lives in the untracked `.pi/npm/` tree, and a path install is recorded in `.pi/settings.json` relative to `.pi/`, so it resolves elsewhere from the worktree. Give workers this package's skill files by absolute path, or install the package at user scope; check in the worker's first output that the files were read.

## Sources

- https://herdr.dev/tui/docs/agent-automation/
- https://herdr.dev/tui/docs/cli-reference/
- https://herdr.dev/tui/docs/integrations/

The installed Herdr version defines the transport CLI. This document defines workflow requirements, not a compatibility promise; the helper was checked against herdr 0.9.5 and pi 1.4.0.
