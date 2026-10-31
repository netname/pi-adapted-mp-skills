---
name: implement-spec
description: "Coordinate a spec's dependency graph through isolated workers, verification and independent review."
disable-model-invocation: true
license: MIT
metadata:
  upstream: mattpocock/skills
  upstream-commit: 24fe0ef7737efae15c87225755e9f6f5965e4888
  upstream-path: skills/engineering/implement-spec
  adapted-for: pi
---

Read `../_shared/ARCHITECTURE.md`. Before the loop, after restart, before each dispatch and before accepting integration, check the current accepted design/plan and configured readiness record. Supply its constraints and identities to workers. Reopen affected design decisions for material deviations; at completion reconcile the model/design with implemented behavior. A ready tracker label alone is insufficient.

The tracker stores durable tickets, dependencies, claims and evidence. The coordinator is the single active session that chooses ready work, owns Paseo workers, serializes integration and updates that tracker. Paseo supplies sessions/worktrees; it does not define completion or run the test policy for you.

Read `../_shared/DELEGATION.md`, `../_shared/TESTING.md` and the project's tracker/delegation/testing configuration. Confirm the tracker includes the implementation state fields, ownership, evidence and closure rules from setup; missing execution conventions block dispatch. For a local tracker, resolve its canonical absolute root once and pass absolute inputs to every worker. Read the spec and approved tickets. Reuse existing user decisions. No implementation may start with unresolved requirements or missing required test commands.

## Coordinator loop

1. Acquire exclusive coordination for this effort using the tracker/project's lock mechanism. Assigning an issue alone is not an atomic distributed lock. If no lock is available, operate as a single coordinator and refuse a second concurrent coordinator. Record integration branch, starting base SHA, worker limit and bounded retry budget. Create a dedicated integration worktree from the agreed base; never reset a user's checkout.
2. Reconcile persisted runs before launching: inspect live Paseo run IDs, branches, revisions and evidence. Do not relaunch a claimed ticket merely because this session restarted. Unknown ownership, dependency cycles or no progress with open tickets means stop and report the blocker.
3. Compute the frontier: unclaimed ready implementation tickets whose blockers are **integrated and verified**, not merely worker-complete. `scripts/frontier.mjs` validates a normalized graph and prints eligible IDs; the tracker remains authoritative. Claim tickets serially before dispatch. Respect the worker cap and runtime resource constraints.
4. Create one branch/worktree per ticket from the current verified integration SHA. Launch fresh workers through Paseo using `../implement/SKILL.md` in coordinated mode. Give each worker the spec, ticket, immutable base, approved seams and test/environment contract. Workers never share writable worktrees or databases without a lease.
5. Collect a committed candidate and Verify change evidence. Run `../code-review/SKILL.md` with independent reviewers. Failed checks or blocking findings go back to a worker with a bounded repair budget. No unbounded automatic retry loops. Record failed/cancelled runs; keep their tickets unresolved.
6. Integrate **one candidate at a time**, with no other writers in the integration worktree. A clean reviewed candidate can fast-forward only when its base is still the integration tip. Otherwise merge into a disposable candidate worktree based on the latest integration tip, resolve conflicts by requirements, and run affected combined checks and fresh review on that new candidate. Never resolve conflicts by blindly choosing a side. Advance integration only to the verified, reviewed SHA; if the tip changed, re-evaluate instead of force-updating it.
7. Mark the ticket integrated with the resulting SHA/evidence, release its environment and claim, and recompute the frontier. Tracker closure may await the final PR merge; integrated status separately unblocks dependencies. Repeat automatically while eligible work remains. Pause for human decisions, unavailable resources or exhausted retry budgets; report exactly what is needed.
8. When all tickets are integrated, run Verify candidate and review the full integration diff from the original base. Fix and reverify/review changes. Create/update a draft PR when the tracker uses PR-based delivery; use `../pr/SKILL.md`. Report remaining gates honestly. Do not merge the target branch without authorization.
9. Remove only this effort's clean, inactive worktrees whose commits and evidence are retained. Preserve failed work for diagnosis. Release coordination. Resolve tickets according to the configured tracker lifecycle, never mark PR-merge-dependent tickets closed early.

This is an agent-driven loop with a deterministic frontier helper, not a standalone durable scheduler. State and run IDs must survive in the tracker so another session can resume it.
