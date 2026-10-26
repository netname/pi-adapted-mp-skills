# Delegation through Paseo

Paseo is the default transport; this package does not require pi-subagents. These instructions are shared by research, review, architecture exploration and implementation coordination.

## Preflight and launch

1. Read the project's `docs/agents/delegation.md`. Discover the running host's actual tools, providers, models and saved profiles. Use Paseo's installed orchestration skill/tool schemas or `paseo --help`; do not invent CLI flags or MCP parameters.
2. Paseo tool injection is off by default: enable it under Settings → host → Agents, then start/reload the session. The CLI is an alternative when available. Missing delegation blocks delegated work, not planning.
3. Select the configured role profile. Pass the role brief from this package's `agents/` directory as task context explicitly: Paseo does not automatically load these files. They are portable prompts, not provider configuration.
4. Launch a **fresh** session, not a fork of the implementer's conversation. Supply the task/spec, relevant project instructions, absolute worktree path, immutable base/head where applicable, allowed actions, explicit output location, and completion contract.
5. Record run ID, host, worktree, profile, effective provider/model and model family. Inspect the actual launched session settings. A profile name or worker's assertion alone is not verification. If unavailable, mark independence unverified and block the review gate.
6. Research needs source search and retrieval (or direct local primary-source access for a local-only question), not specific tool names. Reviewers need read access to the target and supplied artifacts. Configure provider permissions where supported; prompt restrictions alone are not a sandbox. Reviewers never edit the candidate or run tests. The coordinator runs verification.
7. Observe completion through Paseo; collect the persisted artifact and terminal status. A finished process is not a passing review. Failed, cancelled, timed-out or missing output stays explicitly unresolved. Stop duplicate/stale workers before retrying.

## Independence

The project's role mapping records a **model family** (for example Claude, DeepSeek or GPT) separately from the harness (Claude Code, Pi, Codex). Both review axes must use a family different from every implementation worker that contributed to their target. The axes may use the same review family in separate fresh sessions. Never silently substitute the implementation model when a reviewer is unavailable.

Research may run concurrently. Implementation may run concurrently only in separate worktrees with safe runtime resources. A single coordinator owns tracker updates and integration merges. Workers do not recursively dispatch review or change tracker status.

## Sources

- https://paseo.sh/docs/orchestration
- https://paseo.sh/docs/agent-profiles
- https://paseo.sh/docs/orchestration-workflows

The installed Paseo version defines the transport API. This document defines workflow requirements, not an SDK compatibility promise.
