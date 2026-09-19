---
name: git-guardrails
description: Set up guardrails that block dangerous git commands (push, reset --hard, clean, branch -D, etc.) before they run. Use when the user wants to prevent destructive git operations, add git safety guardrails, or block git push/reset.
license: MIT
metadata:
  upstream: mattpocock/skills
  upstream-commit: c55ee46073ed923f86ce59a5eb3b6d895095d1b7
  upstream-path: skills/misc/git-guardrails-claude-code
  invocation: model
  adapted-for: pi
---

# Set Up Git Guardrails

The guardrail ships with this package as a Pi extension: `extensions/git-guardrails.ts`. It hooks `tool_call`, and a `bash` call whose command matches a dangerous-git pattern is blocked before it executes, with the reason returned to you. Nothing else is affected.

The extension is inert until the user opts in, so installing this package never changes anyone's git behaviour by surprise. Opting in is writing one small JSON file; the guardrail then applies in that scope. The config file is re-read on every `bash` call, so an opt-in, an `"enabled": false`, or a `patterns` change takes effect immediately; the default pattern list in the sidecar is read once when the session loads, so editing *that* file needs a new session or `/reload`.

## What gets blocked

- `git push` (all variants, including `--force`)
- `git reset --hard`
- `git clean -f` / `git clean -fd`
- `git branch -D`
- `git checkout .` / `git restore .`

When blocked, the reason reads: `BLOCKED: '<command>' matches dangerous pattern '<pattern>'. The user has prevented you from running this command.`

## Steps

### 1. Ask scope

Ask the user: opt in for **this project only** or **all projects**?

- **Project**: `.pi/git-guardrails.json` in the repo root.
- **Global**: `~/.pi/agent/git-guardrails.json`.

### 2. Write the opt-in file

Write the chosen file (create `.pi/` if needed):

```json
{
  "enabled": true
}
```

That is the whole opt-in. Leave `patterns` out and the guardrail uses the default list from the skill's own [scripts/block-dangerous-git.sh](scripts/block-dangerous-git.sh), which the extension reads at load time. Add a `patterns` array only if the user wants to replace the default list.

If the file already exists, merge `"enabled": true` into it rather than overwriting other keys.

### 3. Ask about customization

Ask if the user wants to change what is blocked.

- **Add or remove patterns**: edit the `DANGEROUS_PATTERNS` array in [scripts/block-dangerous-git.sh](scripts/block-dangerous-git.sh) — that file is the single source of truth for the default list, and both the extension and the standalone check use it.
- **Per-project override**: put a `patterns` array in that project's `.pi/git-guardrails.json`. When present it replaces the default list for that scope.

Patterns are regular expressions matched anywhere in the command, the same semantics upstream used.

### 4. Verify

Check the pattern list standalone by passing a command to the sidecar:

```bash
bash skills/misc/git-guardrails/scripts/block-dangerous-git.sh "git push origin main"
```

It prints `BLOCKED: …` and exits 1 for a match, and exits 0 for a safe command such as `git status`.

Then confirm the extension is live: ask the user to run a command that should be blocked, or note that the next matching `bash` call in this session is blocked with the reason above.

To turn the guardrail off without deleting the file, set `"enabled": false`; for one session, set `PI_GIT_GUARDRAILS=off`.
