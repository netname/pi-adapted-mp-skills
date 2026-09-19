# Adaptation Plan: Matt Pocock's Skills → Pi Skills

Status: **Decisions frozen — implementation not started** (decisions D1–D16 recorded; §9 open questions closed; next action is M0)
Guide of record: [`docs/Matt_Pocock_Skills_Project_Workflow_Guide.md`](./Matt_Pocock_Skills_Project_Workflow_Guide.md)
Upstream: [`mattpocock/skills`](https://github.com/mattpocock/skills) @ `main` (`c55ee46`, checked 2026-09-18)
Target harness: [Pi coding agent](https://github.com/earendil-works/pi-mono) (this repo: `pi-adapted-mp-skills`)

> [!note] Reading order for reviewers
> §5 holds every binding decision (D1–D16). §9 is closed. §10 lists what is deliberately deferred and what is scheduled but not yet built.

---

## 1. Purpose

Port Matt Pocock's engineering-workflow skill collection so it runs natively in Pi, preserving the methodology described in the guide (idea → clarify → spec → tickets → implement, plus Wayfinder, triage, diagnosis, and the model-invoked disciplines) while replacing Claude-Code/Codex-specific mechanics with Pi equivalents.

**Success looks like:** a user can `pi install` this package (or point `.pi/settings.json` at it) and run the documented workflows end-to-end — typing `/skill:<name>` for the user-invoked workflow commands and letting the model pick up the model-invoked disciplines — with no references to tools, commands, or files that Pi does not have.

### In scope

- Port all **engineering** and **productivity** skills that are canonical (not `in-progress`, not `deprecated`).
- Use `pi-subagents` as a required runtime package for subagents, background work, and parallel orchestration.
- Adapt repository-setup conventions (`AGENTS.md`, `docs/agents/*`, local-markdown tracker) to Pi.
- Replace the remaining Claude-Code/Codex-specific mechanics (`/clear`, cross-skill invocation, tool names) with Pi equivalents.
- Ship as a Pi package: `skills/`, `package.json` with a `pi` manifest, `pi-package` keyword.

### Runtime prerequisites

The adapted collection depends on these Pi packages, pinned to the versions validated during implementation:

```bash
pi install npm:pi-subagents@0.69.0     # required by any delegating skill
pi install npm:pi-web-access@0.29.0    # required only for research
```

| Package | Purpose | Which skills need it |
|---|---|---|
| [`nicobailon/pi-subagents`](https://github.com/nicobailon/pi-subagents) | Isolated child agents, concurrent orchestration, and detached background work | `research`, `wayfinder`, `code-review`, `implement` (because `implement` invokes `code-review`) |
| [`nicobailon/pi-web-access`](https://github.com/nicobailon/pi-web-access) | `web_search`, `fetch_content`, `get_search_content`, and `source_check` for parent and research children | `research`, `wayfinder` (only its research tickets) |

So the dependency is **per capability, not all-or-nothing**. A user who only wants the main flow — `grill-with-docs` → `to-spec` → `to-tickets` → `implement` — needs `pi-subagents` but not `pi-web-access`. `pi-web-access` becomes necessary the moment they do research. Setup itself needs neither, so a missing package never blocks repository configuration.

These packages are part of the target runtime contract, not optional enhancements. A skill whose capability is unavailable must stop with the applicable pinned installation instruction; it must not silently degrade to sequential work or uncited research. This is a deliberate, recorded deviation from upstream's graceful-degradation behavior; the options considered and the rationale are in **D10**. See **D11** for the related decision to keep upstream skill names verbatim and fail loud on name collisions.

Installation alone is not sufficient for web-enabled **foreground** children. Child extension loading depends on where the child runs: local foreground children are sessions inside the parent Pi process and never load the parent's ambient extensions, while *background* (detached) children are separate processes and do load them. Extension selection is not available as a **per-call** dispatch parameter, so it is configured per agent (frontmatter `extensions` / `subagentOnlyExtensions`), once per settings file (`subagents.defaultExtensions`), or registered by a host extension (`registerRequiredChildExtensions`). See D14 for how the path is resolved. Before launch, `pi-subagents` verifies that `web_search`, `fetch_content`, `get_search_content`, and `source_check` are registered; naming tools in an allowlist does not load their provider.

### Out of scope (for v1)

- `skills/in-progress/*` — nine skills at the pinned commit, all deferred to post-v1: `pr`, `retro`, `implement-spec`, `claude-handoff`, `loop-me`, `setup-ts-deep-modules`, `writing-beats`, `writing-fragments`, `writing-shape` (§10).
- `skills/deprecated/*` — revisit only if upstream un-deprecates one.
- `setup-pre-commit` — **deferred to post-v1** (decision: D15; tracked in §10 Next steps).
- Language/framework-specific skills (`migrate-to-shoehorn`). Note `setup-ts-deep-modules` is *not* in this category — it lives under `in-progress/` and is deferred with the rest on maturity grounds.
- Rewriting the methodology. This is an adaptation, not a redesign; deviations must be recorded in §5 decisions.
- Auto-syncing with upstream CI (tracked as a stretch task in M6).

---

## 2. Upstream inventory and disposition

Grouped by upstream bucket. **Invocation** is taken from upstream frontmatter (`disable-model-invocation`) and `.agents/invocation.md`; verify every one in M1 rather than trusting this table.

| Upstream skill | Bucket | Invocation | Pi disposition |
|---|---|---|---|
| `setup-matt-pocock-skills` | engineering | user | **Adapt** — Pi paths, `AGENTS.md`, tracker templates |
| `grill-with-docs` | engineering | user | Port |
| `to-spec` | engineering | user | Port |
| `to-tickets` | engineering | user | Port |
| `wayfinder` | engineering | user | Port (background-research step adapted) |
| `implement` | engineering | user | Port |
| `triage` (+ `AGENT-BRIEF.md`, `OUT-OF-SCOPE.md`) | engineering | user | Port |
| `ask-matt` (+ `PHASE-BOUNDARIES.md`) | engineering | user | **Adapt** as the Pi router; update target names/commands |
| `grilling` | productivity | model | Port |
| `domain-modeling` (+ `CONTEXT-FORMAT.md`, `ADR-FORMAT.md`) | engineering | model | Port |
| `research` | engineering | model | **Adapt** — dispatch and manage background `researcher` children through `pi-subagents` |
| `prototype` (+ `LOGIC.md`, `UI.md`) | engineering | model | Port |
| `tdd` (+ `tests.md`, `mocking.md`) | engineering | model | Port |
| `code-review` | engineering | model | **Adapt** — dispatch Standards and Spec reviewer children concurrently through `pi-subagents` |
| `diagnosing-bugs` (+ `scripts/hitl-loop.template.sh`) | engineering | model | Port |
| `codebase-design` (+ `DEEPENING.md`, `DESIGN-IT-TWICE.md`) | engineering | model | Port |
| `improve-codebase-architecture` (+ `HTML-REPORT.md`) | engineering | user | Port |
| `resolving-merge-conflicts` | engineering | model | Port |
| `wizard` (+ `template.sh`) | engineering | model | Port |
| `handoff` | productivity | user | **Adapt** output location (see D5) |
| `grill-me` | productivity | user | Port |
| `to-questionnaire` | productivity | user | Port |
| `wait-what` | productivity | user | Port |
| `teach` (+ `*-FORMAT.md`) | productivity | user | Port in v1 (M5) — D15 |
| `writing-for-agents` | productivity | model | Port |
| `git-guardrails-claude-code` | misc | model | **Adapt/rename** — guardrails are harness-agnostic; drop "claude-code" from name |
| `setup-pre-commit` | misc | model | **Defer to post-v1** (D15, §10 Next steps) |
| `scaffold-exercises` | misc | model | Drop (course-authoring, out of scope) |
| `migrate-to-shoehorn` | misc | model | Drop (language/framework-specific; §10) |
| `in-progress/pr`, `in-progress/retro`, `in-progress/implement-spec`, `in-progress/claude-handoff`, `in-progress/loop-me`, `in-progress/setup-ts-deep-modules`, `in-progress/writing-beats`, `in-progress/writing-fragments`, `in-progress/writing-shape` | in-progress | mixed (verify each in M1) | Defer to post-v1 |
| `deprecated/*` | deprecated | n/a | Drop |

Every `agents/openai.yaml` sidecar (Codex UI metadata) is **dropped**; its intent is folded into `metadata` (see D2).

---

## 3. Harness gap analysis (Claude Code / Codex → Pi)

| Capability | Upstream assumption | Pi reality | Adaptation |
|---|---|---|---|
| Skill discovery | `.claude/skills`, plugin, `npx skills` | `skills/` package dir, `.pi/skills/`, settings `skills`, `--skill` | Ship as Pi package with `pi.skills` manifest |
| User invocation | `/to-spec` slash command | `/skill:to-spec` (`enableSkillCommands`, on by default) — **command only** for user-invoked skills | Rewrite prose so user-invoked skills are named as `/skill:<name>` commands the user types; never as something the model can choose |
| Hiding from model | `disable-model-invocation: true` (Claude) + `policy.allow_implicit_invocation: false` (Codex) | `disable-model-invocation: true` supported | Keep frontmatter field; drop `agents/openai.yaml` |
| Model-invoked skill call | "Call the Skill tool with \"grilling\"" | No Skill tool; model loads `SKILL.md` via `read` | New convention (D4): read the target's `SKILL.md` by a path that resolves from the current skill's directory, i.e. `../<name>/SKILL.md` same-bucket or `../../<bucket>/<name>/SKILL.md` cross-bucket |
| `agents/openai.yaml` | Codex picker metadata | Not read (unknown files ignored) | Drop; move to `metadata` |
| Subagents / `Task` tool | Parallel research + two-axis review | Not in Pi core; supplied by required `pi-subagents` package | Use the `subagent` tool directly; verify its presence before delegated phases |
| Background research agent | Launch independent research while the parent continues | `pi-subagents` supports detached background children and result retrieval | Dispatch one bounded researcher child per independent frontier ticket; track and collect every run |
| `/clear` | Clear context between implement tickets | `/new` starts a new session | Replace with `/new` |
| `/compact` | Context hygiene at phase boundaries | `/compact [instructions]` exists | Keep |
| Session forking | not used | `/fork`, `/clone` exist | Optional enrichment; not required |
| `handoff` output | OS temp directory | Skills should leave durable repo artifacts | Write `.scratch/handoffs/<timestamp>-<goal>.md`, **git-ignored by default** (D5) |
| `improve-codebase-architecture` report | OS temp directory (HTML, opened in a browser) | Same treatment as the handoff: findable in the repo, absent from git history | Write `.scratch/reports/<timestamp>-architecture.html`, **git-ignored by default** (D5) |
| Tool names | `Read`, `Edit`, `Write`, `Bash`, `Grep`, `Glob`, `WebSearch`, `WebFetch`, `TodoWrite`, `AskUserQuestion` | `read`, `edit`, `write`, `bash`, `grep`, `find`, `ls`, `web_search`/`fetch_content` (if installed), no todo/question tool by default | Token-map in M2; use `ls`/`find` for globbing; use editor draft for questions |
| `allowed-tools` | Claude tool names | Pi tool names, experimental | Use Pi names; otherwise omit |
| AGENTS file | `AGENTS.md` / `CLAUDE.md` | Pi reads **both** `AGENTS.md` and `CLAUDE.md` (parent dirs + cwd), and `AGENTS.override.md` in a directory replaces both for that directory | Setup writes `AGENTS.md` as the single canonical file; it does not rely on Pi's `CLAUDE.md` compatibility path |
| Tracker CLI | `gh` / `glab` / MCP | `bash` + `gh`/`glab` if installed; local markdown always works | Keep all three templates; test `gh` path in M6 |

---

## 4. Target repository layout

```
pi-adapted-mp-skills/
├── package.json                 # pi manifest, pi-package keyword, MIT
├── README.md                    # install, skill index, invocation model
├── LICENSE                      # MIT (upstream license preserved)
├── NOTICE                       # upstream attribution + pinned commit
├── CHANGELOG.md
├── docs/
│   ├── Matt_Pocock_Skills_Project_Workflow_Guide.md
│   └── ADAPTATION_PLAN.md       # this file
│                                # NOTE: no docs/agents/ here. Those files are *target-repo*
│                                # output written by setup at run time, not package content (D7).
├── agents/                       # package agents discovered by pi-subagents
│   ├── mp-researcher.md          # dispatched as a background child, which loads ambient extensions, so pi-web-access needs no explicit path (D14)
│   ├── mp-evidence-auditor.md    # independent source verification
│   ├── mp-review-standards.md    # standards review axis
│   └── mp-review-spec.md         # specification-fidelity review axis
├── skills/
│   ├── engineering/
│   │   ├── setup-matt-pocock-skills/{SKILL.md,issue-tracker-github.md,issue-tracker-gitlab.md,issue-tracker-local.md,domain.md,triage-labels.md}
│   │   ├── ask-matt/{SKILL.md,PHASE-BOUNDARIES.md}
│   │   ├── grill-with-docs/SKILL.md
│   │   ├── to-spec/SKILL.md
│   │   ├── to-tickets/SKILL.md
│   │   ├── wayfinder/SKILL.md
│   │   ├── implement/SKILL.md
│   │   ├── triage/{SKILL.md,AGENT-BRIEF.md,OUT-OF-SCOPE.md}
│   │   ├── domain-modeling/{SKILL.md,CONTEXT-FORMAT.md,ADR-FORMAT.md}
│   │   ├── research/SKILL.md
│   │   ├── prototype/{SKILL.md,LOGIC.md,UI.md}
│   │   ├── tdd/{SKILL.md,tests.md,mocking.md}
│   │   ├── code-review/SKILL.md
│   │   ├── diagnosing-bugs/{SKILL.md,scripts/hitl-loop.template.sh}
│   │   ├── codebase-design/{SKILL.md,DEEPENING.md,DESIGN-IT-TWICE.md}
│   │   ├── improve-codebase-architecture/{SKILL.md,HTML-REPORT.md}
│   │   ├── resolving-merge-conflicts/SKILL.md
│   │   └── wizard/{SKILL.md,template.sh}
│   ├── productivity/
│   │   ├── grilling/SKILL.md
│   │   ├── grill-me/SKILL.md
│   │   ├── handoff/SKILL.md
│   │   ├── to-questionnaire/SKILL.md
│   │   ├── wait-what/SKILL.md
│   │   ├── teach/{SKILL.md,MISSION-FORMAT.md,GLOSSARY-FORMAT.md,LEARNING-RECORD-FORMAT.md,RESOURCES-FORMAT.md}
│   │   └── writing-for-agents/{SKILL.md,SKILL-MECHANICS.md}
│   └── misc/
│       ├── git-guardrails/{SKILL.md,scripts/block-dangerous-git.sh}   # renamed from git-guardrails-claude-code
│       └── (setup-pre-commit deferred to post-v1 — see §10 Next steps)
├── scripts/
│   ├── validate-skills.mjs      # frontmatter + token lint + link check
│   ├── fetch-upstream.mjs       # pinned-commit sync helper (M6)
│   └── smoke-test.sh            # loads package in a fixture repo
└── .pi/settings.json            # dev-only: point at ./skills for local testing
```

Rationale for keeping upstream directory names and skill `name`s: Pi does not require `name` to match the parent directory, and preserving names keeps the guide's vocabulary, upstream docs, and user muscle memory valid.

**Sidecar placement follows upstream exactly (D7).** Every reference document a skill needs lives inside that skill's own directory and is referenced with a skill-relative path (`./AGENT-BRIEF.md`, `scripts/hitl-loop.template.sh`), which is how Pi resolves it. The setup skill is no exception: its tracker/domain/label templates stay in `skills/engineering/setup-matt-pocock-skills/`, exactly as upstream.

This means two different `docs/agents/` paths must not be confused:

| Path | What it is | When it exists |
|---|---|---|
| `skills/engineering/setup-matt-pocock-skills/{issue-tracker-*,domain,triage-labels}.md` | Template **sources**, shipped in this package | Always (package content) |
| `<target-repo>/docs/agents/{issue-tracker,domain,triage-labels}.md` | Generated **output**, written by setup into the user's repo | Only after that repo runs `/skill:setup-matt-pocock-skills` |

Note the naming difference: templates are variant-specific (`issue-tracker-local.md`, `issue-tracker-github.md`, `issue-tracker-gitlab.md`) because setup picks one; the generated file is always singular (`docs/agents/issue-tracker.md`).

---

## 5. Adaptation design decisions

### D1 — Ship as a Pi package with explicit runtime prerequisites

- Installation documentation and setup preflight require the tested `pi-subagents` and `pi-web-access` versions to be installed and active.
- Keep both as separately installed Pi packages rather than ordinary npm dependencies: Pi must activate their extension resources, not merely place their modules under `node_modules`.
- `package.json` gets `"keywords": ["pi-package"]` and:
  ```json
  "pi": {
    "skills": ["./skills"],
    "subagents": { "agents": ["./agents"] }
  }
  ```
- Install: `pi install git:github.com/<owner>/pi-adapted-mp-skills` (or path/npm).
- Do **not** ship `.claude-plugin/` or `agents/openai.yaml`. One installation route only, per the guide's duplicate-install warning.

### D2 — Frontmatter policy

Keep exactly what Pi reads; record provenance in `metadata`:

```yaml
---
name: to-spec
description: ...
disable-model-invocation: true      # keep for user-invoked skills
license: MIT
metadata:
  upstream: mattpocock/skills
  upstream-commit: c55ee46073ed923f86ce59a5eb3b6d895095d1b7
  upstream-path: skills/engineering/to-spec
  invocation: user                   # user | model
  adapted-for: pi
---
```

- `description` follows the upstream invocation axis: **model-facing** descriptions keep trigger phrasing; **user-facing** descriptions are one-line summaries (mirrors `.agents/invocation.md`).
- Drop `agents/openai.yaml`; `invocation` in `metadata` preserves the classification.
- **Drop every upstream-only frontmatter field** that Pi does not read, rather than carrying it over. This includes `argument-hint` (used by upstream `handoff` and others) and any future Claude/Codex-specific key. This is a port, not a copy: Pi ignores unknown fields silently, so leaving them in would create the false impression that they do something. Record the dropped fields in the skill's `metadata` only where they signal real intent worth preserving (as `invocation` does).
- `allowed-tools`: only add where a skill genuinely needs pre-approval, using Pi tool names (`read`, `bash`, `edit`, `write`, `grep`, `find`, `ls`).

### D3 — Naming and invocability

- User-invoked skills: `disable-model-invocation: true`. They are **hidden from the system prompt**, so the model never sees them and cannot choose them. The only way to start one is for the user to type `/skill:<name>`. Natural-language requests do **not** work for these skills — there is nothing for the model to match against.
- Model-invoked skills: default (no field), listed in the system prompt, auto-loadable by the model, and also startable by the user on request.
- A user-invoked skill may load model-invoked skills; it must never assume it can load another user-invoked skill. Wording: *"tell the user to run `/skill:setup-matt-pocock-skills`"* — always with the leading slash, because that is the only interface that works.
- Invocation checks must therefore use the right probe per class: a user-invoked skill is reachable iff `enableSkillCommands` is on and `/skill:<name>` resolves; a model-invoked skill is reachable iff its name and description appear in the system prompt.
- `git-guardrails-claude-code` → rename `git-guardrails` (Pi is not Claude Code).

### D4 — Cross-skill invocation convention (replaces "Call the Skill tool")

Pi has no Skill tool. Because Pi resolves relative paths from the skill's own directory, cross-skill loads use a relative path to the target's `SKILL.md`.

The path depends on whether the two skills share a bucket. Skills are grouped `skills/<bucket>/<name>/SKILL.md` with buckets `engineering`, `productivity`, and `misc` (§4), and nearly every upstream cross-skill load crosses a bucket:

| From → to | Both in | Path to write |
|---|---|---|
| `engineering/tdd` → `engineering/codebase-design` | same bucket | `../codebase-design/SKILL.md` |
| `productivity/grill-me` → `productivity/grilling` | same bucket | `../grilling/SKILL.md` |
| `engineering/grill-with-docs` → `productivity/grilling` | cross-bucket | `../../productivity/grilling/SKILL.md` |
| `engineering/wayfinder` → `productivity/grilling` | cross-bucket | `../../productivity/grilling/SKILL.md` |

Instruction style:

> Load the `grilling` skill before continuing: from this skill's directory, read `../../productivity/grilling/SKILL.md` and follow it.

Rules:
- Always name the skill **and** give a path that resolves from the current skill's directory. Same bucket: `../<name>/SKILL.md`. Cross-bucket: `../../<bucket>/<name>/SKILL.md`.
- One skill per instruction; two skills means two instructions.
- Keep `/skill:<name>` as a human-facing label only; never phrase it as something the model can execute.
- When the target is a **user-invoked** skill (D3), do not write a load instruction at all — hidden skills cannot be loaded by the model. Write "tell the user to run `/skill:<name>`" instead. This applies to upstream hand-offs such as `diagnosing-bugs` pointing at `improve-codebase-architecture`.
- Add a `scripts/validate-skills.mjs` check that resolves every backticked `.../SKILL.md` reference against the referencing file's directory, asserts the target exists, and asserts the target's frontmatter `name` matches the skill named in the instruction. Also assert that no body text contains `Skill tool`, `Task tool`, or `agents/openai.yaml`.

Cross-skill loads this convention must cover, in the v1 set (all are model-invoked targets except the last):

| Owning skill (bucket) | Loads |
|---|---|
| `grill-with-docs` (engineering) | `grilling` (productivity), `domain-modeling` (engineering) |
| `grill-me` (productivity) | `grilling` (productivity) |
| `tdd` (engineering) | `codebase-design` (engineering) |
| `triage` (engineering) | `grilling` (productivity), `domain-modeling` (engineering) |
| `wayfinder` (engineering) | `research`, `prototype`, `domain-modeling` (engineering), `grilling` (productivity) |
| `improve-codebase-architecture` (engineering) | `codebase-design`, `domain-modeling` (engineering), `grilling` (productivity) |
| `implement` (engineering) | `tdd`, `code-review` (engineering) |
| `diagnosing-bugs` (engineering) | **no load** — hand-off is to user-invoked `improve-codebase-architecture`, so it is phrased as `/skill:improve-codebase-architecture` |

### D5 — Harness substitutions and parallel orchestration (global token map applied in M2)

`pi-subagents` is the sole adaptation target for upstream subagent semantics. General Pi alternatives such as manual extra sessions or batched web calls are not branches in these skills.

| Upstream token or operation | Pi replacement |
|---|---|
| `/clear` | `/new` |
| `/compact` | `/compact` (unchanged) |
| `Call the Skill tool with "X"` | Relative `SKILL.md` load instruction (D4) |
| Subagent / `Task` | Required `subagent` tool from `pi-subagents` |
| Background research agent | Detached `mp-researcher` subagent; save its run identity and collect its result before resolving the ticket |
| Parallel research frontier | One bounded `mp-researcher` child per independent research ticket, dispatched concurrently; no shared mutable artifact paths |
| Consequential research verification | Fresh `mp-evidence-auditor` child checks claim/source support independently |
| Two parallel review axes | `mp-review-standards` and `mp-review-spec` children dispatched concurrently; parent synthesizes only after both finish |
| `WebSearch` / `WebFetch` | `web_search` / `fetch_content` from the required `pi-web-access` package (D10). No `curl` fallback: an unverified fetch path would weaken the citation guarantee research depends on. |
| `Glob` | `find` / `ls` |
| `TodoWrite` | Pi todo extension (optional); otherwise the tracker ticket is the checklist |
| `AskUserQuestion` | Ask in plain conversation; use the `question`/`questionnaire` extension examples only if installed |
| `handoff` → OS temp | `.scratch/handoffs/<ISO>-<slug>.md`, **git-ignored by default**; a repo may opt in to committing it, not the reverse |
| `improve-codebase-architecture` report → OS temp | `.scratch/reports/<ISO>-architecture.html`, **git-ignored by default** — same treatment as the handoff |
| `CLAUDE.md` | `AGENTS.md` |
| **M1** Bare `/<skill-name>` slash-command reference (`/to-spec`, `/tdd`, `/code-review`, `/grilling`, …) | Human-facing label: `/skill:<name>` (valid for user- and model-invoked skills). Operative instruction the agent must run now: the D4 relative `SKILL.md` load; when the target is **user-invoked**, write *"tell the user to run `/skill:<name>`"* instead. §3 anticipated this substitution but D5 had no row. |
| **M1** `agents/openai.yaml` (Codex `interface.*`, `policy.allow_implicit_invocation`) | Dropped (D2). The invocation classification it encodes is preserved as `metadata.invocation`. |
| **M1** `argument-hint` (frontmatter) | Dropped (D2). Pi appends passed arguments to the skill content as `User: <args>`, so no hint field is needed. |
| **M1** `allowed-tools` (frontmatter, Claude tool names) | Omit unless pre-approval is genuinely needed; then use Pi tool names (`read`, `bash`, `edit`, `write`, `grep`, `find`, `ls`) (D2). Zero upstream occurrences at the pin, so this row is prospective. |
| **M1** Claude Code hook mechanism: `PreToolUse` matcher on `Bash`, `.claude/settings.json`, `~/.claude/settings.json`, `.claude/hooks/`, `~/.claude/hooks/`, `$CLAUDE_PROJECT_DIR` | Pi extension hook `pi.on("tool_call", …)` returning `{ block: true, reason }` (Pi `docs/extensions.md`; bundled `permission-gate.ts` / `protected-paths.ts`). Applies to `git-guardrails`; packaging the extension is M5 work. |
| **M1** `claude --bg` / `claude agents` (Claude Code CLI background-agent launch) | `pi-subagents` background child — the same mechanism as the **Background research agent** row above. Applies only to the deferred `claude-handoff`. |

Three rows above are settled policy, not open questions:

- **Hard gate (D10).** Every subagent/web row here assumes the pinned `pi-subagents` and `pi-web-access` packages are active. No row offers a sequential or `curl` fallback. The options considered and the reason for rejecting graceful degradation are in D10.
- **Handoff and architecture report are git-ignored by default.** Upstream writes both to the OS temp directory because both are *temporary* artifacts — a briefing for one next session, and a one-off visual review. Committing either by default would promote throwaway output into shared history, exactly the failure mode the guide's "do not use a handoff as permanent documentation" rule warns about. The port keeps the ephemeral intent but relocates both into the repo (`.scratch/handoffs/`, `.scratch/reports/`) so they are easy to find and link from a session, while `.gitignore` keeps them out of shared history. Setup ensures both paths are ignored (D6); a repo that deliberately wants them committed may opt in, but that is never the default.
- **Substitution is total; no residue in ported bodies.** A replaced token must not survive anywhere in `skills/**`, not even in explanatory prose. `ask-matt`'s phase-boundary list therefore reads "`/new`: start a fresh session when nothing here matters to what's next" — it never mentions `/clear`, because the ported skill has no reason to. The mapping is recorded once, here, and in `CHANGELOG.md`; it is not something a skill needs to teach. Consequently the M2 validator bans `/clear` outright with **no allowlist**: any occurrence in a ported body is a porting error, not a legitimate reference. The same logic applies to `CLAUDE.md` and `agents/openai.yaml`.

### D6 — Setup skill adaptation

`setup-matt-pocock-skills` is the single precondition skill and must work in Pi:

1. Explore the repo (commands, tests, CI, tracker remotes).
2. Ask for tracker choice: GitHub / GitLab / local Markdown.
3. Write the target repo's `AGENTS.md` (pointers only) and `docs/agents/{issue-tracker,domain,triage-labels}.md`. The **template sources** are this skill's own sidecars, read by skill-relative path (`./issue-tracker-local.md`, `./issue-tracker-github.md`, `./issue-tracker-gitlab.md`, `./domain.md`, `./triage-labels.md`); the **outputs** are written into the user's repo as `docs/agents/issue-tracker.md`, `docs/agents/domain.md`, and `docs/agents/triage-labels.md`. Never look for templates under the target repo's `docs/agents/` — that directory is where the output goes.
4. Never pre-create `.scratch/` feature folders or issues.
5. Record the Pi version assumptions and the package's own pinned upstream commit in `AGENTS.md` as a **pointer only** — no copying skill text.
6. **Preflight, in order.** Two of these are **blocking for everything**; two are **capability-scoped**, because setup itself needs neither `pi-subagents` nor `pi-web-access`:
   a. *(capability-scoped, D10)* confirm `pi-subagents` is active and the `subagent` tool is available. If missing, mark `research`, `wayfinder`, `code-review`, and `implement` unavailable with the pinned install command, and continue.
   b. *(capability-scoped, D10)* confirm `pi-web-access` is active and `web_search`, `fetch_content`, `get_search_content`, and `source_check` are available. If missing, mark `research` and `wayfinder` (research tickets) unavailable with the pinned install command, and continue. Do not tell a user who only wants the main flow to install this.
   c. *(blocking, D11)* look for duplicate definitions of any skill name this package defines across this package, project/global skill directories, and other installed packages, and attribute them using the provenance Pi does expose (`pi.getCommands()` `sourceInfo.path` / `origin` / `scope`). Report every duplicate found with its source where known. Because Pi offers no documented "which source won" API, this check is best-effort: where a name cannot be attributed, report that it could not be attributed rather than assuming it resolved to this package. Fail with the colliding name and the remove/rename/reorder remedy; the README's symptom-and-remedy entry is the primary mitigation.
   d. *(blocking, D3)* confirm `enableSkillCommands` is not disabled. It defaults to `true`; if a user has turned it off, all 14 user-invoked skills become unreachable and no skill can report why. Fail with the exact remedy (re-enable it in `/settings` or `settings.json`).
   Setup writes the capability report into `AGENTS.md` as a pointer, and never renames, removes, or reconfigures anything itself. Each capability-scoped skill repeats its own check at start and stops with the same message, so the gate holds even if setup has not been re-run.
7. Ensure `.scratch/handoffs/` and `.scratch/reports/` are git-ignored (D5); record that choice in `AGENTS.md` as a pointer, and note that a repo may opt in to committing either.

### D7 — Reference documents stay owned by their skill

Multi-file skills (`AGENT-BRIEF.md`, `OUT-OF-SCOPE.md`, `CONTEXT-FORMAT.md`, …) remain inside the owning skill directory, exactly as upstream. A skill's reference documents are referenced with skill-relative paths, and no skill reaches into another skill's folder for its documents. This preserves Pi's progressive disclosure and validates cleanly.

Scope of this rule: it governs **reference documents**, not skill invocation. Invoking another skill is D4's business and legitimately crosses bucket folders (for example `grill-with-docs` under `engineering/` loading `grilling` under `productivity/`).

Corollary, settled by this rule: this package ships **no** `docs/agents/` directory. Upstream keeps the setup templates inside `setup-matt-pocock-skills/`, and the port follows that. The `docs/agents/*.md` files a user ends up with in their own repo are setup's **output**, written at run time — never package content and never a template source.

### D8 — License and attribution

Upstream is MIT (© 2026 Matt Pocock). Keep `LICENSE` intact, add `NOTICE` with the repo URL and pinned commit, and add a README credit line. Any adapted text stays MIT.

### D9 — Sync model: fork-and-patch, not rewrite

Port = copy upstream file → apply the §5 token map and frontmatter/metadata changes → record the touched regions in the skill's `metadata` or a per-file diff note in `CHANGELOG.md`. `scripts/fetch-upstream.mjs` re-fetches the pinned commit and reports drift. This keeps re-sync cheap and reviewable.

### D10 — `pi-subagents`/`pi-web-access` stay a hard prerequisite, not graceful degradation

Upstream itself tolerates a harness without background/parallel execution: "a harness without background execution leaves it ready for a later dedicated research session instead" (Wayfinder). A strictly faithful port could therefore make these packages optional, with each affected skill (`wayfinder`, `research`, `implement`, `code-review`) checking availability at run time and falling back to sequential work when absent.

**Options considered:**

| Option | Mechanism | Cost | Risk |
|---|---|---|---|
| A — Hard gate (chosen) | Skill checks for the tool it needs once; if missing, stops and prints the pinned `pi install` command. No fallback path is written or executed. | One short, identical preflight paragraph per affected skill. No branching logic. | The affected skills are unusable until the package they need is installed and active — `research`/`wayfinder` need both, `code-review`/`implement` need `pi-subagents` only, even for HITL-only work that upstream defines as working without them. |
| B — Graceful degradation, decided per skill run | Each affected skill checks availability at run time and follows a written sequential fallback when absent. | A capability check *and* a described fallback *and* a rule for when the fallback is unacceptable (e.g., don't claim cited web evidence without a real web tool), in each of four skills. | The model makes a judgment call every run about which branch applies and whether the fallback is safe; more surface for the model to get subtly wrong (e.g., silently degrading a review axis without saying so). |
| C — Graceful degradation, decided once at setup | `setup-matt-pocock-skills` preflights once, records the outcome in `docs/agents/parallel-work.md`; later skills read the recorded fact instead of re-deciding. | One shared doc + one preflight step + one-line pointers in affected skills. | Still requires writing and validating a fallback code path per skill, and the recorded fact can go stale if packages are installed/removed after setup without a re-run. |

**Decision: Option A**, applied **per capability rather than as one blanket gate.** Chosen for simplicity and to remove judgment calls from the skills themselves. A skill that must decide, at run time, whether a fallback is *safe enough* for this particular case (is this review axis close enough to "separate parallel contexts"? is this research finding close enough to "cited"?) is a skill that can silently degrade its own guarantees. A hard gate keeps every affected skill's behavior binary and independently verifiable: either the tool it needs is active and the skill runs exactly as designed, or it stops with one unambiguous, reproducible action for the user to take.

Per-capability scoping is not a weakening of the gate — each skill still fails closed on exactly the tools it needs (§1). It simply avoids over-gating: `code-review` never needed `pi-web-access`, and a user who never does research should not be told to install it. The accepted trade-off is therefore narrower than a blanket gate: the skills listed in §1's prerequisite table are unusable until the package each one needs is installed and active. That is accepted knowingly, and documented here so it isn't mistaken for an oversight. This is a deliberate, recorded deviation from the upstream fallback behavior, not a faithfulness gap; §1, §5/D5, and the Risks table (§8) should be read together with this entry.

### D11 — Skill naming: keep upstream names verbatim; detect collisions, don't prefix

Pi resolves a name collision by keeping the first-registered skill and warning; a later-installed package's same-named skill is silently shadowed rather than erroring. Two upstream names are common enough to plausibly collide with another installed package or a future Pi core skill: `research`, `implement`, `wizard`, `teach`. Prefixing every skill (`mp-to-spec`, `mp-implement`, …) would remove the collision risk but breaks the guide's vocabulary — the explicit goal of this port is that a user can follow the guide's `/to-spec`, `/implement`, `/wayfinder` instructions unchanged. A partial prefix (only the collision-prone names) was also considered and rejected: it produces an inconsistent, hard-to-remember mapping and still requires the user to know which names are "safe."

**Decision: keep every upstream name verbatim** (§4's tree and §2's inventory are unchanged by this). The collision risk is addressed the same way D10 addresses the subagent-availability risk — fail loud and verifiably instead of asking a skill or the model to make a judgment call:

1. `setup-matt-pocock-skills` (D6) adds a collision-check preflight. **Scope this honestly:** Pi exposes no documented "which source won this name" API, so the check detects what can actually be observed — duplicate definitions of the same name across this package, project/global skill directories, and other installed packages, plus the provenance Pi does expose through `pi.getCommands()` (`sourceInfo.path`, `origin`, `scope`). Where Pi offers no attribution for a shadowed name, the check reports that it could not attribute the name rather than claiming the resolved skill is ours.
2. On a detected collision, setup reports the colliding name and the other source's path where known, and asks the user to remove, rename, or reorder one of the two installations. It does not silently proceed with the shadowed skill, and it does not rename anything on the user's behalf.
3. `scripts/validate-skills.mjs` / `scripts/smoke-test.sh` (M0, M6) run the same check from a fresh install so duplicates are caught in CI, not only during a repository's own setup run.
4. **Because detection cannot be guaranteed complete, the documented symptom and remedy are the primary mitigation, not a fallback.** The README states plainly: if a skill behaves unexpectedly or the wrong one runs, a same-named skill from another source is the likely cause; list the resolution order and the remove/rename/reorder remedy, and how to inspect provenance with `pi list` and `pi.getCommands()`. This is the part that works even when detection does not.

### D12 — Distribution: git URL primary, npm at the `v0.1.0` tag

**Decision (was open question #1):** the primary documented install route is the git URL:

```bash
pi install git:github.com/<owner>/pi-adapted-mp-skills
```

At the `v0.1.0` tag the package is also published to npm so it can be installed by version and listed in the Pi gallery via the `pi-package` keyword. The git URL stays first in the README because it tracks the pinned upstream commit recorded in `NOTICE` most transparently; npm is the convenience route. Both routes install the same tree — there is no divergent build. This affects only the README install section and the M6 release checklist, not the §4 layout or the `pi` manifest.

### D13 — Dependency packaging: separate pinned installs, not bundled dependencies

**Decision (was open question #3):** `pi-subagents` and `pi-web-access` remain **separately installed Pi packages**, pinned in the documentation to the versions validated during implementation (currently `pi-subagents@0.69.0`, `pi-web-access@0.29.0`). They are **not** declared as ordinary npm `dependencies` of this package.

Why not bundle them: Pi activates extension resources per *installed* package — the package is registered in settings and Pi reads its `pi.extensions` manifest. A transitive dependency under `node_modules` is not an activated package, so bundling would require this package to declare `pi.extensions` paths pointing into `node_modules`, which is fragile across install scopes and package managers, and would also contradict D10's fail-loud preflight (a missing prerequisite must be visible, not silently satisfied by a nested copy). Bundling also cannot serve the `pi-web-access` child-extension path in D14, which resolves against the actual install root.

**Upgrade policy — "can newer versions be installed without breaking anything?"** Newer versions are *allowed* but not *guaranteed*. A user may upgrade either package independently. What "pinned" means in practice depends on the install command, and the README must say so explicitly:

| Installed as | Effect |
|---|---|
| `npm:pi-subagents@0.69.0` (the documented command) | **Version-pinned.** Pi skips it during `pi update --extensions` / `pi update --all`. It moves only when the user acts: `pi install npm:pi-subagents@<new>` or `pi update npm:pi-subagents`. |
| `npm:pi-subagents` (no version) | **Floating.** Bulk updates advance it automatically. |
| `git:...@v1.0.0` | Ref-pinned, same as a versioned npm spec: bulk updates reconcile to the ref but do not move it. |

So "pinned" here means *validated-at-this-version and skipped by bulk updates*, never hard-locked. The contract this package depends on is a specific surface:

- `pi-subagents`: the `subagent` tool, background dispatch and result retrieval, run-identity persistence, and the `subagentOnlyExtensions` path semantics (D14).
- `pi-web-access`: the four tool names `web_search`, `fetch_content`, `get_search_content`, `source_check`.

Drift in that surface must surface as a failure, never as silent misbehavior: the D10 preflight verifies the tools are registered before a dependent skill runs, and the M6 smoke test exercises the pinned versions (required) plus latest (informational). The README states that only the pinned versions are validated. If an upgrade breaks the preflight, the remedy is to reinstall the pinned version — not to weaken the check.

### D14 — Child extension loading: resolve the `pi-web-access` path at setup time, don't hardcode it

**Decision (was open question #4):** `pi-subagents` loads child extensions by **filesystem path**, not by package name. This is not a skill-installation mechanism — skills are installed the standard Pi way (D1: `pi install` plus the package's `pi.skills` manifest); this field only controls which extension a child *process* loads. There is no package-ID form:

- `extensions` / `subagentOnlyExtensions` take paths (for example `./tools/child-only-search.ts`), resolved by ordinary extension resolution.
- `pi-web-access` declares `"pi": { "extensions": ["./index.ts"] }`, and Pi installs packages to `~/.pi/agent/npm/<pkg>/` (user) or `.pi/npm/<pkg>/` (project, `-l`), or the git equivalents.

Because that install root varies by scope (user vs project) and source (npm vs git), the path **must not be hardcoded**. Chosen approach:

1. Resolve the installed `pi-web-access` extension entry path at **setup time** from the actual install root, and write it into project settings via `subagents.defaultExtensions`, or into the shipped agent frontmatter for agents that need it.
2. Lock the resolved path with an M6 integration test that launches a real child and asserts the four tool names are registered; a missing provider must fail the run with the unavailable names, per `pi-subagents`' own preflight.
3. Scope it correctly — for the research path this is a **non-issue**, because `mp-researcher` is dispatched as a **background** (detached) child, and background children already load the parent's ambient extensions. The explicit path matters only for **foreground** children, which is why the `mp-review-*` agents are the real users of this decision. **This corrects an earlier error in this plan:** the previous text applied the foreground restriction to the background research children and assumed background runs needed the configuration; only foreground children do.
4. The foreground `mp-review-standards` / `mp-review-spec` agents get repo-read tools only; they receive web tools only if a review task genuinely requires web evidence, in which case the same resolved path is applied.
5. **Possible simplification, to confirm in M2 before building anything:** if no foreground child needs web tools — which is the case whenever `mp-review-*` stays repo-read-only — then **no child-extension path configuration is needed at all**, and step 1 can be dropped entirely. In that case D14 becomes a documentation note ("background research children inherit `pi-web-access` ambiently") rather than an implementation task, and the M2/M6 path-resolution work disappears. Confirm this before writing any resolution code; do not build machinery for a case that no shipped agent exercises.

Rejected alternatives: hardcoding `~/.pi/agent/npm/pi-web-access/index.ts` (breaks for project-local and git installs); relying solely on ambient loading (works for background children, but not for foreground ones, so it cannot cover every launch path).

### D15 — `teach` ships in v1; `setup-pre-commit` is deferred

**Decision (was open question #6):** `teach` is ported in v1 (M5) and shipped as "experimental" in the README, because it is user-invoked, guide-covered, and carries no runtime prerequisite. `setup-pre-commit` is **deferred to post-v1** and tracked in §10 Next steps; it is removed from the M5 port list, from the §4 tree, and its §2 disposition changes from "port if low effort" to "defer". Keeping it out of v1 avoids adding a second repository-configuration surface (its own tooling assumptions, install steps, and tests) alongside the setup skill D6 already defines.

### D16 — Reuse `pi-subagents`' orchestration; keep custom agents only for Matt-specific contracts

The pinned `pi-subagents` package already ships what M2 was about to reinvent:

- **Built-in agents:** `researcher` (declares exactly `read, write, web_search, fetch_content, get_search_content, source_check`), `evidence-auditor`, `reviewer`, `scout`, `worker`, `oracle`, `delegate`.
- **Bundled prompts:** `parallel-review.md`, `parallel-research.md`, `review-loop.md`, `council.md`, `gather-context-and-clarify.md`, `parallel-cleanup.md`.
- **A bundled `pi-subagents` skill** plus `references/*.md`, automatically available to the parent whenever the extension is installed.

**Options considered:**

| Option | Mechanism | Cost |
|---|---|---|
| A — Reuse built-ins as-is; delete `mp-researcher` / `mp-evidence-auditor` | Reference `researcher` / `evidence-auditor` / `reviewer` directly | Fewest files, upstream-maintained. But the bundled `parallel-review.md` states its angles are "examples, not fixed defaults" and generates them dynamically, which directly contradicts Matt's `code-review` contract. Silently changes the methodology. |
| B — Keep custom agent definitions for the contract; delegate generic orchestration to the bundled assets (chosen) | Ship `mp-*` agents for their prescribed outputs; keep orchestration prose minimal and non-contradictory; let the bundled `pi-subagents` skill own delegation mechanics | Four files to maintain, and their behavior is inside D13's dependency surface. No new *kind* of risk. |
| C — Fully custom; ignore what the package ships | Current plan before this decision | Duplicates orchestration text the parent already has in context via the bundled skill, and can drift from it. |
| D — Built-ins plus `subagents.agentOverrides.<name>.systemPrompt` | Override the built-in prompts in settings | Overrides live in **settings**, which a package cannot ship, so setup would have to write Matt's contract into every user's project settings. Moves the methodology out of the package. |

**Decision: Option B.** The justification for custom agents is narrow but real: Matt's `code-review` requires exactly **two fixed, named axes** with prescribed outputs — Standards (cite the documented repo rule, separate hard violations from judgement calls, apply the code-smell baseline, skip what tooling enforces) and Spec (fidelity to the originating ticket's acceptance criteria and exclusions) — whereas the bundled `parallel-review.md` deliberately chooses angles dynamically. Likewise the guide prescribes the research note's contents, which the built-in `researcher`'s own format only approximates. Those are *contracts*, and they must travel with the package.

Orchestration is not a contract. Fresh vs. forked context, distinct angles, "do not rely on the parent transcript", the researcher/scout split, and review-loop mechanics are generic, already written, and already tested upstream. So:

1. Ship `mp-researcher`, `mp-evidence-auditor`, `mp-review-standards`, `mp-review-spec` — each encoding Matt's required outputs and read/write ceiling.
2. Do **not** copy the bundled prompt text into these agents or into the ported skills. Reference the requirement, not the prose: a second copy would create a sync surface that D9's fork-and-patch model does not cover.
3. Ported skills must not re-teach `pi-subagents` mechanics (how to call `subagent`, fresh vs. fork, angle selection, run identity). The parent already has the bundled `pi-subagents` skill in context; restating it invites contradiction.
4. Where a ported skill and a bundled prompt disagree about *orchestration*, the bundled prompt wins. Where they disagree about the *contract*, D16 wins — that is the whole reason these agents exist.
5. `mp-evidence-auditor` is retained deliberately even though built-in `evidence-auditor` exists, because the guide's verification step requires checking a specific claim against specific sources rather than a general second opinion. If M4 shows the two are functionally identical in practice, collapse to the built-in and record the change here.

---

## 6. Work plan

Each milestone is a vertical slice: it leaves the package loadable and the already-ported skills usable. Blocking edges shown as `blocked by`.

### M0 — Package scaffolding (blocking: none)

- [ ] `package.json`: name, version `0.1.0`, `license: MIT`, `keywords: ["pi-package"]`, `pi.skills`, no runtime deps.
- [ ] `README.md`: git-URL install route first, then npm (D12); document the prerequisites **per capability** (§1 table: `pi-subagents` for any delegating skill, `pi-web-access` only for research) with the exact install commands, and state the pinned-vs-floating update behavior from D13 so "pinned" is not read as "locked" (D13); document the invocation model — user-invoked skills are started **only** by typing `/skill:<name>`, model-invoked skills load on demand (D3, including the `enableSkillCommands` requirement) — plus the skill index table with an invocation column; include a troubleshooting entry for a shadowed skill name ("the wrong `/skill:<name>` runs") with the remove/rename/reorder fix (D11).
- [ ] `LICENSE`, `NOTICE` (pinned commit), `CHANGELOG.md`.
- [ ] `.pi/settings.json` dev config pointing skills at `./skills`.
- [ ] Minimal placeholder skill to prove discovery, then remove.

**Acceptance:** `pi install ./pi-adapted-mp-skills` into a scratch repo loads the placeholder skill; `/skill:<placeholder>` runs; system prompt lists it.

### M1 — Inventory + adaptation contract (blocked by M0)

- [ ] For every upstream `SKILL.md` under `skills/{engineering,productivity,misc}`: record `disable-model-invocation`, referenced sidecar files, absolute/relative links, cross-skill `SKILL.md` loads (target skill and its bucket), and harness-specific tokens.
- [ ] Freeze the §5 token map; add any missed token to D5.
- [ ] Confirm dispositions in §2; move anything uncertain to "defer".
- [ ] Machine-readable inventory committed at `docs/skill-inventory.json` (drives M6 validation).

**Acceptance:** inventory covers 100% of upstream root `SKILL.md` files; every one has a disposition and an owner milestone. No skill is ported before its token needs are covered.

### M2 — Convention layer (blocked by M1)

- [ ] Adapt the setup skill's own sidecar templates in place, inside `skills/engineering/setup-matt-pocock-skills/`: `issue-tracker-{local,github,gitlab}.md`, `domain.md`, `triage-labels.md` (per D7; `gh`/`glab` commands use `bash`). Do **not** create a package-level `docs/agents/`.
- [ ] `scripts/validate-skills.mjs`: name regex, description length ≤1024, required frontmatter, cross-skill `SKILL.md` references resolved against the referencing file's directory (both `../<name>/SKILL.md` and `../../<bucket>/<name>/SKILL.md` forms) with the target's frontmatter `name` matching the name used in the instruction (D4), forbidden tokens (`Skill tool`, `Task tool`, `/clear`, `CLAUDE.md`, `agents/openai.yaml`) with **no allowlist** — substitution is total, so any occurrence is a porting error (D5) — user-invoked ↔ description-style consistency, and a duplicate-name check across `skills/` (D11).
- [ ] Define the exact `pi-subagents` calls the ported skills use — agent name, foreground/background, context (fresh vs fork), and how run identity, result retrieval, cancellation, and failure are handled. Scope this to *our* dispatch sites only; per D16 the generic delegation mechanics stay owned by the bundled `pi-subagents` skill and must not be restated in the ported skills.
- [ ] Add package-discovered `mp-researcher` and `mp-evidence-auditor` agent definitions. `mp-researcher` runs as a background child and therefore needs no explicit extension path (D14); confirm that at launch instead of configuring one. Record the resolved `pi-web-access` extension path only for agents that run foreground (see the `mp-review-*` bullet). Per D16, encode Matt's required outputs, not the bundled prompts' prose.
- [ ] Add package-discovered `mp-review-standards` and `mp-review-spec` definitions with separate prompts and read-only capability ceilings, encoding the two fixed named axes Matt's `code-review` requires (D16). Do not copy `parallel-review.md`.
- [ ] `setup-matt-pocock-skills/SKILL.md` rewritten for Pi per D6, including the ordered preflight for `subagent`, `web_search`, `fetch_content`, `get_search_content`, and `source_check` with pinned install commands for missing packages, plus the D11 skill-name collision check.
- [ ] `ask-matt/SKILL.md` + `PHASE-BOUNDARIES.md` adapted to Pi commands (`/new`, `/compact`) and Pi skill labels.

**Acceptance:** setup runs against a scratch repo and produces that repo's `AGENTS.md` + `docs/agents/*` (output, not templates); ask-matt routes correctly in a scripted manual test.

### M3 — Main flow (blocked by M2)

Port: `grill-with-docs`, `grilling`, `domain-modeling` (+formats), `to-spec`, `to-tickets`, `implement`, `tdd` (+tests/mocking), `code-review`, `prototype` (+logic/UI), `handoff`.

- [ ] Copy → apply token map → metadata → run validator.
- [ ] `code-review` dispatches `mp-review-standards` and `mp-review-spec` concurrently, with fresh isolated contexts and read-only tools; the parent keeps their findings separate before synthesis.
- [ ] `handoff` writes to `.scratch/handoffs/`, adding that path to `.gitignore` if not already ignored (D5 default; a repo may opt in to committing handoffs, but committing is never the default).
- [ ] Cross-skill references use D4.

**Acceptance:** on a fixture repo, run `/skill:grill-with-docs` → `/skill:to-spec` → `/skill:to-tickets` → `/skill:implement` on one ticket, in one and in split sessions, with only Pi tools.

### M4 — On-ramps, discovery, and health (blocked by M2; parallelizable with M3)

Port: `wayfinder`, `research`, `triage` (+brief/out-of-scope), `diagnosing-bugs` (+script), `improve-codebase-architecture` (+report), `codebase-design` (+deepening/design-twice), `resolving-merge-conflicts`, `wizard` (+template).

- [ ] `wayfinder`/`research`: dispatch initially visible independent research tickets as background `mp-researcher` children through `pi-subagents`. Because these run in a detached process, ambient extensions supply `pi-web-access` and no explicit path is configured (D14); persist run identities, collect every result, and record failures without resolving affected tickets. Per D16, the skill names the requirement and the agent; the bundled `pi-subagents` skill owns how the dispatch is performed.
- [ ] Confirm whether built-in `evidence-auditor` and `mp-evidence-auditor` are functionally distinct in practice; if not, collapse to the built-in and record the change under D16 item 5.
- [ ] Before each research launch, verify the child has `web_search`, `fetch_content`, `get_search_content`, and `source_check`; a missing tool is a setup failure, not permission to weaken the research method.
- [ ] Prevent concurrent children from editing shared map/ticket files: children return evidence or write unique research artifacts; the parent serializes tracker and map updates.
- [ ] `triage`: labels map to `docs/agents/triage-labels.md`; local/github/gitlab paths tested.
- [ ] `wizard`/`diagnosing-bugs`: keep shell templates; verify they run under Pi's `bash` on Linux/macOS and note Windows limits.
- [ ] `improve-codebase-architecture`: write the HTML report to `.scratch/reports/<ISO>-architecture.html` (git-ignored, D5) instead of the OS temp directory, and print the absolute path for the user to open.

**Acceptance:** each skill loads, references resolve, and the scripted smoke scenarios in M6 list pass for at least the local-Markdown tracker.

### M5 — Productivity and misc (blocked by M2)

Port: `grill-me`, `to-questionnaire`, `wait-what`, `writing-for-agents`, `teach`, `git-guardrails` (renamed). `setup-pre-commit` is **not** ported in v1 (D15) and is tracked in §10 Next steps.

**Acceptance:** loads and lints; `teach` ships as "experimental" in the README per D15.

### M6 — Validation, docs, release (blocked by M3, M4, M5)

- [ ] `scripts/smoke-test.sh`: install pinned `pi-subagents`, pinned `pi-web-access`, and this package into a fixture repo; assert parent and research-child tool availability; assert every package skill name resolves to this package's `skills/` path (collision check, D11); assert every cross-skill `SKILL.md` reference resolves from the **installed** package copy, not just the working repo (D4); assert `enableSkillCommands` is on and that each user-invoked skill resolves as `/skill:<name>` while each model-invoked skill appears in the system prompt (D3); run a scripted local-Markdown workflow.
- [ ] Invocation-model test (D3): for a sample of user-invoked skills, assert a natural-language request does **not** start the skill and assert `/skill:<name>` does; for a sample of model-invoked skills, assert the reverse. This is the check most likely to regress silently.
- [ ] Collision test: install a decoy skill with a colliding name into the fixture repo before this package and assert setup reports the colliding name and its source (D11); where provenance is unavailable, assert it reports the name as unattributed rather than silently claiming resolution.
- [ ] Parallelism tests: overlapping research children actually run concurrently; both review axes complete; child failure/abort/timeout leaves affected tickets unresolved and visible.
- [ ] Child-extension integration test (D14): launch a real foreground child and assert `web_search`, `fetch_content`, `get_search_content`, and `source_check` are registered from the resolved `pi-web-access` path; assert a missing provider fails the run with the unavailable names.
- [ ] Upgrade-policy validation (D13): run the smoke test against the pinned versions (must pass) and against the latest versions (informational; record any drift in the README compatibility note).
- [ ] `scripts/fetch-upstream.mjs`: fetch pinned commit, diff against ported files, report drift.
- [ ] Full-repo validator run in a `npm test` script; zero errors.
- [ ] Human review against the guide's checklists (before `/to-spec`, `/to-tickets`, `/implement`, closing a ticket, phase boundary).
- [ ] README skill index finalized with invocation column, the git-URL install route first (D12), and a compatibility note stating only the pinned `pi-subagents`/`pi-web-access` versions are validated (D13); `CHANGELOG` 0.1.0.
- [ ] Tag `v0.1.0` and publish to npm (D12).
- [ ] Stretch: GitHub Action running the validator on PRs.

**Acceptance:** fresh machine + fresh repo → install → complete the guide's "Small Feature Example" and the first three sessions of the "Amazon Refund Import" worked example without touching a Claude-only mechanism.

---

## 7. Validation strategy

| Layer | Check | Tool |
|---|---|---|
| Static | Frontmatter valid, names/descriptions within limits | `scripts/validate-skills.mjs` |
| Static | No forbidden harness tokens; every sidecar file present | same |
| Static | Every cross-skill `SKILL.md` reference resolves from the referencing file's directory and names the right skill (D4) | `scripts/validate-skills.mjs` |
| Discovery | Pi lists every skill with correct model/user visibility | `scripts/smoke-test.sh` + system-prompt inspection |
| Discovery | User-invoked skills resolve as `/skill:<name>` with `enableSkillCommands` on; model-invoked skills appear in the system prompt (D3) | setup preflight + `scripts/smoke-test.sh` |
| Discovery | Duplicate skill-name definitions across this package, project/global dirs, and installed packages are detected and attributed where Pi exposes provenance; unattributable names are reported as such rather than assumed (D11) | setup preflight + `scripts/validate-skills.mjs` duplicate-name check + `scripts/smoke-test.sh` resolution assertion |
| Behavioral | Scripted workflows on a fixture repo (main flow, Wayfinder-lite, triage, handoff, diagnosis) | manual + smoke script |
| Behavioral | Preflight behaves as specified: name collision and `enableSkillCommands` disabled block setup; missing `subagent` marks `research`/`wayfinder`/`code-review`/`implement` unavailable; missing web tools marks only `research`/`wayfinder`; each prints its prescribed remedy | manual + smoke script |
| Fidelity | Ported body differs from upstream only in mapped regions | `scripts/fetch-upstream.mjs` diff review |
| Documentation | Guide vocabulary still matches skill names and commands | review against guide checklists |

Invocation-visibility test is the one most likely to regress, so it needs two different probes (D3): for each user-invoked skill, confirm it does **not** appear as auto-loadable **and** that `/skill:<name>` resolves while `enableSkillCommands` is on; for each model-invoked skill, confirm its name and description do appear in the system prompt and are rich enough to fire. Record results in `docs/skill-inventory.json`.

---

## 8. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Upstream churn invalidates the port | Medium | Pin commit; `fetch-upstream.mjs` drift report; sync as a reviewed milestone |
| Pi model doesn't load skills on demand (documented behavior risk) | High | Rich model-facing descriptions; explicit D4 instructions; recommend `/skill:` for critical steps |
| Cross-skill relative paths break after install | High | Validator check + smoke test from an installed package, not just the repo |
| `pi-subagents` missing, disabled, or API-incompatible | High | Capability-scoped hard preflight blocks only `research`/`wayfinder`/`code-review`/`implement` — deliberate choice, see D10 |
| `pi-web-access` not registered in a child that needs it | Medium | `pi-subagents` fails the run naming the unavailable tools rather than continuing without them; background research children load ambient extensions, and any foreground child needing web tools gets an explicit resolved path (D14) |
| Concurrent children mutate shared tracker/map files | High | Read-only/isolated children; unique artifact paths; parent serializes durable updates |
| Background child fails or is abandoned | Medium | Persist run identity; explicit status/result/timeout handling; never resolve its ticket without evidence |
| Tracker templates work for local Markdown but not `gh`/`glab` | Medium | M6 tests all three; local Markdown is the default |
| Pi's lenient validation hides malformed skills | Medium | Strict repo-level validator in CI/`npm test` |
| Our agent definitions drift from the bundled `pi-subagents` prompts they parallel (D16) | Medium | We encode contracts, not bundled prose, so there is no text to drift; M4 checks that `mp-evidence-auditor` is still functionally distinct from built-in `evidence-auditor`; a real divergence surfaces as a failing behavioral test |
| An installed skill name collides with this package's identical upstream name, silently shadowing it | Medium | Keep names verbatim (D11) but fail loud: setup preflight + validator duplicate-name check + smoke-test resolution assertion + README remedy; no prefixing, no silent proceed |
| Scope creep from `in-progress` skills | Low | Explicitly deferred in §1 |
| License/attribution omission | Low | `NOTICE` + README credit + upstream LICENSE retained |

---

## 9. Open questions

1. ~~Distribution~~ — **resolved (D12):** git URL is the primary documented route for v1; publish to npm at the `v0.1.0` tag for discoverability and version pinning.
2. ~~Skill naming~~ — **resolved:** keep exact upstream names verbatim; mitigate collision risk with a setup-time and CI collision check rather than prefixing (D11).
3. ~~Dependency packaging~~ — **resolved (D13):** keep `pi-subagents` and `pi-web-access` as separate pinned `pi install` prerequisites; do not bundle them as ordinary npm dependencies. Upgrade policy recorded in D13.
4. ~~Child extension identifier~~ — **resolved (D14):** `subagentOnlyExtensions` takes a filesystem path, not a package ID; resolve the installed `pi-web-access` entry path at setup time and lock it with an M6 integration test. This is a foreground-only concern — background children already load ambient extensions.
5. ~~Handoff durability~~ — **resolved:** git-ignored by default; rationale recorded in D5.
6. ~~`teach` and `setup-pre-commit`~~ — **resolved (D15):** ship `teach` in v1; defer `setup-pre-commit` to post-v1 (§10 Next steps).

**Open questions remaining: none.** Q4's mechanism is settled in D14; the only follow-up is the integration test that locks the resolved path, which is scheduled work in M2/M6, not an open question.

---

## 10. Next steps (deferred work and follow-ups)

Everything deliberately pushed past v0.1.0, plus the follow-ups that are scheduled but not blocking. Each entry names why it was deferred and what would trigger picking it up.

### Deferred skills

| Item | Deferred because | Trigger to pick up |
|---|---|---|
| `setup-pre-commit` (misc) | Not part of the core engineering workflow; adds a repo-configuration surface with its own tooling assumptions and testing burden for little workflow value in v1 (D15). | After M6, or on first concrete user request. Port as a model-invoked `misc` skill with the same token-map and validator treatment as the rest. |
| `skills/in-progress/*` — all nine: `pr`, `retro`, `implement-spec`, `claude-handoff`, `loop-me`, `setup-ts-deep-modules`, `writing-beats`, `writing-fragments`, `writing-shape` | Upstream marks them non-canonical and still moving; porting them would freeze unstable behavior and break the D9 fork-and-patch sync model. | After M6, re-check upstream `main`; port the ones that have stabilized. Priority: `pr` and `implement-spec` first (closest to the delivered workflow), then the three `writing-*` skills together (they form a writing track that would sit in `productivity/` next to `writing-for-agents`), then `retro`/`loop-me`, then `claude-handoff`/`setup-ts-deep-modules` last. |
| `skills/deprecated/*` | Upstream has withdrawn them. | Never, unless upstream un-deprecates one. |
| `setup-ts-deep-modules`, `migrate-to-shoehorn` | Language/framework-specific; out of scope for a general workflow port. These are separate cases: `migrate-to-shoehorn` is canonical in `misc/` and dropped on scope grounds, while `setup-ts-deep-modules` is `in-progress/` and deferred on maturity grounds (see the `in-progress` row above). | Only if this package deliberately grows a TS-specific track. |
| `scaffold-exercises` | Course-authoring; unrelated to the engineering workflow. | Not planned. |

`teach` is **not** deferred: it ships in v1 as "experimental" (D15).

### Scheduled follow-ups (inside v1 milestones)

| Item | Where it lands |
|---|---|
| Confirm whether any foreground child needs web tools; if none does, close D14 as documentation only and drop the path-resolution work | M2 |
| Confirm the exact `pi-subagents` API surface relied on (`subagent`, background dispatch/wait, run identity, failure handling) against the pinned version | M2 |
| Validate the upgrade policy in D13: run the smoke test against the pinned versions (required) and against latest (informational) | M6 |
| Re-run the collision check (D11) from a fresh install, including the decoy-collision test | M6 |
| Verify the invocation model end to end (D3): user-invoked skills start only via `/skill:<name>`, model-invoked skills load on demand, and `enableSkillCommands` is confirmed on | M2 (probe definition) → M6 (test) |
| Verify the local-Markdown, `gh`, and `glab` tracker templates all work | M6 |
| Windows note for `wizard` / `diagnosing-bugs` shell templates under Pi's `bash` | M4 → M6 |

### Post-v1 candidates (explicitly not started)

| Item | Notes |
|---|---|
| Publish to npm (`pi-adapted-mp-skills`) | D12 makes this part of the `v0.1.0` release; listed here only as the remaining release step if it slips. |
| `fetch-upstream.mjs` drift automation in CI | Scheduled as a stretch task in M6; a GitHub Action running it plus the validator is the natural next step. |
| Bundled dependency packaging (D13 option B) | Revisit only if separate pinned installs prove too error-prone for users to follow. |
| Graceful degradation for subagents/web (D10 option B/C) | Revisit only if the hard gate proves to be a real adoption blocker. |

---

## 11. Appendix — Pi skill reference (from Pi docs)

**Locations:** `~/.pi/agent/skills/`, `~/.agents/skills/`, `.pi/skills/`, project `.agents/skills/`, packages (`pi.skills` / `skills/`), settings `skills`, CLI `--skill`.

**Structure:** directory per skill with `SKILL.md` + optional `scripts/`, `references/`, `assets/`. Relative paths resolve from the skill directory.

**Frontmatter:** `name` (required, ≤64 chars, lowercase/hyphens), `description` (required, ≤1024), `license`, `compatibility`, `metadata`, `allowed-tools`, `disable-model-invocation`.

**Invocation:** `/skill:<name>` when `enableSkillCommands` is on; model auto-loads model-invoked skills. `disable-model-invocation: true` hides a skill from the system prompt.

**Built-in tools:** `read`, `bash`, `powershell` (Windows), `edit`, `write`, `grep`, `find`, `ls`.

**Session/context:** `/new` (fresh session), `/compact [instructions]`, `/fork`, `/clone`.

**Packaging:** `pi install <source>`, `pi` manifest or convention directories (`extensions/`, `skills/`, `prompts/`, `themes/`), `pi-package` keyword for the gallery.
