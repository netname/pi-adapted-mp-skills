# M0 Implementation Notes — deviations, verifications, open items

Status: **M0 complete** (2026-09-18)
Plan of record: [`ADAPTATION_PLAN.md`](./ADAPTATION_PLAN.md) — §5 decisions D1–D16 are frozen and
were not modified.
Scope of this file: what M0 actually did where the plan was silent, ambiguous, or wrong; the Pi
behaviors that were verified rather than assumed; and the items that still need a human decision.

This file is a record, not a decision. Where it conflicts with §5, §5 wins. It is an addition to
the §4 layout (`docs/` previously listed only the plan and the guide) and deliberately does not
create `docs/agents/`, which is setup's run-time output in the *target* repo (D7).

---

## 1. Deviations from the plan as written

### 1.1 `.pi/settings.json` points at `../skills`, not `./skills`

- **Plan:** §4 and §6/M0 say the dev config points skills at `./skills`.
- **Problem:** Pi's `docs/settings.md` states: "Paths in `.pi/settings.json` resolve relative to
  `.pi`." A literal `./skills` would therefore resolve to `.pi/skills`, which does not exist.
- **Done instead:** `"skills": ["../skills"]`.
- **Evidence:** with a temporary skill at `skills/tmp-devcheck/`, run from the repo root:

  ```
  $ pi -p -a --no-session -e <probe> "/skill:tmp-devcheck"
  DEVCHECK-OK
  skills=[{"name":"skill:tmp-devcheck","path":"C:\\x\\on\\projs\\pi-adapted-mp-skills\\skills\\tmp-devcheck\\SKILL.md","origin":"top-level","scope":"project"}]
  ```

  The temporary skill was removed afterwards. This affects only the dev-time settings file, not
  the `pi` manifest (whose paths are relative to the package root, so `./skills` there is
  correct).

### 1.2 Missing `agents/`: created a placeholder; kept the D1 `subagents` key

- **Plan:** D1 freezes `"subagents": { "agents": ["./agents"] }`; M0 has no agents yet (M2 adds the
  four `mp-*` files). §4's tree shows `agents/` as package content.
- **Verified first:**
  1. The key is real, not invented: `pi-subagents` `docs/agents.md` states installed packages may
     expose agents via `{"pi":{"subagents":{"agents":["./agents"]}}}` (or `pi-subagents.agents`),
     and that package agents load above builtins and below user/project agents.
  2. Pi silently ignores a manifest path that does not exist. A throwaway package declaring
     `pi.skills: ["./skills-does-not-exist"]` and `pi.subagents.agents: ["./agents-does-not-exist"]`
     installed and ran with **no error and no warning**; the probe showed only the ambient
     `find-skills` skill.
- **Done instead:** added `agents/.gitkeep`. Rationale: keeps D1's manifest literally true, keeps
  the directory in git for M2, and — because `.gitkeep` is not `.md` — cannot be parsed as a bogus
  agent definition by `pi-subagents`. The alternative (deferring the `subagents` key and editing
  the manifest in M2) was rejected because it would change a frozen manifest field to work around
  a missing directory.

### 1.3 `skills/.gitkeep` after removing the placeholder

- **Plan:** M0 ships a placeholder skill "to prove discovery, then remove."
- **Problem:** after removal, the manifest's `./skills` path would be absent again, with the same
  silent-ignore behavior as §1.2.
- **Done instead:** deleted `skills/placeholder/`, added `skills/.gitkeep` for symmetry with
  `agents/`. No skill is shipped in M0.

### 1.4 Package repo owner: `netname` inferred from the git remote

- **Plan:** D12/§6 use `<owner>` as a placeholder and the task said to ask.
- **Done instead:** `git remote -v` reports `git@github.com:netname/pi-adapted-mp-skills.git`, so
  `netname` was used in `README.md`, `NOTICE`, and `CHANGELOG.md`.
- **Open:** if the publish target is a different owner, those three files need a one-line URL
  change. Not yet confirmed by the owner.

### 1.5 README credit line names no author

- **Plan:** D8 requires "an MIT credit line to Matt Pocock."
- **Done instead:** the README credits Matt Pocock and describes the adapter as "this package"
  rather than naming an individual, since no author identity is known. Should be replaced with a
  real name/org before the npm publish if one is wanted.

### 1.6 Skill-index counting is made explicit

- **Plan:** §2's inventory has 29 rows; D15 defers `setup-pre-commit`, and `scaffold-exercises` and
  `migrate-to-shoehorn` are dropped.
- **Done instead:** the README states "29 canonical upstream skills; 26 shipped in v1 (14
  user-invoked, 12 model-invoked)" and lists the three non-shipped skills with reasons. This is a
  clarification of §2, not a change to any disposition. Table remains marked provisional until M6.

---

## 2. Pre-existing stray `.agents/` directory (deleted by the owner)

`.agents/.gitkeep` existed in the working tree at the start of M0 (untracked, created
2026-09-18 18:08) and was still present when the M0 files were written. It is **not** the
directory D1 declares (`agents/`, no dot) and was never referenced by any M0 command.

**Resolution:** the repository owner deleted the `.agents/` directory during M0. The working
tree therefore contains only the files listed in §4 plus the tracked `docs/` originals, and
`agents/` (D1) is the only agent directory. Nothing to do; do not recreate `.agents/`.

---

## 3. Pi behaviors verified in M0 (do not re-assume these in later milestones)

| Behavior | How verified | Result |
|---|---|---|
| Package skills are discovered from `pi.skills` and attributed to the package | `pi install <repo> -l` in a scratch dir + `pi.getCommands()` probe | `skill:placeholder` had `origin: "package"`, `scope: "project"`, `path` inside the installed package |
| Skill names appear in the system prompt | probe read `event.systemPrompt` / `event.systemPromptOptions.skills` | `systemPrompt.includes('placeholder')=true`; `skills=["find-skills","placeholder"]` (bare names) |
| `/skill:<name>` executes when passed as a prompt in non-interactive mode | `pi -p -a "/skill:placeholder"` | Skill body was expanded into `event.prompt`; model returned the sentinel `PLACEHOLDER-SKILL-ACTIVE` |
| Absent `pi` manifest paths are silently ignored | throwaway package with two nonexistent manifest paths | Ran clean, no warning, nothing loaded from those paths |
| Settings-path base directory | temporary skill + `.pi/settings.json` with `../skills` | Resolved to the repo's `skills/` (`scope: "project"`) |
| `pi list` and project scope | `pi list` vs `pi list --approve` in the scratch dir | Without trust only user packages print; `--approve` adds a "Project packages" section |
| `enableSkillCommands` default | `docs/skills.md` + `docs/settings.md` | `true`; disabling it makes all `/skill:` commands unreachable (documented in README per D3) |

`pi.getCommands()` entry shape observed: `{ name, description?, source: "extension" \| "prompt" \| "skill",
sourceInfo: { path, source, scope: "user" \| "project" \| "temporary", origin: "package" \| "top-level", baseDir? } }`.
This is the provenance surface M2's collision check (D6c/D11) and the M6 smoke test must use.

---

## 4. M0 acceptance test as run, and resulting tree

Files present in the working tree after M0 (all untracked at the time of writing):

```
.pi/settings.json   CHANGELOG.md   LICENSE   NOTICE   README.md
agents/.gitkeep     package.json   skills/.gitkeep        docs/NOTES.md
```

```bash
SCRATCH=$(mktemp -d) && cd "$SCRATCH"          # outside the repo
pi install "C:/x/on/projs/pi-adapted-mp-skills" -l
# -> Installing ... / Installed ...

M0_PROBE_LOG=$SCRATCH/m0-probe.log \
  pi -p -a --no-session -e "$SCRATCH/probe.ts" "/skill:placeholder"
# -> PLACEHOLDER-SKILL-ACTIVE
# probe log: skill:placeholder -> origin=package, scope=project,
#            path=<repo>/skills/placeholder/SKILL.md
#            systemPrompt.includes('placeholder')=true
```

Install was project-scoped (`-l`) so global settings were untouched; the scratch directories were
deleted afterwards. `~/.pi/agent/settings.json` contains no reference to this package.

---

## 5. Open items

1. Confirm (or correct) the GitHub owner `netname` in `README.md`, `NOTICE`, `CHANGELOG.md`.
2. Confirm whether the published `pi-subagents@0.69.0` help still matches the `pi.subagents.agents`
   manifest key at M2, when the four `mp-*` agents are added and actually exercised.
3. §6/M2's "confirm no foreground child needs web tools" simplification for D14 remains open; M0
   has no agents, so nothing was resolved.

---

## M1 — Upstream inventory and adaptation contract (2026-09-18)

Scope of this section: what M1 actually found in the pinned upstream tree, what it added to the
frozen D5 map, where §2 was confirmed, and every place §5/§6 was silent or wrong. M1 ports nothing.

### 1. Assumptions made (both reversible)

1. **Inventory scope: all 38 `SKILL.md` files**, not only the 29 canonical ones. This is the
   recommendation in the task preamble and it is what §2 and §10 already assume (the nine
   `in-progress` skills are tracked deferrals), and M6's drift check needs the complete map.
2. **Upstream checkout cached outside the repo at `../mp-upstream-c55ee46`**, a disposable clone at
   the pinned commit, not vendored. The re-fetch command is recorded in
   `docs/skill-inventory.json` → `upstream.cacheNote`. If a different stable path is preferred for
   M2–M5, only that field and this bullet need changing.
3. **The GitHub owner `netname` was left as-is** (M0 §5 item 1). Non-blocking; it affects only
   README/NOTICE/CHANGELOG, not the inventory.

### 2. Inventory scope and counts

Pinned commit `c55ee46073ed923f86ce59a5eb3b6d895095d1b7` (`main` as of 2026-09-18). Full
machine-readable inventory: [`docs/skill-inventory.json`](./skill-inventory.json).

| Bucket | Skills | Invocation | Disposition |
|---|---|---|---|
| `engineering` | 18 | 9 user / 9 model | 14 port, 4 adapt |
| `productivity` | 7 | 5 user / 2 model | 6 port, 1 adapt |
| `misc` | 4 | 0 user / 4 model | 1 rename, 1 defer, 2 drop |
| `in-progress` | 9 | 8 user / 1 model | 9 defer |
| `deprecated` | 0 | — | — |
| **Total** | **38** | **22 user / 16 model** | **20 port, 5 adapt, 1 rename, 10 defer, 2 drop** |

v1 ships **26** (14 user-invoked, 12 model-invoked), deferring 10 and dropping 2. This matches
M0's README figure of "29 canonical upstream skills; 26 shipped in v1".

### 3. `skills/deprecated/` is empty at the pin

The directory exists but contains only `README.md`, which states the bucket is currently empty
("a retired skill is deleted, and the changeset that removes it names whatever replaced it"). So
the plan's `deprecated/*` row is empty at this commit, as the task instructed to record, rather
than assumed. It is recorded at repo level in `skill-inventory.json` → `buckets`.

### 4. D5 rows added by M1, and what motivated each

Six rows were appended to the §5/D5 table. **No existing row was changed.** The map is now
version 2; its SHA-256 over the canonical `(rowId, upstream, pi)` tuples is
`9e86593bef1167039b66b4eb7d8dc69b5cda1cb647cde6e9fb086ad1e4bcda10` (recorded in
`tokenMap.hash`, recomputable from `tokenMap.rows`, so M6 can detect drift).

| Row | Upstream token missed by D5 | Motivating skill(s) |
|---|---|---|
| D5-16 | Bare `/<skill-name>` slash-command reference | `ask-matt` (24 labels — by far the densest), `implement` (`/tdd`, `/code-review`, operative), `code-review` / `to-spec` / `to-tickets` / `triage` / `wayfinder` (`/setup-matt-pocock-skills`, human hand-off), `improve-codebase-architecture` (`/codebase-design`). Also in ported sidecars: `ask-matt/PHASE-BOUNDARIES.md`, `improve-codebase-architecture/HTML-REPORT.md`, `setup-matt-pocock-skills/{domain,issue-tracker-github,issue-tracker-gitlab,issue-tracker-local}.md`, `triage/AGENT-BRIEF.md`, `wizard/template.sh`. |
| D5-17 | `agents/openai.yaml` (Codex `interface.*`, `policy.allow_implicit_invocation`) | All 38 skills ship one as a sidecar. D5's prose already declared it banned with no allowlist, but the table had no row. |
| D5-18 | `argument-hint` (frontmatter) | `handoff`, `teach`, `claude-handoff`, `loop-me`. |
| D5-19 | `allowed-tools` (frontmatter) | Zero upstream occurrences at the pin. Prospective row so the D2 policy has a map entry. |
| D5-20 | Claude Code hook mechanism: `PreToolUse` on `Bash`, `.claude/settings.json`, `~/.claude`, `$CLAUDE_PROJECT_DIR` | `git-guardrails-claude-code` (→ `git-guardrails`). |
| D5-21 | `claude --bg` / `claude agents` | `in-progress/claude-handoff` (deferred; prospective). |

Only D5-16 and D5-20 are load-bearing for v1. D5-17/18 are drop rules. D5-19/21 are prospective.

### 5. §2 disposition confirmation

**Every one of §2's 29 canonical dispositions is confirmed; zero corrections, zero moves to
`defer`.** `disable-model-invocation` was read from each of the 38 files (not copied from §2), and
all 29 canonical invocation values match §2 exactly: 14 user-invoked, 15 model-invoked, 12 of the
model-invoked shipped in v1. The nine `in-progress` skills were also verified: 8 are user-invoked,
1 (`pr`) is model-invoked — §2's "mixed (verify each in M1)" is resolved in
`skill-inventory.json` → `invocationSummary`.

The one place uncertainty remains is **not** a disposition: the *mechanism* for `git-guardrails`
(see §6 below). Its disposition stays `rename` because D3 freezes the rename and the task requires
the rename target to be recorded; only the implementation approach is open, and it is recorded as
an `openItem` rather than silently deferred.

### 6. Where the plan was silent or wrong

1. **D4's cross-skill table has a phantom row.** It states that `diagnosing-bugs` hands off to
   user-invoked `improve-codebase-architecture` and must be phrased as
   `/skill:improve-codebase-architecture`. The pinned `diagnosing-bugs/SKILL.md` contains **no
   reference at all** to that skill; it ends at Phase 6 cleanup. The hand-off exists only as
   `ask-matt` router prose. So D4 needs no load instruction there. The inventory records
   `crossSkillLoads: []` for `diagnosing-bugs`.
2. **D4 conflates two upstream cross-skill mechanisms.** Some skills load via `Call the Skill tool
   with "X"` (D5-03); others use a bare `/name` (D5-16). `implement` is the clearest case: it says
   `/tdd` and `/code-review`, with no Skill tool. Both converge on the same D4 relative load in Pi,
   but the porting edit is different, so the inventory records `kind: "model-load"` vs
   `kind: "slash-load"`.
3. **§2 calls `git-guardrails` "harness-agnostic" — the pinned file is not.** It is wholly Claude
   Code: a `PreToolUse` hook matcher on `Bash`, `.claude/settings.json`, `.claude/hooks/`,
   `~/.claude/hooks/`, and `$CLAUDE_PROJECT_DIR`. Pi's equivalent is an extension hook,
   `pi.on("tool_call", …)` returning `{ block: true, reason }` (Pi `docs/extensions.md`; bundled
   `permission-gate.ts` / `protected-paths.ts`), now recorded as D5-20. **Open item:** D1's `pi`
   manifest ships no `pi.extensions`, and §4's tree has no `extensions/` directory, so M5 must
   decide whether this package ships a small guardrail extension or the skill installs one that
   already exists. Resolving it in M1 would have required changing D1 or §4, both frozen.
4. **D5's trailing prose declares `agents/openai.yaml` banned with no allowlist, but the table had
   no row for it.** Added as D5-17.
5. **Seven D5 rows have zero upstream occurrences at the pin:** D5-07 (consequential research
   verification), D5-09 (`WebSearch`/`WebFetch`), D5-10 (`Glob`), D5-11 (`TodoWrite`), D5-12
   (`AskUserQuestion`), D5-19 (`allowed-tools`), and the literal string `Task tool`. They remain in
   the map because the port either adds the behaviour (D5-07) or must be able to ban the token
   (D5-09..12), but M6 cannot exercise them against a real upstream occurrence. Recorded in
   `newTokensDiscovered` is unaffected; the list is in `d5RowsNotUsedAtPin`.
6. **`Task` is a trap for a naive validator.** `wayfinder` uses `**Task** (HITL or AFK)` as a ticket
   *type*, not the Task tool. The literal `Task tool` has zero occurrences, so M2's ban must match
   `Task tool`, never a bare `Task`.
7. **The token pass must cover sidecars, not just `SKILL.md`.** §6/M2 describes the M2 token work
   against skill bodies, but ported sidecars carry the same tokens: bare `/skill` refs in
   `domain.md`, `issue-tracker-*.md`, `HTML-REPORT.md`, `PHASE-BOUNDARIES.md`, `AGENT-BRIEF.md`,
   `wizard/template.sh`; `/clear` in `PHASE-BOUNDARIES.md`. The inventory records these in
   `sidecarHarnessTokens`, so the M2 validator should scan `skills/**`, not only `SKILL.md` files.
8. **`in-progress/retro` is explicitly a stub.** Upstream's own `in-progress/README.md` calls it
   "STUB: design notes only, not functional yet", which is a second reason (beyond maturity) for
   its deferral. Recorded in its `notes`.
9. **`in-progress/pr` carries third-party attribution** in a real Pi field
   (`metadata.credits`: Dex Horthy / Humanlayer). Pi reads `metadata`, so it must be preserved if
   `pr` is ever ported; §2/§4 do not mention non-v1 attribution. Recorded in its `notes`.
10. **§4's tree omits the deferred skills' sidecars** (`in-progress/pr/CREDITS.md`,
    `in-progress/setup-ts-deep-modules/dependency-cruiser.config.cjs`). Not a v1 problem, but the
    inventory enumerates them so the tree can be corrected when they ship.
11. **The task's suggested inventory shape had no slot for repo-level artifacts.** M1 added a
    `repoLevel` array (`.claude-plugin/`, `.agents/`, `.out-of-scope/`, `scripts/`, `.github/`,
    `.changeset/`, root files, bucket `README.md`s — all dropped per D1/D2/D7).
12. **The D5 prose below the table still reads "Three rows above are settled policy".** With six
    rows appended after it, that phrase now sits above more rows. It was left untouched because the
    only sanctioned §5 edit is adding rows.

### 7. Acceptance: proof of coverage and token totality

Enumerated the upstream tree at the pinned commit and diffed it against the inventory's
`upstreamPath` values (mechanical, not asserted):

```bash
cd C:/x/on/projs/pi-adapted-mp-skills
comm -3 \
  <(find ../mp-upstream-c55ee46/skills -name SKILL.md | sed 's|^\.\./mp-upstream-c55ee46/||; s|/SKILL.md$||' | sort) \
  <(node -e 'const j=require("./docs/skill-inventory.json");process.stdout.write(j.skills.map(s=>s.upstreamPath).sort().join("\n")+"\n")')
```

Observed output: **empty** (the two sets are identical). Counts:

```
upstream SKILL.md files : 38
inventory rows          : 38
missing (upstream-only) : 0
extra (inventory-only)  : 0
```

Additional mechanical checks, all passing:

- Required-field completeness: every row has `upstreamPath`, `upstreamName`, `bucket`,
  `invocation`, `disableModelInvocation`, `frontmatterFields`, `droppedFrontmatter`, `sidecars`,
  `externalLinks`, `crossSkillLoads`, `harnessTokens`, `hasOpenaiYaml`, `disposition`,
  `ownerMilestone`, `confidence`, `notes`. `disposition` and `ownerMilestone` are always in range.
- `frontmatterFields`, `droppedFrontmatter`, and `invocation` re-derived from each upstream file
  and compared to the JSON: zero mismatches.
- Every `sidecars` entry exists in the upstream tree: zero missing.
- Token totality: every `harnessTokens` / `sidecarHarnessTokens` label resolves through
  `tokenMap.tokenIndex` to an existing row id — **zero unmapped tokens**. The 16 labels in use are
  `$CLAUDE_PROJECT_DIR`, `/clear`, `/compact`, `CLAUDE.md`, `Claude Code PreToolUse hook`,
  `Skill tool`, `agents/openai.yaml`, `architecture report -> OS temp`, `argument-hint`,
  `background agent`, `bare slash-command skill reference`, `claude --bg`, `handoff -> OS temp`,
  `review-axes`, `subagent`, `~/.claude`.
- Every D4 path in `crossSkillLoads` was recomputed from the referencing skill's directory and
  compared: zero mismatches (both `../<name>/SKILL.md` and `../../<bucket>/<name>/SKILL.md` forms
  are exercised; `wayfinder` and `grill-with-docs` exercise both in one file).

`piPath` is `null` for the 2 dropped skills and for all 9 `in-progress` skills (their eventual
bucket is undecided); `setup-pre-commit` keeps its planned `skills/misc/setup-pre-commit/SKILL.md`
location as a post-v1 target.

### 8. What M1 deliberately did not do

No `skills/` subdirectory was created, no upstream file was copied into this repo, no script from
§4's tree was written, and no package-level `docs/agents/` was created (D7). The only §5 change is
the six appended D5 rows; D1–D16 are otherwise untouched.

---

## M2 — Convention layer: validator, agents, setup, router (2026-09-18)

Scope: the M2 slice only — `scripts/validate-skills.mjs`, the four `agents/mp-*.md` definitions,
the two adapted skills (`setup-matt-pocock-skills` + sidecars, `ask-matt` + `PHASE-BOUNDARIES.md`),
and this record. Nothing from M3–M5 was ported. `docs/ADAPTATION_PLAN.md` and
`docs/skill-inventory.json` were not edited; `git diff 8f7d7a1 -- docs/ADAPTATION_PLAN.md
docs/skill-inventory.json` is empty, so the plan and the D5 table are byte-identical to the M1
commit.

### 1. Decisions confirmed before implementation

1. **D14 closes as documentation only.** `mp-review-standards` / `mp-review-spec` stay
   repo-read-only, and the two web-using agents run detached, so no foreground child needs web
   tools. No `pi-web-access` path-resolution code was written. Evidence in §4.
2. **`enableSkillCommands` probe = read both settings files.** `.pi/settings.json` overrides
   `~/.pi/agent/settings.json`; absent both, the Pi default is `true`. Chosen over a
   `pi.getCommands()` probe because that probe cannot tell "commands disabled" from "no skills
   installed", and setup must also work on a fresh repo. Chosen over asking the user because it is
   deterministic. Caveat recorded in the skill: project settings only load when the project is
   trusted.
3. **Gating confirmed.** Only D11 skill-name collisions and `enableSkillCommands` block. The
   `subagent` and web capability checks are capability-scoped and record-and-continue (D10), so a
   missing package never blocks repository configuration.

### 2. Validator checks and the D5 freeze

`scripts/validate-skills.mjs` is dependency-free (Node built-ins only; no `npm install`). It runs
the following, prints `path:line: message`, and exits non-zero on any error with **no
warnings-only mode**:

| # | Check | Contract |
|---|---|---|
| 0 | Recompute `sha256(JSON.stringify(tokenMap.rows.map(r => [r.rowId, r.upstream, r.pi])))` and compare to `tokenMap.hash` | D5 freeze |
| 1 | `name` present, `^[a-z0-9]+(-[a-z0-9]+)*$`, ≤64 chars; `description` present, ≤1024; only Pi-read keys (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`, `disable-model-invocation`) | Pi spec |
| 2 | Any key in the row's `droppedFrontmatter`, plus `argument-hint` | D2 |
| 3 | Every backticked `.../SKILL.md` reference resolves from the referencing file's directory, uses the right same/cross-bucket form, and names a target whose frontmatter `name` matches | D4 |
| 4 | Literal `Skill tool`, `Task tool`, `/clear`, `CLAUDE.md`, `agents/openai.yaml` anywhere under `skills/**`, sidecars included, no allowlist. `Task tool` is literal, so a bare Wayfinder `**Task**` never false-positives | D5 |
| 5 | A `disable-model-invocation: true` description contains no model-facing trigger phrasing | D2/D3 |
| 6 | No two `skills/**/SKILL.md` declare the same `name` | D11 |
| 7 | Every ported `SKILL.md` has an inventory row with `disposition ∈ {port, adapt, rename}` and the expected `piPath`; bucket and verbatim name match; every recorded `d4Path` is used | inventory |

The `ask-matt` carve-out is structural rather than a special case: its 24 `/skill:<name>` labels
are not backticked `.../SKILL.md` references, so check 3 never demands those targets exist, while
check 4 still bans the raw `/clear`. For M2 the model-load/slash-load set is empty, so check 3 is
vacuously clean on the shipped tree; it was proven both ways against fixtures (§7).

**Freeze result:** `tokenMap v2` hash
`9e86593bef1167039b66b4eb7d8dc69b5cda1cb647cde6e9fb086ad1e4bcda10` matches on every run. Exit 0
with 8 files scanned (2 `SKILL.md`). No D5 row was added, removed, or edited.

### 3. Package agents (D16)

Four files under `agents/`, discovered through the frozen `pi.subagents.agents: ["./agents"]`
manifest key. Each encodes a **contract**, not bundled `pi-subagents` prose; no text was copied
from `parallel-review.md`, `parallel-research.md`, or the builtin agent files. Generic
orchestration (fresh vs fork, angle generation, run identity, steering) is left to the bundled
`pi-subagents` skill.

| Agent | Role | Tool ceiling | Default launch | Contract encoded |
|---|---|---|---|---|
| `mp-researcher` | Background research child | `read, write, web_search, fetch_content, get_search_content, source_check` | `async: true` | The question, cited primary sources, and exactly where the note was saved |
| `mp-evidence-auditor` | Fresh claim-vs-source audit | `read, web_search, fetch_content, get_search_content, source_check` | `async: true` | Per-claim status supported/contradicted/unclear/missing-evidence, evidence vs interpretation vs inference |
| `mp-review-standards` | Standards axis only | `read, grep, find, ls` | foreground | Cite the documented repo rule, separate hard violations from judgement calls, apply the Fowler smell baseline, skip what tooling enforces |
| `mp-review-spec` | Spec axis only | `read, grep, find, ls` | foreground | Fidelity to the originating ticket's acceptance criteria and exclusions, including scope creep |

The two review agents are read-only by allowlist, so they cannot mutate the repo or run `git`;
if the parent does not supply a diff they report that the diff was not supplied rather than
reconstructing it. `mp-evidence-auditor` is retained alongside the builtin `evidence-auditor`
deliberately (D16 item 5).

### 4. D14 resolution and its evidence

Read from the pinned `pi-subagents@0.69.0` tree (`docs/agents.md`, §"Tool and extension selection")
and `docs/tool-reference.md`:

- Foreground children are sessions inside the parent process and **never** load the parent's
  ambient extensions; background (detached) children are separate processes and **do** load them.
- `async` defaults on for single-agent native launches, and the frontmatter `async` field sets the
  default when a call omits it. Explicit call values still win.
- `subagentOnlyExtensions` / `extensions` take **filesystem paths**, not package IDs, which is why
  a path would have to be resolved per install scope.

Decision: no foreground child needs web tools. `mp-review-*` are repo-read-only, and the two
web-using agents declare `async: true`, so they run detached and inherit `pi-web-access` ambiently.
D14 is therefore a documentation note, and **no path-resolution code exists**. Setting `async: true`
on the two web agents is the only code-shaped expression of this decision, and explicit call
values can still force them foreground (in which case the runtime fails closed, naming the missing
web tools, rather than silently continuing).

### 5. D6 deviations and Pi-native probes

| Item | D6 as written | What M2 did | Why |
|---|---|---|---|
| Preflight position | Step 6, after the write steps | Step **0**, before any write | The two blocking checks must not run after `AGENTS.md` and `docs/agents/*` are already written; a blocked setup would otherwise leave a half-configured repo. Content and internal order a→d are unchanged. |
| "Is `triage` installed?" probe | "a `triage` skill folder alongside this one, or `triage` in your available skills" | Read Pi's skill catalog: the `<available_skills>` block in the system prompt (`systemPromptOptions.skills`) | Pi-native provenance; a folder alongside the skill is not how Pi discovers skills. Verified: the M2 probe showed `skills: ["find-skills", "ask-matt", "setup-matt-pocock-skills"]`. |
| Collision provenance | `pi.getCommands()` `sourceInfo` | `pi.getCommands()` `sourceInfo` **plus** an on-disk Node scan | See the shadowing finding below: provenance alone cannot see a shadowed copy. |
| `enableSkillCommands` | "confirm it is not disabled" | Read `.pi/settings.json` then `~/.pi/agent/settings.json` | Concrete, non-model, deterministic; survives a repo with zero skills installed. |
| Context file | upstream picks whichever of the two context-file names exists | Write `AGENTS.md` only | D5-15/D6; the compatibility file is never created or forked to. |
| `gh` / `glab` | no harness note | Each tracker template says the commands run through Pi's `bash` | D6; makes the assumption explicit. |

**Shadowing finding (important).** `pi.getCommands()` exposes the **winner** of a name collision
and nothing else: with a decoy `ask-matt` in `.pi/skills/`, the probe returned exactly one
`skill:ask-matt` entry — `origin: "top-level"`, `scope: "project"`, path `.pi/skills/ask-matt/SKILL.md`
— and the package copy was absent entirely. So D11's "report that it could not be attributed"
cannot be implemented from `pi.getCommands()` alone. The skill pairs it with an on-disk scan that
reads the user/project skill directories **and** every package `pi list --approve` resolves. That
last part matters: a local path install is recorded as a relative path in `.pi/settings.json`, so
the obvious `node_modules` glob misses it (the first version of the recipe did exactly that and
failed to detect the decoy/package pair; the shipped recipe detects it).

### 6. Sidecar and body token ledger

Rewritten (D5-16 for bare labels, D5-01 for `/clear`):

- `ask-matt/SKILL.md` — all 24 bare `/…` skill labels → `/skill:<name>`; `/clear` → `/new`; the
  gerund "``/clear``ing context" rephrased to "`/new` between each one"; `/compact` kept.
- `ask-matt/PHASE-BOUNDARIES.md` — `/clear` → `/new` in the five-options table, question 2, and the
  primary/secondary table; `/handoff` ×3 → `/skill:handoff` (it is a skill name); the
  "Claude → Codex" harness-swap example replaced with "Pi to another agent harness, or the
  reverse".
- `setup-matt-pocock-skills/domain.md` — `/domain-modeling` ×2, `/grill-with-docs`,
  `/improve-codebase-architecture` → `/skill:<name>`.
- `setup-matt-pocock-skills/issue-tracker-github.md` — `/triage`, `/wayfinder` → `/skill:<name>`;
  added "run through Pi's `bash` tool".
- `setup-matt-pocock-skills/issue-tracker-gitlab.md` — same as GitHub.
- `setup-matt-pocock-skills/issue-tracker-local.md` — `/wayfinder` → `/skill:wayfinder`; added a
  note that the files are read/written with Pi's `read`/`write`/`edit` tools.
- `setup-matt-pocock-skills/SKILL.md` — the upstream `CLAUDE.md` branch removed (the string never
  appears, so there is no residue) and the preflight added.

Left untouched, with reason:

- `/compact` everywhere — D5-02 keeps it unchanged.
- `triage-labels.md` — no harness tokens; copied verbatim.
- External links (`aihero.dev` smart-zone, `gitlab.com/gitlab-org/cli`), repository paths,
  benchmark-ish `/dev`, `/docs`, `/issues` fragments, and the `wayfinder:*` label strings.
- `ask-matt`'s 24 human-facing labels stay labels: they are router prose, not load instructions
  (D4 carve-out), and `crossSkillLoads` is `[]` for both M2 skills in the inventory.

### 7. Where the plan was silent or wrong, and what was done instead

1. **`agents/.gitkeep` and `skills/.gitkeep`.** The task authorises removing `agents/.gitkeep`
   once the agents exist; M2 also removed `skills/.gitkeep`, because M0's stated reason for it
   ("the manifest path would be absent again") no longer holds once real skills exist. Both
   directories now contain real content and the §4 tree lists neither placeholder.
2. **The setup skill is interactive by design**, so a real `pi -p` run cannot answer its questions:
   with a fully pre-answered prompt it made no writes and did not terminate within 240 s. M2's
   acceptance therefore (a) proved the skill loads and is attributed to the package with a
   `before_agent_start` probe (`origin: "package"`, `scope: "project"`, correct `sourceInfo.path`;
   `"/skill:setup-matt-pocock-skills"` expands the body), (b) exercised the preflight through an
   executable mirror of step 0 against real settings/tool state, and (c) executed steps 4–6 against
   a scratch repo. Recorded rather than papered over.
3. **The preflight harness is evidence, not package content.** `scripts/` ships only
   `validate-skills.mjs`, because that is the M2 deliverable; a committed preflight script was not
   in scope and would duplicate the skill's prose for no runtime gain.
4. **§6/M2 also asks to "define the exact `pi-subagents` calls the ported skills use".** Neither M2
   skill dispatches a child — `setup-matt-pocock-skills` and `ask-matt` only probe and route — so
   that bullet has no M2 dispatch site. It lands with the M3/M4 skills that call the agents.
5. **D4's model-load set is empty for M2.** The validator's cross-skill check was proven with
   fixtures (a correct same-bucket and cross-bucket pair, and dangling/cross-form negatives) rather
   than by shipped references, because the two M2 skills own no model-load or slash-load paths.
6. **`pi-subagents` is not installed in this environment.** The four agent files could not be
   launched through the runtime here; they were checked structurally and against the pinned
   `0.69.0` docs (`docs/agents.md`, `docs/tool-reference.md`), and the M6 smoke test is where a real
   child launch belongs (already scheduled in §10).
7. **`pi.getCommands()` shadowing** — see §5. This is a real limitation of the API relative to
   D11's wording, not a mistake in D11, and the on-disk pairing is the fix.
8. **The D5 `tokenIndex` has a `review-axes` label but no token row for it in `bans`.** No M2 file
   needs it, so it was left alone; a missing token was **not** added (D5 is frozen).

### 8. CHANGELOG convention

The established convention is mixed: M0's landed files sit under `[0.1.0] → Added`, while M1 only
annotated the `[Unreleased] → Planned` roadmap. M2 followed M0: a new `### Added` block under
`[0.1.0]` records the landed M2 files, and the `[Unreleased]` M2 roadmap bullet is marked landed.
This is the smallest change that keeps the roadmap readable without rewriting M1's history.

### 9. Per-file diff notes (D9)

| Ported file | Upstream source | Changed regions |
|---|---|---|
| `skills/engineering/setup-matt-pocock-skills/SKILL.md` | `skills/engineering/setup-matt-pocock-skills/SKILL.md` | Frontmatter metadata added; `CLAUDE.md` branch removed; Pi preflight (capability, collision, `enableSkillCommands`) added; context-file and scratch-pointer steps adapted |
| `…/issue-tracker-github.md` | same name | `/triage`, `/wayfinder` → `/skill:` forms; Pi `bash` note |
| `…/issue-tracker-gitlab.md` | same name | `/triage`, `/wayfinder` → `/skill:` forms; Pi `bash` note |
| `…/issue-tracker-local.md` | same name | `/wayfinder` → `/skill:` form; Pi `read`/`write`/`edit` note |
| `…/domain.md` | same name | `/domain-modeling` ×2, `/grill-with-docs`, `/improve-codebase-architecture` → `/skill:` forms |
| `…/triage-labels.md` | same name | none (verbatim) |
| `skills/engineering/ask-matt/SKILL.md` | `skills/engineering/ask-matt/SKILL.md` | Frontmatter metadata added; 24 `/…` labels → `/skill:`; `/clear` → `/new` |
| `skills/engineering/ask-matt/PHASE-BOUNDARIES.md` | same name | `/clear` → `/new`; `/handoff` → `/skill:handoff`; harness-swap example |

### 10. Acceptance evidence (commands and results)

- `node scripts/validate-skills.mjs` → exit 0; D5 hash matches; 8 files / 2 `SKILL.md`.
- Seven deliberate breaks (bad name, long description, `argument-hint`, `Skill tool`, `/clear`,
  dangling `../../productivity/grilling/SKILL.md`, duplicate `ask-matt`) each exited 1 with a
  `path:line` message naming the rule; run against throwaway copies, so the real tree was never
  mutated.
- Positive D4 fixture (a same-bucket and a cross-bucket reference to real targets) → exit 0.
- Scratch repo (outside this package) produced `AGENTS.md`,
  `docs/agents/{issue-tracker,domain,triage-labels}.md`, and `.gitignore` entries; this repo still
  has **no** `docs/agents/`.
- Preflight mirror: missing `subagent` → `research`/`wayfinder`/`code-review`/`implement` marked
  unavailable + `pi install npm:pi-subagents@0.69.0`; missing web tools → only `research`/`wayfinder`
  + `pi install npm:pi-web-access@0.29.0`; a decoy `ask-matt` → one collision with both paths and
  exit 1; `enableSkillCommands: false` → blocking settings remedy and exit 1.
- Router test: four situations routed to `/skill:grill-with-docs`, `/skill:triage`,
  `/skill:diagnosing-bugs`, `/skill:wayfinder`; no `/clear` (or other banned token) survives.
- Cross-skill resolution: zero backticked `.../SKILL.md` references exist under `skills/**` for
  M2, and the validator's resolver is clean; the resolver itself was proven by the negative and
  positive fixtures above.


---

## M3 — Main flow: port the idea → ship pipeline (2026-09-19)

Scope: the M3 slice only — the ten skills `grill-with-docs`, `grilling`, `domain-modeling`,
`to-spec`, `to-tickets`, `implement`, `tdd`, `code-review`, `prototype`, `handoff`, plus
`codebase-design` (moved in under Trap A, below), their sidecars, the code-review dispatch
contract, the handoff output relocation, the validator run, and the fixture-repo acceptance.
Nothing from M4 or M5 was ported. `docs/ADAPTATION_PLAN.md` and the D5 table were not edited.

**Baseline note.** The task said HEAD was `abec939`; the actual HEAD at the start of M3 was
`679c620` ("Add M3 hand-off prompt", which only adds `docs/M3-PROMPT.md`). `git diff abec939..HEAD`
touches no plan or inventory file, so `docs/ADAPTATION_PLAN.md` and the D5 table are byte-identical
to `abec939`; that is the baseline this section compares against.

### 1. Decisions taken before implementation (the three questions asked)

1. **Trap A — `tdd` → `codebase-design`: option A, all three files.** The `codebase-design` row in
   `docs/skill-inventory.json` was moved `ownerMilestone: M4 → M3` and its `notes` extended. This is
   the only inventory edit in M3 (one hunk, two lines; the `tokenMap` is untouched, so the D5 hash
   still matches). All three files (`SKILL.md`, `DEEPENING.md`, `DESIGN-IT-TWICE.md`) were ported,
   not just `SKILL.md`, so the shipped `SKILL.md`'s `DEEPENING.md` / `DESIGN-IT-TWICE.md` links are
   real. Rejected: making the validator milestone-aware (weakens the existence assertion), or
   porting `tdd` without the load (weakens both the load and the ported skill).
2. **Trap B — `grilling`'s sub-agent: option A, parent's own tools.** The fact-finding sentence now
   says to look facts up with the parent's own `read` / `grep` / `find` / `ls`. `grilling` stays
   ungated, and §1/D10 plus D6's preflight capability list are untouched. The bundled `pi-subagents`
   skill still owns any delegation the parent chooses to do. Rejected: gating `grilling` on
   `pi-subagents`, which would have required editing the frozen §1 list and the M2 setup preflight.
3. **Acceptance shape: discovery probe + structural verification, live runs as a bonus.** The probe
   and structural checks are the bar; the live runs below exceeded it and are reported as live.

### 2. Per-file diff notes (D9)

`PATCHED` = fork-and-patch regions; `VERBATIM` = copied byte-for-byte from the pin. Every
`SKILL.md` gained the D2 frontmatter block (`license: MIT` plus `metadata.upstream`,
`metadata.upstream-commit`, `metadata.upstream-path`, `metadata.invocation`, `metadata.adapted-for`)
and dropped its `agents/openai.yaml`; those two changes are not repeated in every row.

| Ported file | Upstream source | Changed regions |
|---|---|---|
| `skills/engineering/grill-with-docs/SKILL.md` | same name | PATCHED. Frontmatter metadata. The whole one-line body (`Call the Skill tool twice, for "grilling" and "domain-modeling".`) became the two D4 load instructions, one per skill. |
| `skills/productivity/grilling/SKILL.md` | same name | PATCHED. Frontmatter metadata. The "dispatch a sub-agent to find it" sentence rewritten to the parent's own tools (Trap B, option A); the "running exploration" clause rewritten to a later-round clause so the no-blocking intent survives without a child. |
| `skills/engineering/domain-modeling/SKILL.md` | same name | PATCHED. Frontmatter metadata only. |
| `…/domain-modeling/CONTEXT-FORMAT.md` | same name | VERBATIM. |
| `…/domain-modeling/ADR-FORMAT.md` | same name | VERBATIM. |
| `skills/engineering/to-spec/SKILL.md` | same name | PATCHED. Frontmatter metadata. `/setup-matt-pocock-skills` → `/skill:setup-matt-pocock-skills` (D5-16; user hand-off, `d4Path: null`, kept as a label). |
| `skills/engineering/to-tickets/SKILL.md` | same name | PATCHED. Frontmatter metadata. Both bare `/setup-matt-pocock-skills` references → `/skill:setup-matt-pocock-skills`. |
| `skills/engineering/implement/SKILL.md` | same name | PATCHED. Frontmatter metadata. `/tdd` and `/code-review` → the two D4 load instructions (`../tdd/SKILL.md`, `../code-review/SKILL.md`), phrased as something the agent must run. Added the D10 capability gate for `subagent` at the top (plan silence — see §4 item 1). |
| `skills/engineering/tdd/SKILL.md` | same name | PATCHED. Frontmatter metadata. The `Skill tool … "codebase-design"` sentence → the D4 load `../codebase-design/SKILL.md`, keeping the "reference to consult, not a session to run" clause. |
| `…/tdd/tests.md` | same name | VERBATIM. |
| `…/tdd/mocking.md` | same name | VERBATIM. |
| `skills/engineering/code-review/SKILL.md` | same name | PATCHED, and the largest change. Frontmatter metadata. `/setup-matt-pocock-skills` → label. Added the D10 `subagent` gate. Step 1 tightened to resolve + non-empty before dispatch. Step 3 rewritten from "identify the standards sources (and paste the smell baseline)" to "capture the diff and commit list into `.scratch/reviews/`" because the children are read-only and cannot run `git`. Step 4 rewritten from two pasted prompts to the dispatch contract (see §3); the entire Fowler smell baseline was **deleted** here because `mp-review-standards.md` already carries it (D16). Step 5 unchanged in intent, plus an explicit skipped/incomplete-axis sentence. "Why two axes" verbatim. |
| `skills/engineering/prototype/SKILL.md` | same name | PATCHED. Frontmatter metadata only. |
| `…/prototype/LOGIC.md` | same name | VERBATIM. |
| `…/prototype/UI.md` | same name | VERBATIM (its `/prototype/<name>` is an application route, not a skill reference). |
| `skills/productivity/handoff/SKILL.md` | same name | PATCHED. Frontmatter metadata; `argument-hint` dropped (D2/D5-18). Output path relocated to `.scratch/handoffs/<ISO>-<slug>.md` with an absolute-path instruction and a `.gitignore` instruction; "naming which skills the next agent should call the Skill tool for" → "naming the skills the next agent should run, each as a `/skill:<name>` label". The "if the user passed arguments…" sentence is kept verbatim. |
| `skills/engineering/codebase-design/SKILL.md` | same name | PATCHED. Frontmatter metadata. The "spin up parallel sub-agents" bullet now names the `subagent` tool (D5's Subagent row) without restating mechanics. |
| `…/codebase-design/DEEPENING.md` | same name | VERBATIM. |
| `…/codebase-design/DESIGN-IT-TWICE.md` | same name | PATCHED. §2 heading "Spawn sub-agents" → "Dispatch the design sub-agents"; names the `subagent` tool and defers dispatch mechanics to the bundled `pi-subagents` skill (D16 item 3). The "3+ radically different" contract is unchanged. |

Totals: 11 skills, 19 files. Seven files VERBATIM (`CONTEXT-FORMAT.md`, `ADR-FORMAT.md`,
`tests.md`, `mocking.md`, `LOGIC.md`, `UI.md`, `DEEPENING.md`), twelve PATCHED.

### 3. The code-review dispatch contract, as run

The contract encoded in `code-review/SKILL.md` (not the orchestration mechanics, which stay with
the bundled `pi-subagents` skill, per D16):

- **Two fixed named axes:** `mp-review-standards` (Standards) and `mp-review-spec` (Spec). Nothing
  else; the child briefs are not paraphrased into the task prompt.
- **Fresh, isolated contexts:** each axis in its own context, dispatched concurrently.
- **Required inputs:** both children get the captured diff path and commit-list path; the Spec child
  also gets the spec/ticket source. If no spec exists, the Spec child is **not launched** and the
  final report says the axis was skipped.
- **No synthesis before both return:** the parent aggregates only after both have returned, keeps
  the reports under separate `## Standards` / `## Spec` headings, never merges or reranks them, and
  never picks a cross-axis winner.
- **Failure handling:** an axis that fails, aborts, or times out is reported as *not completed*
  with the reason; a missing axis is never silently dropped.

**The exact call observed live** (session `.scratch/review-bothaxes.jsonl` in the fixture), after
`subagent { action: "list", capabilities: true }` confirmed both agents:

```js
subagent({
  async: true,
  context: "fresh",
  cwd: "C:/x/on/projs/m3-fixture",
  workflowScript: `
    const target = [...diff path, commit list...].join("\\n");
    const standardsTask = target + "\\n\\nReview that diff on the Standards axis only. ...";
    const specTask = target + "\\n\\nOriginating spec: <path>\\nOriginating ticket: <path>\\n\\nReview that diff on the Spec axis only, against those two spec sources.";
    const results = await runs.all([
      { key: "standards", agent: "mp-review-standards", task: standardsTask,
        output: ".../.scratch/reviews/02-per-item-discount-pricing-standards.md" },
      { key: "spec", agent: "mp-review-spec", task: specTask,
        output: ".../.scratch/reviews/02-per-item-discount-pricing-spec.md" },
    ]);
    return results;
  `,
})
```

`runs.all` is one concurrent fan-out, so both children launch before either result is read; the
workflow returns only after both complete. Results were collected by `read`ing the two `output`
paths, then aggregated. Both children are read-only by their own tool ceiling
(`tools: read, grep, find, ls`), and the parent supplied the diff as
`.scratch/reviews/<slug>-diff.patch` + `<slug>-commits.txt` because the children cannot run `git`.

**Failed-axis evidence (live).** A run with no spec source produced: *"Spec — skipped. Per your
instruction, no spec, ticket, or issue was searched for. No `mp-review-spec` child was launched."*
The same run also recorded a real pre-spawn failure: the first Standards dispatch was refused by
`pi-subagents`' task classifier (`Agent 'mp-review-standards' was given an implementation task, but
its tool allowlist has no mutation-capable tools`, run id `c52b039e…`, exit 1, 0 turns), and the
parent reported it and retried with a tighter read-only brief rather than dropping the axis. Nothing
was synthesized across a missing axis.

### 4. Where the plan was silent or wrong, and what was done instead

1. **D10/D6 item 6 says "each capability-scoped skill repeats its own check at start and stops with
   the same message", but §6/M3 lists no gate for `implement` or `code-review`.** Both got the same
   short preflight paragraph M2's setup uses, ending in `pi install npm:pi-subagents@0.69.0`. It is
   the only body text added outside the D5 map. The gate was also observed working by accident: a
   checkout removed the fixture's `.pi/settings.json`, and `code-review` then stopped with the
   pinned install command and reported *both* axes as not completed instead of reviewing inline.
2. **Upstream `code-review` pasted the smell baseline into the child prompt and assumed the child
   could run `git`.** Neither survives: `mp-review-standards.md` already carries the baseline, so
   the copy here was deleted, and the read-only ceiling means the parent captures the diff to
   `.scratch/reviews/` and passes paths. Both are recorded in the step-3/step-4 diff notes above.
3. **`handoff`'s `.gitignore` instruction had no upstream analogue.** The body now tells the agent
   to check `.gitignore` and add `.scratch/handoffs/` when it is not already covered, and states
   that committing is opt-in and never accidental. Verified live (below): the agent checked
   `.gitignore`, found `.scratch/` already covered it, and made no change.
4. **§6/M3's acceptance presupposes a live interactive flow, but interactive skills do not
   terminate under `pi -p` (M2 finding).** In practice four of the five flow legs *did* terminate:
   `grill-with-docs`, `to-spec`, `to-tickets`, and `handoff` end their turn with a question or a
   report. `implement` terminated too (after loading `tdd` and `code-review`). So the M2 warning
   holds for `setup-matt-pocock-skills`, not for these; the acceptance was run live and the
   structural verification is reported alongside it.
5. **`pi-subagents` is not installed in this repo, but it is installable here.** Pinned
   `npm:pi-subagents@0.69.0` was installed project-locally into the fixture only (`.pi/npm/`), not
   into this package; this repository still has no runtime dependency.

### 5. Windows finding: `pi install` writes a backslash-relative package path that `pi-subagents` cannot resolve

This is a real interop defect between Pi and `pi-subagents@0.69.0` on Windows, found by the M3
implementation run and then reproduced first-hand:

- `pi install "C:/x/on/projs/pi-adapted-mp-skills" -l` writes
  `"packages": ["..\\..\\pi-adapted-mp-skills", …]` into the fixture's `.pi/settings.json`
  (backslash-relative).
- `pi-subagents`' `resolveSettingsPackageRoot` recognises only forward-slash relative sources
  (`./`, `../`) and returns `undefined` for `..\..\…`, so this package's
  `pi.subagents.agents` manifest is never read and none of the four `mp-*` agents resolve.
  Reproduced first-hand with `pi-subagents`' own `discoverAgents()`:
  - backslash form → `C:\x\on\projs\pi-adapted-mp-skills\agents` not enumerated, **0** `mp-*` agents;
  - forward-slash form (`"../../pi-adapted-mp-skills"`) → all four `mp-*` agents listed, no
    diagnostics.
- The fixture was repaired to the forward-slash form (`.scratch/settings.forward.json` is the
  working copy; `.scratch/settings.json.bak` is the `pi install` output) before the live dispatch
  above would run. `node_modules` was not patched.
- This does not affect any committed file in this package: `.pi/settings.json` here already uses
  `../skills` (M0 §1.1), and the manifest paths are package-root relative. It does affect a Windows
  user who installs by path, and it belongs in the README troubleshooting notes at M6, and possibly
  as an upstream `pi-subagents` fix (accepting a backslash-relative source is a one-line change).

### 6. Acceptance evidence

**Validator.** `node scripts/validate-skills.mjs` → exit 0, `skills/** clean (27 file(s) scanned,
13 SKILL.md)`, D5 `tokenMap v2` hash
`9e86593bef1167039b66b4eb7d8dc69b5cda1cb647cde6e9fb086ad1e4bcda10` matches.

**D4 enumeration (the first non-empty set).** Five backticked `../…/SKILL.md` references, each
resolved from the referencing file's directory and matched against the target's declared `name`:

```
skills/engineering/grill-with-docs/SKILL.md:14  ../../productivity/grilling/SKILL.md -> skills/productivity/grilling/SKILL.md       name=grilling        OK
skills/engineering/grill-with-docs/SKILL.md:16  ../domain-modeling/SKILL.md           -> skills/engineering/domain-modeling/SKILL.md  name=domain-modeling OK
skills/engineering/implement/SKILL.md:26        ../tdd/SKILL.md                       -> skills/engineering/tdd/SKILL.md              name=tdd             OK
skills/engineering/implement/SKILL.md:30        ../code-review/SKILL.md               -> skills/engineering/code-review/SKILL.md      name=code-review     OK
skills/engineering/tdd/SKILL.md:33              ../codebase-design/SKILL.md           -> skills/engineering/codebase-design/SKILL.md  name=codebase-design OK
total: 5
```

This is exactly the set the inventory records with a non-null `d4Path`: 2 + 2 + 1.

**Discovery and visibility (fixture `/c/x/on/projs/m3-fixture`, `pi 0.85.1`, package installed
project-locally, pinned `pi-subagents@0.69.0`).** A `before_agent_start` probe logged
`pi.getCommands()` and the rendered system prompt:

- All 13 package `SKILL.md` files resolve as `skill:<name>` with `origin: "package"`,
  `scope: "project"`, and a path inside `C:\x\on\projs\pi-adapted-mp-skills\skills\…`.
- The model-visible `<available_skills>` block contains exactly the M3 **model-invoked** skills —
  `code-review`, `codebase-design`, `domain-modeling`, `prototype`, `tdd`, `grilling` — and none of
  the M3 user-invoked ones (`grill-with-docs`, `to-spec`, `to-tickets`, `implement`, `handoff`).
  Note for M6: `systemPromptOptions.skills` lists *all* registered skills (including user-invoked
  ones), so it answers "is it available?", not "can the model choose it?"; visibility must be read
  from the rendered block.
- `/skill:<name>` expansion was confirmed for all four user-invoked M3 skills by inspecting the
  expanded `event.prompt`; e.g. `/skill:grill-with-docs` expands to both D4 load paths, and
  `/skill:implement` to both of its. The `subagent` tool was registered (with
  `pi-subagents@0.69.0`).

**Live end-to-end flow (all five legs ran, in one session and split across sessions).**

| Leg | What ran | Result |
|---|---|---|
| `/skill:grill-with-docs` (live, one `pi -p` session) | Loaded `grilling` + `domain-modeling` via D4, did fact-finding with its own tools, presented round 1 of the design tree and waited | Terminated (exit 0) |
| `/skill:to-spec` (live) | Published `.scratch/per-item-discount/spec.md`, 208 lines, `Status: ready-for-agent`, to the local-Markdown tracker | Terminated (exit 0) |
| `/skill:to-tickets` (live) | Drafted the breakdown and asked for sign-off (upstream step 4); re-run with approval, published `.scratch/per-item-discount/issues/{01-discount-vocabulary,02-per-item-discount-pricing,03-discount-composition-adr}.md`, blockers-first | Terminated (exit 0) |
| `/skill:implement` ticket 01 (live) | Updated `CONTEXT.md`, committed `b96a5d2`, then loaded `code-review` via D4 and dispatched both axes | Terminated (exit 0) |
| `/skill:implement` ticket 02 (live) | Tests-first against the pre-change module (red), then `447c4ac feat: apply line-item discounts in the cart total`, `npm test` 15/15, then `code-review` → Standards finding → `e193ab4 refactor: …` | Terminated (exit 0) |
| `/skill:handoff` (live) | Wrote `.scratch/handoffs/2026-09-19T01-01-34Z-m3-handoff-probe.md`, printed its absolute path, and checked `.gitignore` | Terminated (exit 0) |

Split-session evidence: the `to-spec` and `to-tickets` runs were separate `--no-session` processes
from the `grill-with-docs` run and from each other, and the second `implement` run was a separate
process from the first; each recovered its inputs from repo artifacts (the spec path, the ticket
path) rather than from conversation memory.

**handoff path and git-ignore behaviour.** The written file is
`/c/x/on/projs/m3-fixture/.scratch/handoffs/2026-09-19T01-01-34Z-m3-handoff-probe.md`, i.e. inside
the repo under `.scratch/handoffs/`, not the OS temp directory; the agent printed the absolute path
and reported that the fixture's existing `.scratch/` ignore rule already covered it, so no
`.gitignore` change was needed. `git status` in the fixture never showed the handoff, confirming it
is untracked by default.

**Code-review dispatch.** See §3: live, both axes, one concurrent `runs.all` fan-out,
`context: "fresh"`, `async: true`, read-only children, separate reports, and a live skipped-axis and
failed-child demonstration.

**D5 freeze.** `tokenMap v2` unchanged; the only inventory edit is the `codebase-design`
`ownerMilestone`/`notes` hunk. `git diff abec939 -- docs/ADAPTATION_PLAN.md` is empty.

### 7. Deliverables not produced (and why)

- No `docs/agents/`, no `.claude-plugin/`, no `extensions/`: none were added, as required.
- No new committed script: the two one-off probes (resolve every D4 reference, `discoverAgents`)
  were run ad hoc and are recorded above rather than shipped; §4's `scripts/` tree lists
  `fetch-upstream.mjs` and `smoke-test.sh` as M6 work.
- The fixture (`C:/x/on/projs/m3-fixture`) is left in place as the raw evidence for the acceptance
  run; it is outside this repository and is not part of the package.


---

## M4 — On-ramps, discovery, and health (2026-09-19)

Scope: the M4 slice only — `wayfinder`, `research`, `triage` (+ `AGENT-BRIEF.md`, `OUT-OF-SCOPE.md`),
`diagnosing-bugs` (+ `scripts/hitl-loop.template.sh`), `improve-codebase-architecture` (+
`HTML-REPORT.md`), `resolving-merge-conflicts`, and `wizard` (+ `template.sh`): **7 skills, 12 files**.
Nothing from M5 was ported. `docs/ADAPTATION_PLAN.md` and `docs/skill-inventory.json` were not edited.

**Baseline note.** The task said HEAD was `7a582db`; the actual HEAD at the start of M4 was
`d677cca` ("Add M4 hand-off prompt", which only adds `docs/M4-PROMPT.md`). `git diff 7a582db..d677cca`
touches no plan or inventory file, so `docs/ADAPTATION_PLAN.md` and the D5 table are byte-identical
to `7a582db`; that is the baseline this section compares against. Verified:
`git diff --quiet 7a582db -- docs/ADAPTATION_PLAN.md docs/skill-inventory.json` exits 0.

### 1. Decisions taken before implementation (the three questions asked)

1. **Trap A — `wayfinder`'s throwaway `research/<name>` branch: option A (the parent branches and
   commits; the child writes files only).** `mp-researcher`'s ceiling is
   `read, write, web_search, fetch_content, get_search_content, source_check` — no `bash` — so the
   parent creates `research/<name>` and commits each child's note to it. No `mp-*` tool ceiling was
   widened. Proven live in §5.
2. **`mp-evidence-auditor` vs built-in `evidence-auditor`: option A, and the outcome is keep.** Both
   were run live on the same claim/source (§8). They returned the same verdict and evidence chain;
   the input was non-discriminating, so the custom agent is retained with the collapse condition and
   a discriminating M6 re-test recorded.
3. **Acceptance scope: option A (live).** Discovery probe plus a live detached `mp-researcher`
   dispatch, a live `mp-evidence-auditor`/`evidence-auditor` comparison, a live `wayfinder`
   concurrency run, a live `triage` local-Markdown pass, and a live
   `improve-codebase-architecture` report. Everything below is live unless marked structural.

### 2. Per-file diff notes (D9)

`PATCHED` = fork-and-patch regions; `VERBATIM` = byte-for-byte from the pin. Every `SKILL.md` gained
the D2 frontmatter block (`license: MIT` plus `metadata.upstream`, `metadata.upstream-commit`,
`metadata.upstream-path`, `metadata.invocation`, `metadata.adapted-for`) and dropped its
`agents/openai.yaml` (D5-17); those two changes are not repeated in every row.

| Ported file | Upstream source | Changed regions |
|---|---|---|
| `skills/engineering/wayfinder/SKILL.md` | same name | PATCHED. Frontmatter metadata. `/setup-matt-pocock-skills` → `/skill:setup-matt-pocock-skills` (D5-16, user hand-off). Ticket-type list: Research → `../research/SKILL.md` load + one detached `mp-researcher` child per ticket; Prototype → `../prototype/SKILL.md` load; Grilling → two loads (`../../productivity/grilling/SKILL.md`, `../domain-modeling/SKILL.md`). Chart-the-map step 1 → the same two grilling/domain-modeling loads; step 5 → the research load plus the concurrent-batch / unique-`output:` / parent-branch / child-never-touches-the-map contract. Work-the-map step 3: the dynamic "call the Skill tool for whichever skills the `## Notes` block names" → "read that skill's `SKILL.md` and follow it" (no invented `d4Path`), plus the two grilling/domain-modeling loads. |
| `skills/engineering/research/SKILL.md` | same name | PATCHED (**adapt**; the 12-line body is wholly replaced). The "Spin up a **background agent**" body became the dispatch contract: D10 gates for `subagent` and for `web_search`/`fetch_content`/`get_search_content`/`source_check` with the pinned remedies; one detached `mp-researcher` child; unique explicit `output:`; save run identity; collect before answering; a failed/refused/abandoned child leaves the question unresolved. |
| `skills/engineering/triage/SKILL.md` | same name | PATCHED. Frontmatter metadata. Hand-off label → `/skill:setup-matt-pocock-skills`; `/triage` → `/skill:triage`; step-4 grill → the two D4 loads. |
| `skills/engineering/triage/AGENT-BRIEF.md` | same name | PATCHED. The sample acceptance criterion's `/triage` → `/skill:triage` (D5-16, a label inside a sample story, not a load). |
| `skills/engineering/triage/OUT-OF-SCOPE.md` | same name | VERBATIM (no harness tokens). |
| `skills/engineering/diagnosing-bugs/SKILL.md` | same name | PATCHED. Frontmatter metadata only; body verbatim. No cross-skill load (the M1 finding that the pinned file never names `improve-codebase-architecture` is unchanged). |
| `skills/engineering/diagnosing-bugs/scripts/hitl-loop.template.sh` | same name | VERBATIM. |
| `skills/engineering/improve-codebase-architecture/SKILL.md` | same name | PATCHED. Frontmatter metadata. `Skill tool` ×3 → D4 loads (`../codebase-design/SKILL.md` at the vocabulary bullet and the design-it-twice bullet, `../../productivity/grilling/SKILL.md`, `../domain-modeling/SKILL.md`); "spawn a sub-agent" → "dispatch a bounded read-only child with the `subagent` tool" (D5-04, mechanics left to the bundled `pi-subagents` skill); the OS-temp report paragraph → `.scratch/reports/<ISO>-architecture.html` with the git-ignore instruction and the absolute-path print, keeping the `xdg-open`/`open`/`start` step; `/codebase-design` → `/skill:codebase-design`. |
| `skills/engineering/improve-codebase-architecture/HTML-REPORT.md` | same name | PATCHED. "OS temp directory" → `.scratch/reports/`; `/codebase-design` ×3 → `/skill:codebase-design`. The Tailwind/Mermaid CDN links are third-party runtime fetches by the generated HTML, not harness tokens, and are untouched. |
| `skills/engineering/resolving-merge-conflicts/SKILL.md` | same name | PATCHED. Frontmatter metadata only; the body is identical to the pin (already harness-neutral — no token substitutions exist). |
| `skills/engineering/wizard/SKILL.md` | same name | PATCHED. Frontmatter metadata only; body verbatim. |
| `skills/engineering/wizard/template.sh` | same name | PATCHED. Line 4 comment `/wizard` → `/skill:wizard`; the library and example stage are otherwise byte-identical. |

Totals: 7 skills, 12 files. Three files VERBATIM (`triage/OUT-OF-SCOPE.md`,
`diagnosing-bugs/scripts/hitl-loop.template.sh`, and — body-only — `resolving-merge-conflicts/SKILL.md`
counted as PATCHED because of its added frontmatter).

### 3. D4 cross-skill loads

The inventory records **9 M4 loads with a non-null `d4Path`** (improve 3, triage 2, wayfinder 4) plus
**2 user hand-offs with `d4Path: null`** (`triage`, `wayfinder` → `/skill:setup-matt-pocock-skills`).
Every recorded `d4Path` appears backticked and the validator resolves it against the target's
declared `name`.

Full enumeration of backticked `../…/SKILL.md` references under `skills/**` — **20 occurrences across
7 distinct paths** (M3 contributed the first 5). There is no cross-milestone trap: every target
exists by the end of M4, including `research` and `prototype`.

```
skills/engineering/grill-with-docs/SKILL.md:14                ../../productivity/grilling/SKILL.md    -> skills/productivity/grilling/SKILL.md          name=grilling             OK
skills/engineering/grill-with-docs/SKILL.md:16                ../domain-modeling/SKILL.md             -> skills/engineering/domain-modeling/SKILL.md    name=domain-modeling      OK
skills/engineering/implement/SKILL.md:26                      ../tdd/SKILL.md                         -> skills/engineering/tdd/SKILL.md                name=tdd                  OK
skills/engineering/implement/SKILL.md:30                      ../code-review/SKILL.md                 -> skills/engineering/code-review/SKILL.md        name=code-review          OK
skills/engineering/tdd/SKILL.md:33                            ../codebase-design/SKILL.md             -> skills/engineering/codebase-design/SKILL.md    name=codebase-design      OK
skills/engineering/improve-codebase-architecture/SKILL.md:20  ../codebase-design/SKILL.md             -> skills/engineering/codebase-design/SKILL.md    name=codebase-design      OK
skills/engineering/improve-codebase-architecture/SKILL.md:71  ../../productivity/grilling/SKILL.md    -> skills/productivity/grilling/SKILL.md          name=grilling             OK
skills/engineering/improve-codebase-architecture/SKILL.md:73  ../domain-modeling/SKILL.md             -> skills/engineering/domain-modeling/SKILL.md    name=domain-modeling      OK
skills/engineering/improve-codebase-architecture/SKILL.md:78  ../codebase-design/SKILL.md             -> skills/engineering/codebase-design/SKILL.md    name=codebase-design      OK
skills/engineering/triage/SKILL.md:83                         ../../productivity/grilling/SKILL.md    -> skills/productivity/grilling/SKILL.md          name=grilling             OK
skills/engineering/triage/SKILL.md:83                         ../domain-modeling/SKILL.md             -> skills/engineering/domain-modeling/SKILL.md    name=domain-modeling      OK
skills/engineering/wayfinder/SKILL.md:84                      ../research/SKILL.md                    -> skills/engineering/research/SKILL.md           name=research             OK
skills/engineering/wayfinder/SKILL.md:85                      ../prototype/SKILL.md                   -> skills/engineering/prototype/SKILL.md          name=prototype            OK
skills/engineering/wayfinder/SKILL.md:86                      ../../productivity/grilling/SKILL.md    -> skills/productivity/grilling/SKILL.md          name=grilling             OK
skills/engineering/wayfinder/SKILL.md:86                      ../domain-modeling/SKILL.md             -> skills/engineering/domain-modeling/SKILL.md    name=domain-modeling      OK
skills/engineering/wayfinder/SKILL.md:118                     ../../productivity/grilling/SKILL.md    -> skills/productivity/grilling/SKILL.md          name=grilling             OK
skills/engineering/wayfinder/SKILL.md:118                     ../domain-modeling/SKILL.md             -> skills/engineering/domain-modeling/SKILL.md    name=domain-modeling      OK
skills/engineering/wayfinder/SKILL.md:122                     ../research/SKILL.md                    -> skills/engineering/research/SKILL.md           name=research             OK
skills/engineering/wayfinder/SKILL.md:131                     ../../productivity/grilling/SKILL.md    -> skills/productivity/grilling/SKILL.md          name=grilling             OK
skills/engineering/wayfinder/SKILL.md:131                     ../domain-modeling/SKILL.md             -> skills/engineering/domain-modeling/SKILL.md    name=domain-modeling      OK
total: 20 occurrences / 7 distinct paths
```

Occurrence note: `wayfinder`'s "call the Skill tool twice, for "grilling" and "domain-modeling"" appears
three times (ticket-type list, chart step 1, work step 3) and each became **two** load instructions.
Its research load appears twice (ticket type, chart step 5) and its prototype load once. Work step 3's
generic dynamic load ("whichever skills the `## Notes` block names") was rewritten as "read that
skill's `SKILL.md` and follow it" with no invented `d4Path`.

### 4. The `research` / `wayfinder` dispatch contract, as run

Encoded in the two skills (not the orchestration mechanics, which stay with the bundled
`pi-subagents` skill, per D16):

- **`research` (the single-question site):** one detached `mp-researcher` child per question; D10
  gate on `subagent` and on all four web tools with the pinned remedies; a unique explicit `output:`
  path; run identity saved; the result collected before the question is answered; a
  failed/refused/abandoned child leaves the question unresolved and visible.
- **`wayfinder` (the frontier site):** one bounded `mp-researcher` child per independent `research`
  ticket, all in **one `runs.all` concurrent batch**; distinct `output:` per child; children never
  edit the map or a ticket; the **parent serializes** every map/ticket write; the parent creates the
  throwaway `research/<name>` branch and commits each note; a failed child leaves its ticket open and
  is recorded as not completed.

**The exact `research` call observed live** (session
`--C--x-on-projs-m4-fixture--/2026-09-19T01-48-18-555Z_…`, run `7314d49e`):

```js
subagent({
  agent: "mp-researcher",
  context: "fresh",
  async: true,
  output: ".scratch/research/schedule-url.md",
  task: "<the question, stated in the asker's terms, plus the required cited-note output>",
})
```

**The exact `wayfinder` concurrent call observed live** (session
`--C--x-on-projs-m4-fixture--/2026-09-19T01-35-29-194Z_…`; two children, runs `623fcebe` and
`a3499275`):

```js
subagent({
  async: true,
  cwd: "C:/x/on/projs/m4-fixture",
  workflowScript: `
    const results = await runs.all([
      { key: "market-model", label: "Research line-item discount data models",
        agent: "mp-researcher", context: "fresh", task: marketModel,
        output: ".scratch/research/per-item-discount-market-models.md" },
      { key: "rounding-allocation", label: "Research discount rounding and allocation",
        agent: "mp-researcher", context: "fresh", task: roundingAllocation,
        output: ".scratch/research/per-item-discount-rounding-allocation.md" },
    ]);
    return results.map((r) => ({ key: r.key, ok: r.ok, runId: r.runId,
      outputPath: r.outputPath, outputReference: r.outputReference, error: r.error }));
  `,
})
```

Both `runs.all` children launch before either is read; the workflow returns only after both complete.
Each child's brief inlines its own ticket question and forbids editing anything but its assigned note.

**Result collection and a real routing detail.** The runtime's `output:` binding routes a *relative*
path into `pi-subagents`' managed artifact storage
(`…/subagent-artifacts/outputs/<runId>/.scratch/research/<name>.md`), not into the repo worktree
directly — observed twice. So the parent reads/collects the child's artifact and **persists it to the
repo path it chose**; that is recorded in the `research` skill's step 3. It also means concurrent
children never write the same repo file, which reinforces Trap C's "children never edit shared
files" rule.

**Failure handling observed live:** the single-child `research` run and both `wayfinder` children
completed; §9 records a refused read-only launch and its retry. No ticket was resolved without its
child's evidence.

### 5. Trap A live resolution: the parent owns the `research/<name>` branch

The live `wayfinder` run confirms option A end to end. The parent:

- created the map and three tickets on `main` (commit `763a0ae`);
- fired both `research` children in one concurrent batch;
- collected both cited notes, force-added them under `.scratch/research/` (which `.scratch/` in the
  fixture's `.gitignore` would otherwise exclude), and committed them to the throwaway branch
  **`research/per-item-discounts`** (commit `241c0ec`);
- left the working tree clean and `main` free of research artifacts
  (`git ls-tree -r --name-only research/per-item-discounts` lists the two notes; `git log main`
  does not).

The two `mp-researcher` children (36 KB and 35 KB notes, ~50 primary-source URLs each) never ran a
`git` command and never touched the tracker. This is the upstream "primary source out of main"
property preserved without widening any tool ceiling.

### 6. `improve-codebase-architecture` report relocation (D5-14)

Live run in the fixture: the skill wrote
`C:\x\on\projs\m4-fixture\.scratch\reports\2026-09-19T01-46-architecture.html` (26 KB), printed that
absolute path, and opened it. `git status --porcelain` shows only the triage-modified issue file —
the report is **not** listed — and `git check-ignore -v` resolves it to the fixture's
`.gitignore:2:.scratch/`. The `$TMPDIR`/`/tmp`/`%TEMP%` resolution paragraph is gone; the body now
uses `.scratch/reports/<ISO>-architecture.html` and checks `.gitignore`, exactly like `handoff`.
No `.scratch/reports/` entry was added to any *committed* ignore file in **this** package: the report
is target-repo output and setup already covers it (D6/§4). The `xdg-open`/`open`/`start` step is kept.

### 7. `wizard` and `diagnosing-bugs` shell templates, and Windows limits

Both templates are kept as shell (not rewritten in JS) and pass under Pi's `bash` here:

```
$ bash -n skills/engineering/wizard/template.sh                                  -> OK
$ bash -n skills/engineering/diagnosing-bugs/scripts/hitl-loop.template.sh       -> OK
$ bash --version                                                                 -> GNU bash 5.2.26(1)-release (x86_64-pc-msys)
$ command -v shellcheck                                                          -> not installed
```

`wizard/template.sh` keeps the library verbatim except the comment fix; it uses `mktemp`, `tput`,
`read -rs`, `gh secret`/`gh variable`, and `wslview`/`explorer.exe`/`xdg-open`/`open`.
`hitl-loop.template.sh` uses `read -r -p` and `printf -v`.

**Windows limits (recorded, M4 → M6):** the templates were *syntax-checked* here, not run
end-to-end, and on Windows under Git-Bash/MSYS they depend on: `mktemp` (present in MSYS, but the
temp path is a POSIX path `mv` can use — a native Windows `cmd`/PowerShell host would not have it);
`tput` for colour/clear (absent by default, and the library already falls back to no colour);
`xdg-open`/`open` (absent; `wslview`/`explorer.exe` are the branches that fire, and `open_url`
falls back to printing the URL); interactive `read -rs` for hidden secret input (needs a real
terminal, so these scripts cannot be driven by `pi -p`); and `gh` for `set_secret`/`set_var`
(absent or unauthenticated → the library records it in `SKIPPED` and warns rather than failing).
The `wizard` body's own Step 4 already says not to run the script end-to-end and to trace it
statically, which is what was done.

### 8. `mp-evidence-auditor` vs built-in `evidence-auditor` (D16 item 5)

**Run.** Both agents audited the identical claim/source in one concurrent batch, fresh context each,
async, run `79ad8908` (custom) and `51eee6af` (built-in):

- Claim: *"Node.js v24 entered Active LTS on 2025-10-28."*
- Cited source: `https://raw.githubusercontent.com/nodejs/Release/main/schedule.json`

**Result.** Both returned `supported`, high confidence, via the same evidence chain: the verbatim
`"v24": { … "lts": "2025-10-28" … }` passage, the same field-to-"Active LTS Start" normalization
using the same repository's README column, the same odd-numbered-lines-have-no-`lts` corroboration,
the same `main`-branch mutability caveat, and the same independent v24.11.0 announcement. The
parent's own comparison: *"Functionally the same … the differences are formatting and emphasis, not
distinguishable method or conclusions."* Observable differences were structural only: the built-in
used its fixed 7-section template; the custom used its 5-section claim-centric template with an
explicit "Claims left unaudited" section. The custom also stated the strictness condition ("if
`schedule.json` had been the only source I would have downgraded to `unclear`") while the built-in
said the source supports the claim in combination with the README column.

**Decision: keep `mp-evidence-auditor`; do not collapse.** Under D16 item 5 the collapse condition is
"functionally identical **in practice**". The comparison shows equivalent *outcomes* on a single,
non-disputed, well-sourced claim — the least discriminating input available, where any two competent
auditors are expected to agree — so it does not establish functional identity; the parent's own
conclusion was that the input "corroborate[s] rather than discriminate[s]". Two further reasons: the
observable output contracts differ, and the frozen D5-07 row ("Fresh `mp-evidence-auditor` child
checks claim/source support independently") and D16 item 4 both name the agent, which this milestone
cannot edit (the plan is frozen). Collapsing would desynchronise the shipped tree from the frozen
map without a sanctioned plan edit. **Scheduled follow-up (M6):** re-run the comparison on a
discriminating seam — a disputed or contradicted claim, or the custom auditor restricted to the
cited URL with corroboration barred — before any collapse; the full comparison artifact is
`.scratch/out-audit-compare.txt` in the fixture.

### 9. Trap B: the pre-spawn refusal, as run live

Dispatched the read-only `evidence-auditor` (ceiling `read, web_search, fetch_content,
get_search_content, source_check` — no `write`, no `bash`) with a deliberately
implementation-phrased task. The `pi-subagents` task classifier refused it before spawning:

```
Agent 'evidence-auditor' was given an implementation task, but its tool allowlist has no
mutation-capable tools. Add bash, edit, write, or another mutation-capable tool to the agent,
or use a read-only task/agent.
```

Run `27b37159-…`, mission `4589c832-…`, failed, 0 turns; the note was byte-unchanged and
`git status --porcelain` stayed empty. A correctly-phrased retry then exposed the D14 fact live: the
same agent run **foreground** failed with *"ran as a foreground child, which never loads the parent's
ambient extensions, and these child tools were unavailable: web_search, fetch_content,
get_search_content, source_check"* (run `f381bd9b-…`), and the documented remedy worked — the same
read-only audit with `async: true` completed in ~1m11s with `supported`, high confidence (run
`f9ccc1f5-…`). So the contract stands: phrase an audit as an audit, and run it detached. No failed
launch was silently dropped.

### 10. Discovery, model visibility, and `/skill:` resolution (fixture outside this repo)

Fixture `C:/x/on/projs/m4-fixture` (git repo, local-Markdown tracker), `pi 0.85.1`, this package
installed project-locally plus pinned `pi-subagents@0.69.0` and `pi-web-access@0.29.0`. The M3
Windows backslash-path defect reproduced (`pi install … -l` wrote `"..\\..\\pi-adapted-mp-skills"`,
and the two npm installs first refused with *"Project is not trusted"* until run with `--approve`);
the package entry was repaired to `"../../pi-adapted-mp-skills"` and `discoverAgents()` then listed
all four `mp-*` agents with no diagnostics.

**Visibility, read from the rendered `<available_skills>` block** (not from
`systemPromptOptions.skills`, per the M3 finding):

- Model-visible M4 skills: `diagnosing-bugs`, `research`, `resolving-merge-conflicts`, `wizard`.
- Not model-visible (user-invoked): `wayfinder`, `triage`, `improve-codebase-architecture` — they
  appear in `systemPromptOptions.skills` but not in the rendered block, the exact
  availability-vs-visibility distinction.
- All 7 resolve as `skill:<name>` with `origin: "package"`, `scope: "project"`, and a path inside
  this package; `/skill:<name>` expanded the body live for all 7 and each run exited 0 (the M2
  interactive-skill caveat does not apply to these either).
- Registered tools in the parent: `read, bash, edit, write, subagent, bg_wait, web_search,
  source_check, fetch_content, get_search_content, subagent_supervisor`.

Expansion markers confirmed for the user-invoked three (`../research/SKILL.md`,
`../prototype/SKILL.md`, `../../productivity/grilling/SKILL.md`, `../domain-modeling/SKILL.md`,
`../codebase-design/SKILL.md`, `.scratch/reports/`, `/skill:triage`, `/skill:codebase-design`,
`/skill:setup-matt-pocock-skills`, `mp-researcher`, and the pinned web remedy). The three
no-cross-load skills (`diagnosing-bugs`, `resolving-merge-conflicts`, `wizard`) expanded with no D4
markers, as intended.

**`triage` local-Markdown pass (live).** `/skill:triage` on `docs/issues/02-cart-total-rounding.md`:
read the tracker, mapped labels through `docs/agents/triage-labels.md`, posted the mandated
"*This was generated by AI during triage.*" disclaimer, ran the redundancy and prior-rejection
checks against the real repo, **reproduced the claim** (`3 × 6.665` → `19.995`, not the reported
`19.999999999`), and applied `bug` + `needs-info` (`needs-triage` → `needs-info`) with specific
reporter questions. The `gh`/`glab` tracker paths are untested and remain M6 work.

### 11. Where the plan was silent or wrong, and what was done instead

1. **`research` is 12 lines whose entire body is one harness sentence** ("Spin up a background
   agent"). The plan calls it `adapt`; the whole body was replaced with the dispatch contract, and
   the model-facing description (including "background agent") was kept verbatim so the trigger
   phrasing survives.
2. **`wayfinder`'s chart step 5 conflates the ticket's decision with the first research dispatch.**
   Upstream fires research children while charting but also defines `research` as a ticket type
   resolved later. The port keeps both: the ticket type names the `research` load, and chart step 5
   states the batch/branch/serialization contract once.
3. **The generic "call the Skill tool for whichever skills the `## Notes` block names" has no fixed
   target**, so it is not a recorded load. It was rewritten as "read that skill's `SKILL.md` and
   follow it" per the confirmed approach, with no invented `d4Path`.
4. **`improve-codebase-architecture`'s "spawn a sub-agent" is a real `subagent` token but the plan's
   §1 prerequisite table does not list this skill.** Followed the M3 `codebase-design` precedent:
   name the `subagent` tool and defer mechanics to the bundled skill, without adding a D10 gate the
   plan does not schedule. The live report run exercised it.
5. **`output:` is a runtime-managed binding, not a repo write.** Both live runs showed a relative
   `output:` routed under pi-subagents' managed artifact storage, so the parent persists the
   collected note to the repo path. Step 3 of `research` now says so; `wayfinder` already had the
   parent persist. This is a plan silence, not a contradiction.
6. **`wizard`/`diagnosing-bugs` Windows limits** were recorded in §7 rather than in the skill bodies,
   to keep the ports closer to upstream; the plan allowed either.
7. **The evidence-auditor decision (§8) is a scheduled M4 decision** and is recorded there rather
   than as a plan edit, since the plan and the D5 table are frozen.
8. **No `docs/agents/`, `.claude-plugin/`, or `extensions/` were added**, and no `.scratch/` ignore
   entry was committed in this package. No runtime dependency was added; the validator still runs on
   a bare Node install.

### 12. Acceptance evidence (commands and results)

- **Validator:** `node scripts/validate-skills.mjs` → exit 0,
  `ok: skills/** clean (39 file(s) scanned, 20 SKILL.md)`, D5 `tokenMap v2` hash
  `9e86593bef1167039b66b4eb7d8dc69b5cda1cb647cde6e9fb086ad1e4bcda10` matches.
- **D4 enumeration:** 20/20 backticked references resolve to a target whose `name` matches
  (§3); the 9 M4-recorded loads are all present.
- **Discovery/visibility and `/skill:` resolution:** §10 — all 7 skills correct, 4 model-visible,
  3 user-invoked, all 7 `/skill:<name>` expansions exit 0.
- **`research`:** live detached `mp-researcher` child (run `500ee444`, 1m14s, 10 turns, 16 tools),
  cited note `.scratch/research/node-lts.md` (15 KB, 42 URLs); child tools exactly
  `read, write, web_search, fetch_content, get_search_content, source_check` with
  `disableAmbientExtensions: false` (ambient `pi-web-access`); a second run (`7314d49e`) captured
  the exact call in §4.
- **`wayfinder`:** live concurrent batch of two `mp-researcher` children (runs `623fcebe`,
  `a3499275`), parent-created `research/per-item-discounts` branch (`241c0ec`), map + 3 tickets on
  `main` (`763a0ae`), parent-serialized tracker writes, clean tree.
- **`triage`:** live local-Markdown pass, `bug`/`needs-info` applied (§10).
- **`improve-codebase-architecture`:** live report at
  `.scratch/reports/2026-09-19T01-46-architecture.html`, absolute path printed, untracked and
  git-ignored (§6).
- **`wizard`/`diagnosing-bugs`:** both templates `bash -n` OK; Windows limits recorded (§7).
- **`evidence-auditor` comparison:** live, both agents, recorded with its keep decision (§8).
- **Trap B:** live refused launch plus foreground-extension failure plus `async:true` success (§9).
- **D5 freeze:** plan and inventory byte-identical to `7a582db`; no D5 row added, removed, or edited.

### 13. Deliverables not produced (and why)

- No `docs/agents/`, `.claude-plugin/`, or `extensions/`.
- No new committed script: the probes (`probe.ts`, the D4 enumerator) were run ad hoc and are
  recorded here rather than shipped; §4's `scripts/` tree still lists `fetch-upstream.mjs` and
  `smoke-test.sh` as M6 work.
- The fixture `C:/x/on/projs/m4-fixture` is left in place as raw evidence; it is outside this
  repository and is not part of the package.
- `gh`/`glab` triage paths and the `pi install` backslash-path README entry remain M6 work;
  `git-guardrails` packaging remains M5.
