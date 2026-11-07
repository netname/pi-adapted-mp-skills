# Project delegation

Transport: Herdr TUI, session `<name>` (or the default session). One coordinator per effort, running in a Herdr pane.
Helper: `node <package>/scripts/herdr-delegate.mjs` (absolute path on this host).
Run records and code-review reports: `<absolute, Git-ignored directory in the original project, for example <project>/.scratch/<effort>/runs>` (outside every worker worktree). Design-review reports: `docs/designs/reviews/` in the project.
Maximum implementation workers: 2.
Maximum research workers: 3.
Maximum repair attempts per failed ticket: 2; then pause and report.
Batch run time limit (`--timeout-ms`): 30 minutes unless a row says otherwise. Interactive wait limit (`herdr agent wait --timeout`): configure.
Role rows as data (optional): `docs/agents/delegation.json`, from `delegation.template.json`. When it exists, launch with `--config <its absolute path> --role <role>`, check it with `herdr-delegate.mjs config check`, and regenerate the table below with `config render <json> --write <this file>`.

<!-- delegation-roles:start: generated from delegation.json by `herdr-delegate.mjs config render`; edit the JSON, not this table -->
| Role | Harness | Mode | Harness arguments (after `--`) | Exact model | Family |
| --- | --- | --- | --- | --- | --- |
| Planning | Claude Code | (coordinator's own session) | — | configure from host | Claude |
| Implementation | Pi | interactive | `--model <provider/id>` | configure from host | DeepSeek |
| Spec review | Claude Code | batch | `--model <id> --tools Read,Grep,Glob --permission-mode dontAsk` | configure from host | Claude |
| Standards review | Claude Code | batch | `--model <id> --tools Read,Grep,Glob --permission-mode dontAsk` | configure from host | Claude |
| Design comprehension | Pi or another installed harness | batch | read-only tools for that harness | configure from host | differs from design authors |
| Design challenge | Pi or another installed harness | batch | read-only tools for that harness | configure from host | differs from design authors |
| Research | choose source-capable harness | interactive | model and source tools | configure from host | configure |
<!-- delegation-roles:end -->

Replace all placeholders with harnesses and models actually available on this host (`pi --list-models`, a signed-in `claude`).
Install the Herdr integration for every interactive harness: `herdr integration install pi`, `herdr integration install claude`.
The coordinator verifies the effective model with `herdr-delegate.mjs inspect <record> --expect-model <provider/model>`, not these names.
Write *Exact model* in the form `inspect` reports it: `<provider>/<id>`. For Pi this is the same value as `--model`. For Claude Code, put `anthropic/` in front of the `--model` ID (`--model claude-sonnet-5-5` → `anthropic/claude-sonnet-5-5`).
Review family must differ from all implementation families in the candidate.
Preserve run IDs, revisions, outputs and status in the tracker.
