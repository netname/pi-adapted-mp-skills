# Project delegation

Transport: Herdr TUI, session `<name>` (or the default session). One coordinator per effort, running in a Herdr pane.
Helper: `node <package>/scripts/herdr-delegate.mjs` (absolute path on this host).
Run records and review reports: `<absolute evidence directory outside every worktree>`.
Maximum implementation workers: 2.
Maximum research workers: 3.
Maximum repair attempts per failed ticket: 2; then pause and report.

| Role | Harness | Mode | Harness arguments (after `--`) | Exact model | Family |
| --- | --- | --- | --- | --- | --- |
| Planning | Claude Code | (coordinator's own session) | — | configure from host | Claude |
| Implementation | Pi | interactive | `--model <provider/id>` | configure from host | DeepSeek |
| Spec review | Claude Code | batch | `--model <id> --tools Read,Grep,Glob --permission-mode dontAsk` | configure from host | Claude |
| Standards review | Claude Code | batch | `--model <id> --tools Read,Grep,Glob --permission-mode dontAsk` | configure from host | Claude |
| Design comprehension | Pi or another installed harness | batch | read-only tools for that harness | configure from host | differs from design authors |
| Design challenge | Pi or another installed harness | batch | read-only tools for that harness | configure from host | differs from design authors |
| Research | choose source-capable harness | interactive | model and source tools | configure from host | configure |

Replace all placeholders with harnesses and models actually available on this host (`pi --list-models`, a signed-in `claude`).
Install the Herdr integration for every interactive harness: `herdr integration install pi`, `herdr integration install claude`.
The coordinator verifies the effective model with `herdr-delegate.mjs inspect <record> --expect-model <provider/model>`, not these names.
Review family must differ from all implementation families in the candidate.
Preserve run IDs, revisions, outputs and status in the tracker.
