# Lab testing contract

Approved seams: docs/specs/quote.md. Commands run from the candidate worktree.

| Profile | Ticket A | Ticket B | Ticket C / combined candidate |
| --- | --- | --- | --- |
| Fast | npm run test:unit | npm run test:integration | focused failing test, then npm test |
| Verify change | npm run test:unit | npm run test:integration | npm test |
| Verify candidate | after A only: unit | after A+B: unit and integration | npm test |

After integration run the union of tests for integrated tickets, not tests for unimplemented tickets. Final delivery always requires all three suites. E2E means the complete CLI process journey here, not browser automation. No lint/typecheck gate is configured in this deliberately dependency-free JS lab; do not claim one ran.

No shared database/port/queue. Filesystem tests allocate a unique OS temporary directory per test and clean it up. Concurrent test runs must not share output directories. A killed process may leave its own temp directory; inspect ownership before cleanup. Catalog inputs are immutable per run.

Use the package's examples/validation-lab/verify.mjs for committed Verify change/candidate evidence: profiles unit, integration, e2e, all or combined-ab. It records SHA, commands, exits, source cleanliness and logs in a unique run directory. Nonzero exit or source mutation blocks the gate. Fast checks can use npm directly while source is dirty.

One test command timeout: 60 seconds. Test failure is not retried automatically. A coordinator may request a repair and rerun, within the two-repair budget. Required missing checks block delivery; no skips counted as passes.
