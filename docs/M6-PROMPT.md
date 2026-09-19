# M6 hand-off prompt — Validation, docs, release

Status: **prepared, not started.** Written after M5 (`6fd87e0`). Milestone plan of record:
[`ADAPTATION_PLAN.md`](./ADAPTATION_PLAN.md) §6/M6. This file is a task prompt for the next
implementation session; it is not a decision and does not modify §5.

---

## Task: M6 — validation, docs, release (final milestone)

### Context

Repo: `C:/x/on/projs/pi-adapted-mp-skills` (Windows; bash available).
Package: `pi-adapted-mp-skills`, a port of Matt Pocock's engineering-workflow skill collection to the Pi
coding agent.

**M0–M5 are complete and committed.** HEAD is `6fd87e0` (`Add M5 productivity and misc: six skills,
git-guardrails extension, rename carve-out`), clean working tree. All 26 v1 skills now ship; M6 adds no
skills. What exists now:

- **26 skills / 51 files under `skills/**`** (`skills/{engineering,productivity,misc}`): 14
  user-invoked (`disable-model-invocation: true`) and 12 model-invoked. `skills/misc/` holds the single
  `git-guardrails` skill.
- `scripts/validate-skills.mjs` — dependency-free validator, checks 0–7, exits 0 over `skills/**`
  (**51 files / 26 SKILL.md**) with a non-empty cross-skill set (**21 backticked `../…/SKILL.md`
  occurrences across 7 distinct targets**). Check 7 accepts `row.renameTarget` for the one
  `disposition: "rename"` row and nothing else.
- `docs/skill-inventory.json` — the frozen adaptation contract: 38 upstream rows, `tokenMap` version 2,
  hash `9e86593bef1167039b66b4eb7d8dc69b5cda1cb647cde6e9fb086ad1e4bcda10`. Byte-identical to `fca16af`.
- `agents/mp-researcher.md`, `mp-evidence-auditor.md`, `mp-review-standards.md`, `mp-review-spec.md` —
  the four package agents (D16), discovered through `pi.subagents.agents: ["./agents"]`.
- `extensions/git-guardrails.ts` — new in M5 (D5-20): a `pi.on("tool_call", …)` blocker returning
  `{ block: true, reason }`, declared by the manifest key `pi.extensions: ["./extensions"]`. **Inert
  until the user opts in** via `.pi/git-guardrails.json` (project) or `~/.pi/agent/git-guardrails.json`
  (global); `patterns` replaces the default list; `PI_GIT_GUARDRAILS=off` disables it for a session.
- `package.json`: `pi` manifest (`extensions`, `skills`, `subagents`), `keywords: ["pi-package"]`,
  version `0.1.0`. **No runtime dependencies, and no `scripts` block** (`npm test` does not exist yet).
- `README.md` (222 lines): install routes (git URL first, then npm), per-capability prerequisites,
  pinned-vs-floating update behavior, invocation model, a **provisional** skill index (line 119,
  "finalized in M6"), shadowed-skill-name troubleshooting, license/attribution. **Not yet present:** a
  compatibility note for post-pin drift, the Windows backslash-path troubleshooting entry, anything
  about the `git-guardrails` extension, and the M5 manifest/`extensions/` surface.
- `scripts/` ships **only** `validate-skills.mjs`; §4's tree lists `fetch-upstream.mjs` and
  `smoke-test.sh` as expected content, and neither exists.
- `CHANGELOG.md`: `[Unreleased] → Planned` has M1–M5 marked landed and M6 open; `[0.1.0] → Added`
  records M0–M5; no tag exists.
- `NOTICE` / `README` / `CHANGELOG` use the GitHub owner `netname`, inferred from the git remote and
  **still unconfirmed by the owner** (NOTES §M0.5 item 1).

**Read these first, in full:**

1. `docs/NOTES.md` — all six sections. **§M5 is the binding context:** the extension design and gating
   matrix, the manifest deviation, the validator carve-out, and its negative controls. Also binding:
   §M4.8 (`mp-evidence-auditor` re-test owed), §M3.5 (the Windows backslash-path defect and the README
   entry it owes), §M2 (the validator check table, the setup preflight, the `pi.getCommands()` shadowing
   finding), §M1.6 item 5 and §M1.6 item 3 (D5 rows with zero upstream occurrences; the guardrail
   packaging question, now resolved), and §M0.5 (open item 1: the owner name).
2. `docs/ADAPTATION_PLAN.md` — **§6/M6 is the checklist**, §7 the validation strategy (including the
   per-layer table and the invocation-visibility warning), §8 the risks, §10 the deferred work and
   follow-ups, §1 the per-capability prerequisites, and D3/D4/D10/D11/D12/D13/D14/D15/D16. **Do not edit
   this file.**
3. `docs/skill-inventory.json` — the frozen contract and the `piPath` list the smoke test asserts
   against. Note §7's sentence "Record results in `docs/skill-inventory.json`" — see question 2.
4. `docs/Matt_Pocock_Skills_Project_Workflow_Guide.md` — **the fidelity bar for this milestone.** Read
   the Operating Checklists (`Before /to-spec`, `Before /to-tickets`, `Before /implement`, `Before
   Closing a Ticket`, `Before Closing a Feature`, `At a Phase Boundary`, `Before Using /handoff`), the
   `Small Feature Example: No Wayfinder Required`, the `Worked Example: Amazon Refund Import` (first
   three sessions), and `Common Failure Modes`.
5. Pi docs at `C:/Users/LENOVO/AppData/Roaming/npm/node_modules/@earendil-works/pi-coding-agent/docs/`
   — `packages.md` (manifest, install routes, filtering, scope/dedup), `skills.md` + `settings.md`
   (`enableSkillCommands`, skill locations), `extensions.md` (`tool_call`, fail-safe on extension
   error), `usage.md`.
6. `docs/M5-PROMPT.md` — the milestone-prompt format this file follows.

### Ground rules

- **D1–D16 are frozen. Do not re-open them. Do not edit `docs/ADAPTATION_PLAN.md` and do not touch any
  D5 row.** The D5 hash must still match after M6.
- **M6 ports nothing.** No new skills, no validator check for `setup-pre-commit` (D15), no
  `in-progress/*` work. The 26-skill set is final for v0.1.0.
- **Do not weaken a check or a D10 gate to make a smoke test pass.** If a check is wrong, report it
  before changing it (the M5 Trap A precedent: fix, prove the negative cases still fail, record why it
  is not a weakening).
- **Do not edit `docs/skill-inventory.json` rows or `tokenMap`.** See question 2 for the one place §7
  asks for a write.
- **Substitution is total.** `Skill tool`, `Task tool`, `/clear`, `CLAUDE.md`, `agents/openai.yaml` stay
  banned with no allowlist under `skills/**`, sidecars included. The validator's own rule strings and
  the M2 setup note are the only legitimate repository occurrences.
- Windows: forward-slashed, repo-relative paths in committed files; never embed `C:\` in a committed
  path (a quoted `pi install` output is evidence, not a path). `scripts/smoke-test.sh` must run under
  Git-Bash here, and its Windows limits must be recorded rather than hidden.
- **No runtime dependencies.** `node scripts/validate-skills.mjs` must keep running on a bare Node
  install, and any new script must be Node/bash built-ins only. `npm test` must not require an
  `npm install`.
- `README.md`, `CHANGELOG.md`, and `NOTICE` are now in scope. Anything that documents the extension's
  existence, opt-in, config shape, customization, and disable switch is required, not optional: M5
  shipped a new package surface and no user-facing documentation for it.
- Do not restate `pi-subagents` mechanics in a skill body (D16 item 3). M6 *tests* may reference the API
  freely; that is not skill prose.

### Established facts (verified in M0–M5 — do not re-derive)

- **Validator.** `node scripts/validate-skills.mjs` → exit 0, `51 file(s) scanned, 26 SKILL.md`, D5
  `tokenMap v2` hash matches. Checks: 0 D5 freeze, 1 frontmatter, 2 dropped/unknown keys, 3 cross-skill
  `SKILL.md` resolution + name match, 4 forbidden tokens, 5 user-invoked description style, 6 duplicate
  names, 7 inventory consistency.
- **`/skill:<name>` expansion works for user-invoked skills and they terminate under `pi -p`.** Every
  shipped skill has now been probed, and all but `setup-matt-pocock-skills` have run live at least once.
  `setup-matt-pocock-skills` is interactive by design and does not terminate under `pi -p` (M2 §7
  item 2); M6 tests it structurally, not conversationally.
- **Model visibility must be read from the rendered `<available_skills>` block**, never from
  `systemPromptOptions.skills`, which lists user-invoked skills too.
- **`pi install <path> -l` on Windows writes a backslash-relative package path** and refuses npm
  packages until run with `--approve`/`-a`. Repair the package entry to forward slashes before any probe.
- **`pi-subagents@0.69.0`'s `resolveSettingsPackageRoot` accepts only forward-slash relative sources**,
  so on a Windows path install the package's four `mp-*` agents do not resolve until the entry is
  repaired. This is the README troubleshooting entry §M3.5 owes.
- **Foreground children never load the parent's ambient extensions; background (detached) children do.**
  D14 is documentation-only for the shipped agents because the two web-using agents default to
  `async: true`; the M6 integration test is what locks that.
- **A read-only agent given an implementation task is refused pre-spawn** ("… has no mutation-capable
  tools"), and a foreground child that needs web tools fails naming the unavailable tools.
- **A relative `output:` routes into `pi-subagents`' managed artifact storage**, not into the repo
  worktree; the parent must persist the collected note to the repo path it chose.
- **The `git-guardrails` extension is inert without an opt-in file, and the manifest key is
  load-bearing** (a copy without `pi.extensions` did not load it). Its patterns come from
  `skills/misc/git-guardrails/scripts/block-dangerous-git.sh` at load time.
- **`wizard` / `diagnosing-bugs` shell templates** pass `bash -n` but were not run end-to-end; on
  Windows they depend on `mktemp`/`tput`/`xdg-open`/`gh` and on a real terminal for hidden input.
- **D5 rows with zero upstream occurrences at the pin** (D5-07, D5-09, D5-10, D5-11, D5-12, D5-19, and
  the literal `Task tool`) cannot be exercised against a real upstream occurrence (M1 §6.5).

### Deliverables (per §6/M6)

#### 1. `scripts/fetch-upstream.mjs` — drift reporter (D9)

Fetch the pinned commit `c55ee46073ed923f86ce59a5eb3b6d895095d1b7` into a scratch/cache location
(never vendored into this repo), and for every shipped row in `docs/skill-inventory.json` report
whether the live upstream file differs from the ported file, and if so where. It must be usable as a
review aid, not a gate that rewrites anything: it never edits a ported file, and it reports a
non-matching set without failing on expected mapped regions. Record its re-fetch command and cache
convention (M1 §1 item 2 keeps the cache at `../mp-upstream-c55ee46`, outside this repo).

#### 2. `scripts/smoke-test.sh` — the installed-package test, plus `npm test`

Installs the pinned `pi-subagents@0.69.0`, the pinned `pi-web-access@0.29.0`, and **this package** into
a fixture repo outside this repository, then asserts, from the **installed package copy**:

- parent tool availability and every package skill name resolving to this package's `skills/` path
  (collision check, D11);
- every cross-skill `.../SKILL.md` reference resolving from the installed copy, not just from the
  working repo (D4 — this is the risk §8 calls "High");
- `enableSkillCommands` on, each user-invoked skill resolving as `/skill:<name>`, and each model-invoked
  skill appearing in the rendered `<available_skills>` block (D3);
- the `git-guardrails` extension loading from the installed package and blocking a listed pattern while
  a safe command passes (the M5 evidence, re-run from a fresh install);
- a scripted local-Markdown workflow end to end.

Add a `scripts` block to `package.json` so `npm test` runs the validator (and the smoke test if it can
be made non-interactive and cheap); **no runtime dependencies may be added to make that work.** Report
what can and cannot run in this environment, and why.

#### 3. Invocation-model test (D3)

The check §7 calls "most likely to regress". For a sample of user-invoked skills assert a
natural-language request does **not** start the skill and `/skill:<name>` does; for a sample of
model-invoked skills assert the reverse. Include `setup-matt-pocock-skills` and at least one M3/M4 and
one M5 skill on the user-invoked side, and both M5 model-invoked skills on the other.

#### 4. Collision test (D11)

Install a decoy skill with a colliding name into the fixture before this package and assert setup
reports the colliding name and its source; where provenance is unavailable, assert it reports the name
as **unattributed** rather than silently claiming resolution. The M2 §5 shadowing finding is the
mechanism: `pi.getCommands()` shows only the winner, so the on-disk scan is part of the check.

#### 5. Parallelism tests

Assert overlapping research children actually run concurrently, that both review axes complete, and that
a child failure/abort/timeout leaves the affected ticket or axis unresolved and visible. These reuse the
M3/M4 dispatch contracts (`runs.all`, `context: "fresh"`, unique `output:`, parent persistence, parent
serialization of tracker writes). A deliberately failing child is required, not just a happy path.

#### 6. Child-extension integration test (D14)

Launch a real **foreground** child and assert `web_search`, `fetch_content`, `get_search_content`, and
`source_check` are registered from the resolved `pi-web-access` path; then assert a missing provider
fails the run naming the unavailable tools instead of continuing. If no shipped agent exercises the
foreground path, say so and test the mechanism directly rather than inventing an agent.

#### 7. Tracker tests

The local-Markdown path is already exercised (§M4.10). M6 owes the `gh` and `glab` paths: run each
template's documented commands or record precisely why they could not be run here (absent CLI,
unauthenticated, no remote). Do not mark an untested path as tested. The `--jq` flags in
`skills/engineering/setup-matt-pocock-skills/issue-tracker-github.md` are `gh` CLI arguments, not the
banned hook `jq` — leave them.

#### 8. Upgrade-policy validation (D13)

Run the smoke test against the pinned versions (must pass) and against the latest versions
(informational). Record any drift in the README compatibility note and in §M6 notes. "Pinned" means
validated-at-this-version and skipped by bulk updates, **never hard-locked**; the README must keep
saying so.

#### 9. `mp-evidence-auditor` discriminating re-test (M4.8)

Re-run the comparison against a **discriminating** seam — a disputed or contradicted claim, or the
custom auditor restricted to the cited URL with corroboration barred — and either collapse to the
built-in `evidence-auditor` (a D16 item 5 change, so it needs a recorded decision and, if the tree
changes, the M6 notes) or record why it still stands. The M4 comparison used a non-disputed,
well-sourced claim and therefore did not establish functional identity.

#### 10. README finalization

- Finalize the skill index: drop "provisional", keep the invocation column, keep `teach`
  `(experimental)` (D15) and `git-guardrails` marked as the upstream rename.
- Keep the git-URL install route first (D12) and the npm route second; state that both install the same
  tree.
- Add the **compatibility note**: only the pinned `pi-subagents` / `pi-web-access` versions are
  validated, pinned means skipped-by-bulk-updates (D13), and what to do if an upgrade breaks the
  preflight (reinstall the pinned version; do not weaken the check).
- Add the **Windows backslash-path troubleshooting entry** (§M3.5): the symptom (the `mp-*` agents or
  package skills do not resolve after `pi install <path> -l`), the cause (a backslash-relative entry),
  and the remedy (rewrite the entry to forward slashes).
- Document the **`git-guardrails` extension**: what it blocks, the opt-in files, `patterns`,
  `enabled: false`, `PI_GIT_GUARDRAILS=off`, and that installing the package alone changes nothing.
- Document the `extensions/` manifest surface and keep the shadowed-name entry.
- Correct anything the index still gets wrong after M5 (counts, the `misc` bucket, the extension).

#### 11. `CHANGELOG.md` 0.1.0, tag, publish (D12)

Move `[Unreleased]` to a dated `v0.1.0` section, mark the M6 roadmap entry landed, and follow the
M0–M5 convention. Tag `v0.1.0` and publish to npm (`pi-adapted-mp-skills`) — see question 1 before
doing either.

#### 12. `docs/NOTES.md` — an `## M6` section

Append (do not touch M0–M5): what ran live vs. structurally, the smoke-test results, the collision and
invocation findings, the parallelism and child-extension results, the tracker results, the upgrade-policy
drift, the evidence-auditor outcome, the README decisions, every plan silence or error with what was
done instead, and the release record.

#### 13. Stretch: GitHub Action

A workflow that runs `node scripts/validate-skills.mjs` (and `fetch-upstream.mjs` in report-only mode)
on pull requests. In scope only if question 5 says so.

### Acceptance (from §6/M6, made concrete)

- **Fresh machine + fresh repo → install → complete the guide's `Small Feature Example` and the first
  three sessions of the `Amazon Refund Import` worked example without touching a Claude-only
  mechanism.** "Without touching a Claude-only mechanism" is checkable: no `Skill tool`, `Task tool`,
  `/clear`, `CLAUDE.md`, `agents/openai.yaml`, `.claude/`, or `~/.claude` anywhere in the flow; every
  hand-off uses `/skill:<name>` or the D4 relative load; every delegation uses the `subagent` tool; the
  handoff/report artifacts land in `.scratch/`.
- `npm test` runs the validator end to end with zero errors, on a bare Node install, with no runtime
  dependencies.
- `scripts/smoke-test.sh` passes against the pinned versions from an **installed** copy and reports the
  latest-version result as informational.
- The invocation-visibility and collision tests produce recorded, reproducible results (and, per
  question 2, land where the owner decides).
- `README.md` has no "provisional" index marker, documents the extension and the Windows path defect,
  and states the D13 compatibility contract.
- `CHANGELOG.md` is dated `0.1.0`; the tag exists; the npm publish either succeeded or is recorded as
  the one remaining human step (question 1).
- D5 hash still matches; `docs/ADAPTATION_PLAN.md` and `docs/skill-inventory.json` are byte-identical to
  `fca16af` except for the one sanctioned §7 write, if question 2 authorizes it.

### Constraints and traps

- **Trap A — §7 asks for a write to the frozen inventory.** §7's table says the invocation-visibility
  results are recorded "in `docs/skill-inventory.json`". Every milestone since M1 has treated that file
  as frozen apart from the sanctioned D5 append, and M5 shipped without touching it. Ask before writing
  (question 2). If the answer is yes, add a new top-level `validation` block only: never a row, never a
  `tokenMap` entry, so the D5 hash is unaffected.
- **Trap B — release actions are irreversible and blocked on an unconfirmed owner.** The GitHub owner
  `netname` is inferred from the git remote and has never been confirmed (NOTES §M0.5 item 1). It
  appears in `README.md`, `NOTICE`, and `CHANGELOG.md` and determines the npm package scope and the tag
  URL. Ask before tagging or publishing (question 1).
- **Trap C — `gh` / `glab` may be absent or unauthenticated.** Do not simulate a tracker test. Record
  the exact commands, the exact failure, and mark the path unverified; the guide's failure-mode table is
  a test key, not a script to fake.
- **Trap D — the smoke test must read the installed copy.** §8 rates "cross-skill relative paths break
  after install" as High. A test that resolves from the working repo passes while the shipped package is
  broken; assert the installed path explicitly.
- **Trap E — D13 is a contract, not a lock.** Do not convert the pinned installs into npm
  `dependencies` or lockfiles, and do not make the preflight pass a date-dependent check.
- **Trap F — do not add a validator check for `setup-pre-commit`** (D15) or for any deferred skill.
- **Trap G — Windows.** `scripts/smoke-test.sh` under Git-Bash has real limits (`mktemp` POSIX paths,
  absent `tput`, no `xdg-open`, interactive-only `read -rs`, `gh` absent). Record them in §M6 the way
  §M4.7 recorded the template limits; do not paper over a skipped step.
- **Trap H — zero-occurrence D5 rows.** D5-07, D5-09..12, D5-19, and the literal `Task tool` have no
  upstream occurrence at the pin (M1 §6.5), so the M6 tests can exercise the behaviour but cannot
  produce a drift finding for them. Say so rather than implying coverage.

### Before you start, ask me

1. **Release scope.** Options: **(A, recommended)** prepare everything and stop before the irreversible
   steps: finalize `CHANGELOG`, commit, and leave the tag/publish as a documented one-command hand-off
   with the exact commands — because the owner `netname` is still unconfirmed and publishing needs
   credentials and an npm scope decision; **(B)** tag `v0.1.0` locally but do not publish; **(C)** tag
   and publish now, treating `netname` as final. I recommend A or B: the milestone's own acceptance can
   be fully demonstrated without publishing, and a wrong npm scope is expensive to undo.
2. **Where the invocation-visibility results live.** Options: **(A, recommended)** a new top-level
   `validation` block in `docs/skill-inventory.json` (rows and `tokenMap` untouched, so the D5 hash
   still matches), because §7 names that file and M6 is the one milestone authorized to finalize it;
   **(B)** record only in `docs/NOTES.md` §M6 and the README, keeping the inventory byte-identical to
   `fca16af`. I recommend A, with the write limited to a new block and no row edits.
3. **Live acceptance scope.** Options: **(A, recommended)** run the guide's `Small Feature Example` and
   the first three `Amazon Refund Import` sessions end to end in a fixture repo, since M3/M4 already ran
   the individual legs live and the value here is the cross-leg fidelity check; **(B)** scripted smoke
   scenarios only, and mark the worked example as structurally verified. I recommend A if it fits the
   session, because it is the only test that exercises the guide's own checklists in order.
4. **Upgrade-policy validation.** Options: **(A, recommended)** pinned (must pass) plus latest
   (informational, drift recorded in the README); **(B)** pinned only, with the latest-version test left
   as a documented manual step. I recommend A: D13's whole point is that newer versions are allowed but
   not guaranteed, and only a run shows where the surface moved.
5. **Stretch GitHub Action.** In scope (A) or deferred to post-v1 (B)? The plan marks it a stretch task
   and §10 lists it as a post-v1 candidate; I have no recommendation, but B keeps M6 to what the
   acceptance needs.
6. **`gh` / `glab` handling.** If either is unavailable here, is a recorded "unverified, with the exact
   commands" result acceptable (A), or should M6 stop and wait for an environment where both exist (B)?
   I recommend A: §7's table only requires the local-Markdown path to be tested, and M4 already recorded
   the other two as untested.

Non-blocking, carried forward: the GitHub owner `netname` (NOTES §M0.5 item 1) is still unconfirmed and
gates question 1. The M5 `extensions/` manifest deviation is recorded in NOTES §M5.4/§M5.7 but §4's tree
and D1's literal manifest still do not mention it — the plan is frozen, so the README is where it gets
documented, and §M6 should say so explicitly.

### When done

Report in this shape:

- Files created/changed (paths + one-line purpose each)
- The validator result (file/`SKILL.md` counts) and the D5 freeze result
- `scripts/fetch-upstream.mjs`: what it fetched, what it compared, what drift it found
- `scripts/smoke-test.sh` and `npm test`: what ran, from which install, and what it asserted
- The invocation-model, collision, parallelism, child-extension, and tracker test results
- The upgrade-policy drift (pinned vs. latest) and where it is recorded
- The `mp-evidence-auditor` re-test outcome and whether the tree changed
- The README decisions (index, compatibility note, backslash entry, guardrail docs)
- The release state: changelog, tag, publish (or the exact remaining command)
- Every plan silence or error you hit, with what you did instead
- Confirmation that D1–D16 were not altered, that `docs/ADAPTATION_PLAN.md` and the D5 table are
  byte-identical to `fca16af`, and that no deferred skill was ported
