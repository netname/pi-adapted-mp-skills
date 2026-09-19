# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- M1: upstream inventory and frozen adaptation contract (`docs/skill-inventory.json`).
- M2: convention layer — `setup-matt-pocock-skills` templates, `ask-matt` router,
  and the four `mp-*` agent definitions under `agents/`.
- M3: main flow — `grill-with-docs`, `grilling`, `domain-modeling`, `to-spec`,
  `to-tickets`, `implement`, `tdd`, `code-review`, `prototype`, `handoff`.
- M4: on-ramps and health — `wayfinder`, `research`, `triage`, `diagnosing-bugs`,
  `improve-codebase-architecture`, `codebase-design`, `resolving-merge-conflicts`, `wizard`.
- M5: productivity and misc — `grill-me`, `to-questionnaire`, `wait-what`,
  `writing-for-agents`, `teach`, `git-guardrails`.
- M6: validator, smoke tests, README finalization, `v0.1.0` tag, npm publish.

## [0.1.0] - 2026-09-18

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

[Unreleased]: https://github.com/netname/pi-adapted-mp-skills/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/netname/pi-adapted-mp-skills/releases/tag/v0.1.0
