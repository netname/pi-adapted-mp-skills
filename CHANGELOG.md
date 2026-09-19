# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- D17 — installation route and scope (see `docs/ADAPTATION_PLAN.md`): `pi install` is the only
  route for this package because it ships skills, subagent definitions, and an extension in one
  manifest; scope is chosen by flag (`pi install` vs `pi install -l`) and never prompted;
  `.agents/skills` remains the documented convention for skill sets that ship nothing else; and
  the two routes are never mixed for the same skill set, because package resources rank last in
  Pi's skill precedence and the `.agents/skills` copy would shadow the package's.
- `docs/upstream/vercel-labs-skills-pi-agents-dir.md` — drafted upstream issue asking
  `vercel-labs/skills` to map its `pi` agent to `.agents/skills` instead of `.pi/skills`, with
  before/after evidence and the universal-agent side effect disclosed. Not filed.

### Changed

- Unpinned the runtime prerequisites. `pi-subagents` and `pi-web-access` are installed without
  a version — `pi install npm:pi-subagents`, `pi install npm:pi-web-access` — in the skills'
  preflight remedies and in the README. `pi update` advances both; no version is validated or
  guaranteed. Amends D13.
- `scripts/smoke-test.sh` installs the floating pair instead of parsing pinned versions out of
  the README. The separate `latest` stage is removed because the main run now *is* the floating
  run; the versions actually resolved are reported in the summary. `MP_SUBAGENTS_SPEC` /
  `MP_WEB_SPEC` override either spec for a single run.
- README: the "Pinned vs. floating" section is now "Updates", and the compatibility note states
  that no version is validated rather than that only the pinned pair is.
- README Install section now documents the two install scopes (`pi install` vs `pi install -l`)
  with their settings files and package trees, states that the skills resolve from the package
  tree rather than `.agents/skills/`, and adds the "one route per skill set" warning (D17).

## [0.1.0] - 2026-09-19

### Added

- `package.json` for `pi-adapted-mp-skills` with the `pi-package` keyword and the Pi
  manifest (`pi.skills` → `./skills`, `pi.subagents.agents` → `./agents`). No runtime
  dependencies: `pi-subagents` and `pi-web-access` are separately installed Pi packages,
  not bundled dependencies (D13).
- `README.md` documenting the git-URL install route first and the npm route second (D12),
  the per-capability prerequisites (D10), the pinned-vs-floating update behavior (D13),
  the invocation model and `enableSkillCommands` requirement (D3), a provisional skill
  index with an invocation column, and shadowed-skill-name troubleshooting (D11).
- `LICENSE` — upstream MIT license text, preserved verbatim from
  `mattpocock/skills` at the pinned commit.
- `NOTICE` — upstream attribution: repository URL, pinned commit
  `c55ee46073ed923f86ce59a5eb3b6d895095d1b7`, and this package's own repository URL (D8).
- `.pi/settings.json` — dev-only configuration that loads `skills/` from the repository
  root (resolved as `../skills`, since paths in `.pi/settings.json` resolve relative to
  `.pi`) for local testing before install.
- `agents/.gitkeep` — keeps the manifest-declared `./agents` directory present until M2
  adds the four `mp-*` agent definitions.
- `skills/placeholder/SKILL.md` — temporary discovery probe used by the M0 acceptance test,
  removed once discovery was verified.

#### M2 convention layer (landed 2026-09-18)

- `scripts/validate-skills.mjs` — dependency-free linter: D5-hash freeze check, Pi frontmatter
  rules, dropped-field (D2), cross-skill `SKILL.md` resolution (D4), forbidden tokens (D5),
  invocation/description consistency (D3), duplicate names (D11), and inventory consistency.
- `agents/mp-researcher.md`, `agents/mp-evidence-auditor.md`, `agents/mp-review-standards.md`,
  `agents/mp-review-spec.md` — contract-encoded package agents (D16). The two web-using agents
  default to detached launches and inherit `pi-web-access` ambiently, which closes D14 as
  documentation only; `agents/.gitkeep` removed.
- `skills/engineering/setup-matt-pocock-skills/` — `SKILL.md` rewritten for Pi (D6) with the ordered
  preflight (capability-scoped `subagent` and web checks; blocking collision and
  `enableSkillCommands` checks), plus the adapted sidecars `issue-tracker-{github,gitlab,local}.md`,
  `domain.md`, and `triage-labels.md`; `skills/.gitkeep` removed.
- `skills/engineering/ask-matt/` — `SKILL.md` + `PHASE-BOUNDARIES.md` adapted: 24 `/skill:<name>`
  labels, `/clear` → `/new`, `/compact` kept, and a Pi-appropriate harness-swap example.
- Per-file diff notes (D9) and the full M2 record, deviations, and acceptance evidence are in
  `docs/NOTES.md` §M2.

#### M3 main flow (landed 2026-09-19)

- `skills/engineering/grill-with-docs/SKILL.md` — the upstream one-line Skill-tool body became the
  two D4 load instructions: `../../productivity/grilling/SKILL.md` and
  `../domain-modeling/SKILL.md`.
- `skills/productivity/grilling/SKILL.md` — fact-finding now uses the parent's own `read`/`grep`/
  `find`/`ls` instead of dispatching a child, so `grilling` stays ungated (Trap B, option A).
- `skills/engineering/domain-modeling/` — `SKILL.md` (metadata) plus verbatim `CONTEXT-FORMAT.md`
  and `ADR-FORMAT.md`.
- `skills/engineering/to-spec/SKILL.md`, `skills/engineering/to-tickets/SKILL.md` — the
  `/setup-matt-pocock-skills` hand-off is now the `/skill:setup-matt-pocock-skills` label.
- `skills/engineering/implement/SKILL.md` — `/tdd` and `/code-review` became the D4 loads
  `../tdd/SKILL.md` and `../code-review/SKILL.md`; the `pi-subagents` capability gate is stated.
- `skills/engineering/tdd/` — `SKILL.md` loads `../codebase-design/SKILL.md` for vocabulary; verbatim
  `tests.md` and `mocking.md`.
- `skills/engineering/code-review/SKILL.md` — rewritten to the two-axis dispatch contract:
  `mp-review-standards` and `mp-review-spec` concurrently in fresh, read-only contexts, the parent
  captures the diff to `.scratch/reviews/` and passes paths, and it does not synthesize until both
  return. The Fowler smell baseline now lives only in `mp-review-standards.md` (D16).
- `skills/engineering/prototype/` — `SKILL.md` (metadata) plus verbatim `LOGIC.md` and `UI.md`.
- `skills/productivity/handoff/SKILL.md` — writes `.scratch/handoffs/<ISO>-<slug>.md`, prints the
  absolute path, and ensures the path is git-ignored by default; `argument-hint` dropped (D2) and
  the suggested-skills section now names `/skill:<name>` labels.
- `skills/engineering/codebase-design/` — `SKILL.md`, `DEEPENING.md`, and `DESIGN-IT-TWICE.md`, moved
  from M4 to M3 because `tdd`'s D4 load requires the target to exist; the only inventory edit is that
  row's `ownerMilestone`/`notes`.
- `docs/skill-inventory.json` — one hunk: `codebase-design` `ownerMilestone: M4 → M3` plus a note.
  The D5 `tokenMap` is untouched, so the frozen hash still matches.
- Per-file diff notes (D9), deviation notes, the dispatch contract as run, the Windows
  `pi install` backslash-path finding, and the acceptance evidence are in `docs/NOTES.md` §M3.

#### M4 on-ramps, discovery, and health (landed 2026-09-19)

- `skills/engineering/wayfinder/SKILL.md` — the richest D4 case: the three "call the Skill tool
  twice" occurrences each became two `../domain-modeling/SKILL.md` and
  `../../productivity/grilling/SKILL.md` loads; the research load (`../research/SKILL.md`) and the
  prototype load (`../prototype/SKILL.md`); the chart step now fires one detached `mp-researcher`
  child per `research` ticket in one concurrent batch, with a unique `output:` per child, children
  forbidden from touching the map/tickets, the parent serializing every tracker write, and the
  parent creating and committing the throwaway `research/<name>` branch (Trap A, option A).
- `skills/engineering/research/SKILL.md` — adapted: the harness-only body became the dispatch
  contract (one detached `mp-researcher` child, D10 gates with the pinned `pi-subagents` and
  `pi-web-access` remedies, unique `output:`, run identity saved, result collected before the
  question is answered, failed/refused child leaves the question unresolved).
- `skills/engineering/triage/` — `SKILL.md` (label + `/skill:` fixes and the two D4 loads),
  `AGENT-BRIEF.md` (sample `/skill:triage`), and verbatim `OUT-OF-SCOPE.md`. Labels map to the
  target repo's `docs/agents/triage-labels.md`.
- `skills/engineering/diagnosing-bugs/` — `SKILL.md` (metadata only) plus verbatim
  `scripts/hitl-loop.template.sh`; no cross-skill load (the pinned file has none).
- `skills/engineering/improve-codebase-architecture/` — `SKILL.md` (three D4 loads, the `subagent`
  tool named for the codebase walk, `/skill:codebase-design` labels, and the report relocated from
  the OS temp directory to `.scratch/reports/<ISO>-architecture.html`, git-ignored by default with
  the absolute path printed) plus `HTML-REPORT.md` (same report path and labels; CDN links kept).
- `skills/engineering/resolving-merge-conflicts/SKILL.md` — harness-neutral body ported verbatim,
  D2 metadata added.
- `skills/engineering/wizard/` — `SKILL.md` (metadata only) plus `template.sh` with the
  `/wizard` → `/skill:wizard` comment fix; both shell templates pass `bash -n`, and the Windows
  limits are recorded.
- The live `pi-subagents` dispatch contract (exact `subagent`/`runs.all` calls, concurrency,
  output paths, result collection, failure handling), the Trap A and Trap B evidence, the
  `mp-evidence-auditor` vs built-in `evidence-auditor` comparison and its keep decision, the report
  relocation, and the Windows notes are in `docs/NOTES.md` §M4.

#### M5 productivity and misc (landed 2026-09-19)

- `skills/productivity/grill-me/SKILL.md` — the upstream one-line Skill-tool body became the D4
  same-bucket load `../grilling/SKILL.md`, the only M5 cross-skill load.
- `skills/productivity/to-questionnaire/SKILL.md` and `skills/productivity/wait-what/SKILL.md` —
  bodies verbatim, D2 metadata added. `to-questionnaire` still writes
  `to-questionnaire-<slug>.md` in the current directory (target-repo output).
- `skills/productivity/writing-for-agents/` — `SKILL.md` rewritten from `AGENTS.md` / `CLAUDE.md`
  to `AGENTS.md` in both the description (keeping model-facing trigger phrasing) and the body; the
  verbatim `SKILL-MECHANICS.md` reference doc already uses Pi's `description` /
  `disable-model-invocation` field names, so no harness reconciliation was needed beyond that.
- `skills/productivity/teach/` — `SKILL.md` with `argument-hint` dropped (D2/D5-18) plus the four
  verbatim `MISSION-FORMAT.md`, `GLOSSARY-FORMAT.md`, `LEARNING-RECORD-FORMAT.md`, and
  `RESOURCES-FORMAT.md` sidecars. One `GLOSSARY.md` bullet was added to `SKILL.md` because upstream
  ships `GLOSSARY-FORMAT.md` unlinked (upstream issue #559); this is the milestone's only body text
  added outside the D5 map, and it is recorded in `docs/NOTES.md` §M5.6.
- `skills/misc/git-guardrails/` (new bucket) — `SKILL.md` renamed from
  `git-guardrails-claude-code` (D3) and rewritten for Pi: the hook / `.claude/settings.json` /
  `~/.claude` / `$CLAUDE_PROJECT_DIR` procedure is replaced by an opt-in config file that turns on
  the packaged extension; the dangerous-command pattern list and the block intent are preserved.
  `scripts/block-dangerous-git.sh` keeps the upstream `DANGEROUS_PATTERNS` array but is no longer a
  hook (no stdin, no `jq`, no exit-2 contract) — it is now a standalone checker and the extension's
  single source of truth for the pattern list.
- `extensions/git-guardrails.ts` — new package extension implementing D5-20: a
  `pi.on("tool_call", …)` handler that returns `{ block: true, reason }` for a `bash` call matching
  a dangerous-git pattern, mirroring `permission-gate.ts`. Inert until the user opts in via
  `.pi/git-guardrails.json` or `~/.pi/agent/git-guardrails.json`; patterns are customizable and
  `PI_GIT_GUARDRAILS=off` disables it. `package.json`'s `pi` manifest gains
  `"extensions": ["./extensions"]` — a recorded deviation from D1's literal manifest and §4's
  tree, both of which §10/D5-20 otherwise leave without a home for this resource (NOTES §M5.4).
- `scripts/validate-skills.mjs` — check 7 now expects `row.renameTarget` when
  `disposition === "rename"` and only then, so the one frozen D3 rename validates while a renamed
  row that still declares its upstream name, a non-rename row that renames itself, and a rename row
  with no `renameTarget` all still fail (NOTES §M5.4.5). No D5 row and no inventory field changed.
- Per-file diff notes (D9), the rename resolution, the extension design, the live `git push` block
  evidence, and the acceptance results are in `docs/NOTES.md` §M5.

#### M6 validation, docs, and release (landed 2026-09-19)

Milestone M6 ports no skill: the 26-skill set is final for v0.1.0.

- `scripts/fetch-upstream.mjs` — dependency-free drift reporter (D9). It fetches the pinned commit
  into the disposable cache recorded in the inventory (`../mp-upstream-c55ee46`, never vendored,
  re-fetch command printed on every run) and reports, for every shipped row, whether the upstream
  file differs from the ported file and where. It never edits a ported file, exits 0 on drift by
  default (`--strict` opts into a failing exit), and separates EXPECTED regions (the D2 frontmatter
  block and the frozen D5 substitutions) from REVIEW regions. Against the pin: 26 shipped rows, 51
  file pairs, 15 verbatim, 36 patched, 0 missing, and 19 files with a REVIEW region that maps onto
  the per-file adaptations M2–M5 already record.
- `scripts/smoke-test.sh` — the installed-package test. It installs the pinned `pi-subagents@0.69.0`,
  the pinned `pi-web-access@0.29.0`, and a **copy** of this package by relative path into a fixture
  outside the repository, then asserts from the installed copy: discovery and provenance for all 26
  skills (D11), the D3 invocation split read from the rendered `<available_skills>` block, every
  cross-skill `SKILL.md` reference from the installed tree (D4), concurrency and failure handling for
  the dispatch contracts, the D14 child-extension mechanism from a real foreground child, and a
  scripted local-Markdown `/skill:implement` flow. It also reproduces and repairs the Windows
  backslash package entry and, in a separate stage, packs the tree with `npm pack`, installs the
  **published artifact** as a package, and re-runs the discovery assertions against it. The pinned
  dependency versions are read from the README's `## Prerequisites` section with the parse
  **anchored to that section** (and `MP_PINNED_SUBAGENTS` / `MP_PINNED_WEB` overrides), so a version
  example elsewhere in the README, or a missing prerequisites section, can no longer silently change
  what the test installs. Result: 46 passed, 0 failed, 3 recorded skips.
- `scripts/probes/inspect.ts` and `scripts/probes/check.mjs` — the Pi-side snapshot probe and the
  offline assertion helper the smoke test uses. They are test scaffolding, not shipped resources.
- `package.json` — a dependency-free `scripts` block: `npm test` runs the validator, `npm run drift`
  runs the drift reporter, and `npm run smoke` runs the installed-package test. `npm test` needs no
  `npm install` and no network.
- `docs/skill-inventory.json` — one new top-level `validation` block recording the
  invocation-visibility results §7 asks for, plus the collision, parallelism, child-extension,
  tracker, upgrade-policy, and evidence-auditor re-test outcomes. No skills row and no `tokenMap`
  entry changed, so the D5 hash still matches. This is the milestone's only write to that file.
- `README.md` — finalized: the skill index is no longer marked provisional; a compatibility note
  states that only the pinned versions are validated, that pinned means skipped-by-bulk-updates and
  never hard-locked, and that a broken preflight is fixed by reinstalling the pin rather than by
  weakening the check (D13); the Windows backslash-path install defect gets a symptom/cause/remedy
  entry; and the `git-guardrails` extension is documented in full (what it blocks, the opt-in files,
  `patterns`, `enabled: false`, `PI_GIT_GUARDRAILS=off`, and that installing the package alone
  changes nothing), along with the `pi.extensions` / `pi.subagents.agents` manifest surface. It also
  gained the end-user on-ramp the earlier draft lacked: a three-step **Quickstart** (install →
  `/skill:setup-matt-pocock-skills` → `/skill:ask-matt`), a **"which route fits my change?"** table
  mapping situations to skill sequences, and `ask-matt` promoted as the entry point in the intro and
  the skill index.
- `mp-evidence-auditor` re-test (M4.8): both the custom agent and the built-in `evidence-auditor`
  were run on a discriminating seam — a contradicted claim and a cited-source-cannot-support claim.
  Verdicts matched on both, but the output contracts still differ and the collapse's mandated
  recording site (§D16, plus the §4 tree and the D5-07 row) is frozen, so the custom agent is
  retained; the decision and the post-v1 follow-up are recorded in `docs/NOTES.md` §M6 and in the
  inventory's `validation.evidenceAuditorRetest`.
- `docs/NOTES.md` — the `## M6` section: what ran live versus structurally, the smoke-test results,
  the invocation/collision/parallelism/child-extension/tracker findings, the upgrade-policy drift,
  the evidence-auditor outcome, the live acceptance run against the guide's own examples, and the
  release record.
- Release: `package.json` is `0.1.0` and this changelog is dated `2026-09-19`. Tagging `v0.1.0`
  and publishing to npm are deliberately left as the release hand-off (question 1, option A): both are
  irreversible and need the owner's confirmation and registry credentials. See `docs/NOTES.md` §M6
  for the exact commands.

[Unreleased]: https://github.com/netname/pi-adapted-mp-skills/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/netname/pi-adapted-mp-skills/releases/tag/v0.1.0
