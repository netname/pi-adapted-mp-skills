# Project delegation

Transport: Paseo. One coordinator per effort.
Maximum implementation workers: 2.
Maximum research workers: 3.
Maximum repair attempts per failed ticket: 2; then pause and report.

| Role | Paseo profile | Harness/provider | Exact model | Family |
| --- | --- | --- | --- | --- |
| Planning | configure | Claude Code | configure from host | Claude |
| Implementation | configure | Pi | configure from host | DeepSeek |
| Spec review | configure | Claude Code | configure from host | Claude |
| Standards review | configure | Claude Code | configure from host | Claude |
| Research | configure | choose source-capable provider | configure from host | configure |

Replace all placeholders with profiles/models actually available on this host.
The coordinator verifies effective launched settings, not just these names.
Review family must differ from all implementation families in the candidate.
Preserve run IDs, revisions, outputs and status in the tracker.
