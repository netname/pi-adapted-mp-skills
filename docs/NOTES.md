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
