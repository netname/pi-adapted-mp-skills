# pi-adapted-mp-skills

Matt Pocock's engineering-workflow skills, ported to run natively in the
[Pi coding agent](https://github.com/earendil-works/pi-mono).

The methodology is unchanged: idea → clarify → spec → tickets → implement, plus Wayfinder,
triage, diagnosis, and the model-invoked disciplines. The Claude-Code/Codex mechanics are
replaced with Pi equivalents (see [`docs/ADAPTATION_PLAN.md`](docs/ADAPTATION_PLAN.md) for
the decision record, and
[`docs/Matt_Pocock_Skills_Project_Workflow_Guide.md`](docs/Matt_Pocock_Skills_Project_Workflow_Guide.md)
for the methodology itself).

> **Status: 0.1.0 scaffolding.** This release ships the package shell only. Skills are
> ported across milestones M2–M5; the index below is provisional until M6.

## Install

### Git URL (recommended)

The git route tracks the pinned upstream commit recorded in [`NOTICE`](NOTICE) most
transparently and needs no registry round-trip:

```bash
pi install git:github.com/netname/pi-adapted-mp-skills
```

For development against a local checkout, install the directory directly:

```bash
pi install /absolute/path/to/pi-adapted-mp-skills
```

### npm

Published at the `v0.1.0` tag so it can be installed by version and listed in the Pi
package gallery:

```bash
pi install npm:pi-adapted-mp-skills@0.1.0
```

Both routes install the same tree — there is no divergent build.

## Prerequisites (per capability, not all-or-nothing)

The adapted collection delegates work to Pi packages. **Setup needs neither**, and neither
is an npm dependency of this package: install them as their own Pi packages so Pi activates
their extensions.

```bash
pi install npm:pi-subagents@0.69.0     # subagent tool: isolated children, parallel + background work
pi install npm:pi-web-access@0.29.0    # web_search, fetch_content, get_search_content, source_check
```

| Prerequisite | Required by |
|---|---|
| `pi-subagents@0.69.0` | `research`, `wayfinder`, `code-review`, `implement` (because `implement` invokes `code-review`) |
| `pi-web-access@0.29.0` | `research`, and `wayfinder` only for its research tickets |

Consequences worth stating plainly:

- A user who only wants the main flow — `grill-with-docs` → `to-spec` → `to-tickets` →
  `implement` — needs `pi-subagents` but **not** `pi-web-access`.
- `pi-web-access` becomes necessary the moment you do research.
- Repository setup (`/skill:setup-matt-pocock-skills`) runs with neither installed.

These are hard prerequisites, not graceful-degradation hints. A skill whose capability is
missing stops with the applicable pinned install command; it does not silently fall back to
sequential work or uncited research (D10). Only the pinned versions above are validated.

## Pinned vs. floating

"Pinned" means *validated at this version and skipped by bulk updates* — never hard-locked.
What happens on an update depends on how you installed the package:

| Installed as | Update behavior |
|---|---|
| `npm:pi-subagents@0.69.0` (the documented command) | **Version-pinned.** `pi update --extensions` / `pi update --all` skip it. It moves only on an explicit `pi install npm:pi-subagents@<new>` or `pi update npm:pi-subagents`. |
| `npm:pi-subagents` (no version) | **Floating.** Bulk updates advance it automatically. |
| `git:...@v1.0.0` | **Ref-pinned**, same as a versioned npm spec: bulk updates reconcile to the ref but do not move it to a newer one. |

If an upgrade breaks a skill's preflight, reinstall the pinned version rather than weakening
the check.

## Invocation model

Skills come in two classes, and the difference is not cosmetic.

- **User-invoked skills** set `disable-model-invocation: true`. They are **hidden from the
  system prompt**, so the model never sees them and cannot choose them. The only way to
  start one is for **you** to type:

  ```
  /skill:<name>
  ```

  Natural-language requests do **not** work for these skills — there is nothing for the
  model to match against. For example, type `/skill:to-spec`; do not ask "please write a
  spec". Arguments are appended after the command: `/skill:<name> some args`.

- **Model-invoked skills** have no `disable-model-invocation` field. They are listed in the
  system prompt for the model to load on demand when a task matches, and you can also start
  them yourself with `/skill:<name>`.

Slash commands are registered when `enableSkillCommands` is `true`, which is the default.
**Turning it off makes every user-invoked skill unreachable** — nothing in the model, and no
skill, can report why. Re-enable it in `/settings` or in `settings.json`:

```json
{
  "enableSkillCommands": true
}
```

One user-invoked skill may load a model-invoked one; it must never assume it can load
another user-invoked skill. That is why hand-offs are always phrased as "run
`/skill:<name>`" (D4).

## Skill index (provisional)

Upstream has 29 canonical skills; this package ships 26 of them in v1, of which **14 are
user-invoked** and **12 are model-invoked**. The other three are not shipped (see below).
This table is finalized in M6.

### Engineering (18)

| Skill | Invocation |
|---|---|
| `setup-matt-pocock-skills` | user — `/skill:setup-matt-pocock-skills` |
| `grill-with-docs` | user — `/skill:grill-with-docs` |
| `to-spec` | user — `/skill:to-spec` |
| `to-tickets` | user — `/skill:to-tickets` |
| `wayfinder` | user — `/skill:wayfinder` |
| `implement` | user — `/skill:implement` |
| `triage` | user — `/skill:triage` |
| `ask-matt` | user — `/skill:ask-matt` |
| `improve-codebase-architecture` | user — `/skill:improve-codebase-architecture` |
| `domain-modeling` | model |
| `research` | model |
| `prototype` | model |
| `tdd` | model |
| `code-review` | model |
| `diagnosing-bugs` | model |
| `codebase-design` | model |
| `resolving-merge-conflicts` | model |
| `wizard` | model |

### Productivity (7)

| Skill | Invocation |
|---|---|
| `grill-me` | user — `/skill:grill-me` |
| `handoff` | user — `/skill:handoff` |
| `to-questionnaire` | user — `/skill:to-questionnaire` |
| `wait-what` | user — `/skill:wait-what` |
| `teach` | user — `/skill:teach` (experimental) |
| `grilling` | model |
| `writing-for-agents` | model |

### Misc (1)

| Skill | Invocation |
|---|---|
| `git-guardrails` | model (renamed from upstream `git-guardrails-claude-code`) |

### Not shipped in v1

| Skill | Reason |
|---|---|
| `setup-pre-commit` | Deferred to post-v1 (D15). |
| `scaffold-exercises` | Dropped: course-authoring, outside this package's scope. |
| `migrate-to-shoehorn` | Dropped: language/framework-specific. |

`skills/in-progress/*` and `skills/deprecated/*` are also out of scope for v1.

## Troubleshooting: a shadowed skill name

**Symptom.** The wrong `/skill:<name>` runs, or a skill behaves unexpectedly — for example
`/skill:research` produces output that does not match this package's method.

**Cause.** Skill names are global. If two sources define the same name — this package,
another installed package, project/global skill directories — Pi keeps the **first** skill
registered for that name and only warns. Later definitions are silently shadowed. This
package keeps upstream names verbatim (D11), so `research`, `implement`, `wizard`, and
`teach` are the most likely candidates to collide.

**Remedy.** Remove, rename, or reorder one of the two installations:

1. Inspect the resolution order and provenance:

   ```bash
   pi list --approve   # --approve is needed to read project-scoped settings
   ```

   Then, from an extension or in an interactive session, inspect the command list:

   ```ts
   pi.getCommands().filter((c) => c.source === "skill");
   ```

   Each entry carries `sourceInfo.path`, `sourceInfo.origin` (`package` | `top-level`), and
   `sourceInfo.scope` (`user` | `project` | `temporary`). Use `sourceInfo` as the canonical
   provenance — do not infer ownership from the name.

2. Remove the losing/duplicate source (`pi remove <source>`), rename one of the two skills,
   or reorder the sources so the intended definition registers first.

3. Restart Pi (or `/reload`) after changing sources; collisions are resolved at load time.

Because Pi exposes no documented "which source won this name" API, detection is
best-effort. Where a name cannot be attributed, treat it as unattributed rather than
assuming it resolved to this package.

## License and attribution

MIT. Upstream skills are © 2026 Matt Pocock, adapted here under the same MIT license; the
upstream license text is preserved verbatim in [`LICENSE`](LICENSE), and the upstream
repository, pinned commit `c55ee46073ed923f86ce59a5eb3b6d895095d1b7`, and this package's own
repository are recorded in [`NOTICE`](NOTICE). Adapted text remains MIT.

Credit: methodology and original skills by
[Matt Pocock](https://github.com/mattpocock/skills). Pi adaptation by this package.
