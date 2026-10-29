# Local tracker for this lab

Canonical root: __STATE_ROOT__
Only the coordinator writes this root; every worker receives its absolute path. Markdown ticket bodies under issues/ are authoritative. graph.json is a derived frontier export, not another tracker. This local directory is ignored by Git: retain/backup the lab root to retain evidence.

Statuses: ready, running, review, blocked, integrated. A nonempty Claim records the active run ID. On successful integration, record integrated SHA, verification manifest, both review results and implementation families. Only verified integration unblocks descendants. Lab tickets may close after final accepted integration because this local-only lab has no PR-merge lifecycle; never apply that closure rule to a GitHub project configured to close on PR merge.

One coordinator at a time. Record the coordinator's run ID in coordinator.md before starting. This file is an ownership record, not an atomic lock. On restart inspect that session in Paseo; do not steal its ownership or start duplicate workers.

Record every transition and UTC timestamp in events.md. Append failures and repair attempts; never replace failure history with a later pass. Repair budget: two repair attempts per ticket, then pause.
