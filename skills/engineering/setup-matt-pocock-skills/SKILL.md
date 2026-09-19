---
name: setup-matt-pocock-skills
description: "Configure this repo for the engineering skills: set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before the first engineering flow."
disable-model-invocation: true
license: MIT
metadata:
  upstream: mattpocock/skills
  upstream-commit: c55ee46073ed923f86ce59a5eb3b6d895095d1b7
  upstream-path: skills/engineering/setup-matt-pocock-skills
  invocation: user
  adapted-for: pi
---

# Setup Matt Pocock's Skills

Scaffold the per-repo configuration that the engineering skills assume:

- **Issue tracker**: where issues live (GitHub by default; local markdown is also supported out of the box)
- **Triage labels**: the strings used for the five canonical triage roles
- **Domain docs**: where `CONTEXT.md` and ADRs live, and the consumer rules for reading them

This is a prompt-driven skill, not a deterministic script. Explore, present what you found, confirm with the user, then write.

## Process

### 0. Preflight (run first, before writing anything)

Run these checks in order. **a** and **b** are capability-scoped: record the result and continue,
because setup itself needs neither package. **c** and **d** are blocking: if either fails, stop,
print its remedy, and write nothing.

**a. `subagent` capability (capability-scoped, D10).**
Check whether the `subagent` tool is available to you in this session; it is registered by the
`pi-subagents` extension. You can confirm the package is installed with `pi list --approve` and
looking for `pi-subagents`.
If it is missing, mark `research`, `wayfinder`, `code-review`, and `implement` unavailable in the
capability report and print:

```
pi install npm:pi-subagents
```

Then continue. Setup does not need this package, so its absence never blocks repository
configuration.

**b. Web capability (capability-scoped, D10).**
Check whether `web_search`, `fetch_content`, `get_search_content`, and `source_check` are all
available to you; they are registered by the `pi-web-access` extension.
If any is missing, mark `research` and `wayfinder` (research tickets only) unavailable and print:

```
pi install npm:pi-web-access
```

Then continue, and say plainly that a user who only wants `grill-with-docs` → `to-spec` →
`to-tickets` → `implement` does not need this package. Do not over-gate.

**c. Skill-name collisions (blocking, D11).**
Pi keeps the first skill it finds for a name and warns; a later copy is silently shadowed. Names
in this package are the upstream names verbatim, so this is the one preflight that can make every
later skill behave like a different skill without saying so. Enumerate the names this package
defines and check each for a second definition.

- **Presence, the Pi-native way.** Do not look for a folder alongside this one. Pi puts the
  discovered skill names in your system prompt (`systemPromptOptions.skills`, rendered as the
  `<available_skills>` block). Read that list to answer "is `triage` available?".
- **Provenance and duplicates.** The authoritative per-command provenance is `pi.getCommands()`,
  whose entries carry `sourceInfo: { path, source, scope, origin, baseDir? }`. It is an extension
  API, not a tool, so read the resolved view from the startup header. Two limits matter: **it
  reports only the winner of a collision** — a shadowed copy does not appear at all — and it only
  sees registered commands. Pair it with this on-disk scan, run with `bash` (Node is always
  present because Pi requires it). It scans the user/project skill directories plus every package
  that `pi list --approve` resolves, which includes path and git installs that a fixed
  `node_modules` glob would miss, and prints every name declared more than once:

  ```bash
  node -e '
  const fs=require("fs"),cp=require("child_process"),path=require("path");
  const home=process.env.HOME||process.env.USERPROFILE||"";
  const roots=[path.join(home,".pi/agent/skills"),path.join(home,".agents/skills"),".pi/skills",".agents/skills"];
  try{for(const l of cp.execSync("pi list --approve",{encoding:"utf8"}).split(/\r?\n/)){const m=/^\s{4}(\S.*)$/.exec(l);if(m)roots.push(path.join(m[1].trim(),"skills"));}}catch{}
  const found=new Map();
  const walk=(d)=>{if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name==="SKILL.md"){const m=/^name:\s*"?([^"\s]+)"?/m.exec(fs.readFileSync(p,"utf8"));if(m)(found.get(m[1])??found.set(m[1],[]).get(m[1])).push(p);}}};
  roots.forEach(walk);
  let n=0;for(const [name,ps] of [...found.entries()].sort())if(ps.length>1){n++;console.log("collision: "+name+"\n  "+ps.join("\n  "));}
  console.log(n?n+" collision(s)":"no skill-name collisions detected");
  '
  ```

On a collision, report the colliding name and every path found, and ask the user to remove, rename,
or reorder one installation. Never rename or remove anything yourself. A name that appears once on
disk but whose `pi.getCommands()` `sourceInfo.path` points somewhere other than this package is
also a collision: say the name resolved to another source rather than assuming this package's copy
won. Where neither surface can attribute a name, say it could not be attributed.

**d. `enableSkillCommands` (blocking, D3).**
Pi registers skills as `/skill:<name>` commands only while `enableSkillCommands` is not `false`
(the default is `true`). With it off, all 14 user-invoked skills are unreachable and no skill can
explain why. Read both settings files with the `read` tool — project settings override global:

- `~/.pi/agent/settings.json` (global)
- `.pi/settings.json` (project)

If the effective value is `false`, stop and print the remedy:

```
Re-enable skill commands: run /settings and turn "Enable skill commands" back on, or set
"enableSkillCommands": true in .pi/settings.json (project) or ~/.pi/agent/settings.json (global).
```

Reaching this skill as `/skill:setup-matt-pocock-skills` already proves skill commands are on for
this session; this check protects the other user-invoked skills. Project settings load only when
the project is trusted, so treat an untrusted `.pi/settings.json` as unread and say so.

### 1. Explore

Look at the current repo to understand its starting state. Read whatever exists; don't assume:

- `git remote -v` and `.git/config`: is this a GitHub repo? A GitLab repo? Which one?
- `AGENTS.md` at the repo root (and `AGENTS.override.md`): does either exist? Is there already an `## Agent skills` section? Pi's other context-file name is irrelevant here — this package standardizes on `AGENTS.md`.
- `CONTEXT.md` and `CONTEXT-MAP.md` at the repo root
- `docs/adr/` and any `src/*/docs/adr/` directories
- `docs/agents/`: does this skill's prior output already exist?
- `.scratch/`: a sign that a local-markdown issue tracker convention is already in use
- **Is the `triage` skill available?** Read Pi's own skill catalog: the `<available_skills>` block in your system prompt (`systemPromptOptions.skills`). If `triage` is listed, Section B runs; if it is not, skip Section B entirely. Do not probe the filesystem for a `triage` folder.
- Monorepo signals: a `pnpm-workspace.yaml`, a `workspaces` field in `package.json`, or a populated `packages/*` with its own `src/`. These are present only in a genuinely large multi-package repo; their absence means single-context, which is almost every repo.

### 2. Present findings and ask

Summarise what's present and what's missing, including the preflight capability report from step 0.
Then take the sections in order. One section, one answer, then the next.

Lead each section with the recommended answer so the user can accept it in a word. Give a one-line explainer only when the choice genuinely branches; skip the section entirely when exploration already settled it (Section B when `triage` isn't available, Section C when there's no monorepo).

**Section A: Issue tracker.**

> Explainer: The "issue tracker" is where issues live for this repo. Skills like `to-tickets`, `triage`, and `to-spec` read from and write to it. They need to know whether to call `gh issue create`, write a markdown file under `.scratch/`, or follow some other workflow you describe. Pick the place you actually track work for this repo.

Default posture: these skills were designed for GitHub. If a `git remote` points at GitHub, propose that. If a `git remote` points at GitLab (`gitlab.com` or a self-hosted host), propose GitLab. Otherwise (or if the user prefers), offer:

- **GitHub**: issues live in the repo's GitHub Issues (uses the `gh` CLI)
- **GitLab**: issues live in the repo's GitLab Issues (uses the [`glab`](https://gitlab.com/gitlab-org/cli) CLI)
- **Local markdown**: issues live as files under `.scratch/<feature>/` in this repo (good for solo projects or repos without a remote)
- **Other** (Jira, Linear, etc.): ask the user to describe the workflow in one paragraph; the skill will record it as freeform prose

`gh` and `glab` commands run through Pi's `bash` tool; if the CLI is not installed, say so and
offer local markdown instead of writing a tracker file that cannot work.

Record the choice in `docs/agents/issue-tracker.md`. The GitHub and GitLab templates carry a "PRs as a request surface" flag, defaulted **off**. Leave it off and don't raise it: a user who wants external PRs in the triage queue can flip the flag in the file later.

**Section B: Triage label vocabulary.** Skip this section entirely if the `triage` skill isn't available (step 1 told you), since an unavailable skill needs no labels.

If it is available, ask exactly one question:

> Do you want to keep the default triage labels? (recommended: **yes**)

The defaults are the five canonical roles, each label string equal to its name: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. On **yes**, write them as-is. Only if the user says no, usually because their tracker already uses other names (e.g. `bug:triage` for `needs-triage`), collect the overrides so `triage` applies existing labels instead of creating duplicates.

**Section C: Domain docs.** Default to **single-context** (one `CONTEXT.md` + `docs/adr/` at the repo root). This fits almost every repo; write it without asking.

Offer **multi-context** (a root `CONTEXT-MAP.md` pointing to per-context `CONTEXT.md` files) only when exploration found monorepo signals. Then confirm which layout they want.

### 3. Confirm and edit

Show the user a draft of:

- The `## Agent skills` block to add to `AGENTS.md`
- The contents of `docs/agents/issue-tracker.md`, `docs/agents/domain.md`, and `docs/agents/triage-labels.md` (the last only when `triage` is available)

Let them edit before writing.

### 4. Write

**Write `AGENTS.md` only.** Pi also understands a second, Claude-compatible context-file name, but
this package standardizes on `AGENTS.md`, so:

- If `AGENTS.md` exists, edit it.
- If it does not, create it. Do not create the compatibility file, and do not fork the config
  across two files.

If an `## Agent skills` block already exists, update its contents in-place rather than appending a duplicate. Don't overwrite user edits to the surrounding sections.

The block:

```markdown
## Agent skills

### Issue tracker

[one-line summary of where issues are tracked]. See `docs/agents/issue-tracker.md`.

### Triage labels

[one-line summary of the label vocabulary]. See `docs/agents/triage-labels.md`.

### Domain docs

[one-line summary of layout: "single-context" or "multi-context"]. See `docs/agents/domain.md`.
```

Include the `### Triage labels` sub-block, and write `docs/agents/triage-labels.md`, only when `triage` is available and Section B ran. When it isn't, both are omitted.

Then write the docs files using the seed templates in **this skill's own folder** as a starting point (skill-relative paths, read with the `read` tool):

- [issue-tracker-github.md](./issue-tracker-github.md): GitHub issue tracker
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md): GitLab issue tracker
- [issue-tracker-local.md](./issue-tracker-local.md): local-markdown issue tracker
- [triage-labels.md](./triage-labels.md): label mapping (only when `triage` is available)
- [domain.md](./domain.md): domain doc consumer rules + layout

The **outputs** always go to the target repo as `docs/agents/issue-tracker.md`,
`docs/agents/domain.md`, and `docs/agents/triage-labels.md`. Never read templates from the target
repo's `docs/agents/`; that directory is where this skill writes, not where it reads.

For "other" issue trackers, write `docs/agents/issue-tracker.md` from scratch using the user's description.

Do **not** pre-create `.scratch/` feature folders, issues, tickets, or maps. Setup configures
conventions; it never invents work.

### 5. Record the pointers in AGENTS.md

Add a short pointer-only block — lines that point at the files and facts, never copied skill text:

- The Pi invocation model: user-invoked skills run only as `/skill:<name>`; model-invoked skills load on demand; skill commands require `enableSkillCommands`.
- The capability report from step 0 (which of `pi-subagents` / `pi-web-access` were found, and what that makes unavailable).
- The provenance line: this package was adapted from `mattpocock/skills` at commit `c55ee46073ed923f86ce59a5eb3b6d895095d1b7`. Its prerequisites (`pi-subagents` / `pi-web-access`) are installed unpinned, so record the versions actually resolved in this environment — not a pinned pair.

### 6. Keep scratch artifacts out of git

Ensure `.scratch/handoffs/` and `.scratch/reports/` are git-ignored (D5). Add the patterns to the
repo's `.gitignore` if they are not already covered, and record in `AGENTS.md` that both are
ignored by default and that a repo may opt in to committing either. Do not create the directories
themselves.

### 7. Done

Tell the user setup is complete and which engineering skills will now read from these files. Mention they can edit `docs/agents/*.md` directly later; re-running this skill is only necessary if they want to switch issue trackers or restart from scratch.
