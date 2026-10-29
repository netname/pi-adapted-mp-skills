# General testing contract

Read the target project's `docs/agents/testing.md` before planning or implementing. Reuse its commands and approved seams; do not ask to reconfirm an already approved decision.

Test **categories** describe boundaries: unit (isolated logic), component (a module through its public interface), integration (real database/service boundaries), E2E (a deployed user journey). They are separate from execution **profiles**:

| Profile | When | Typical scope |
| --- | --- | --- |
| Fast | Each meaningful implementation cycle | Focused unit/component tests and relevant static checks |
| Verify change | Before reporting a ticket candidate | Affected tests and relevant integration checks; E2E smoke when the changed journey warrants it |
| Verify candidate | After integration and before delivery | Combined regression checks, required integration/E2E and migration checks from project policy |

Choose the cheapest boundary that proves the behavior. Prefer public interfaces and independent expected values. A high seam does not mean every test must drive a browser. Avoid internal mocks and tests that merely repeat the implementation.

## Environment ownership

A worktree isolates source files only. Give concurrent runs separate databases/schemas, ports, cache/queue namespaces, workers, temporary files, storage and external test accounts as needed. Name resources by run ID. If isolation is unavailable, the coordinator acquires an exclusive environment lease and serializes affected verification. Record owner, resource, acquisition and release; no stealing a lease from a live or unknown run. A failed run's environment is inspected/reset before reuse.

The project defines setup, seeding, cleanup and retry commands. Workers never assume an existing shared development database is disposable. Application-specific service and environment rules belong in the target project's contract.

## Evidence and gates

Use deterministic project scripts or CI to execute commands and enforce exit status. Record revision, profile, exact commands, environment ID, exit codes and log locations. A timeout, skipped required test or unavailable environment is blocked/unverified, never passed. Record flaky failures before bounded retries.

Fast checks may run on dirty work during TDD. Verify change and Verify candidate evidence must name the committed candidate, run against its clean worktree, and verify HEAD and tracked/untracked state again afterwards. Commands that alter source invalidate the evidence; commit fixes and rerun affected checks. Ignored runtime output is acceptable.

Review approval applies to a base/head pair. A merge or fix creates a new candidate: rerun affected verification and refresh review for the changed target. Project branch protection/CI remains the final merge gate. Skills describe this policy; they do not create CI or provision environments automatically.
