# Current workflow

For setup, a beginner-friendly explanation and a runnable PR-validation exercise, see [MANUAL.md](MANUAL.md).

The tracker is the durable source of tickets, dependency edges, claims and evidence. The coordinator is one active agent session that reads that state and controls the loop. Paseo launches and supervises sessions and workspaces. Git and project scripts/CI provide source isolation and verification. These responsibilities are separate.

## Planning and execution

Use Wayfinder for unresolved decisions. It can batch and repeat **ready research**; it must stop for a human's grilling/prototype decisions. Once the route is clear, synthesize a spec, explain the proposed architecture with `design-solution`, and independently review it with `review-design`. Resolve human decisions, produce tickets, then check requirement coverage and current design/plan acceptance before dispatch. See [the architecture guide](ARCHITECTURE-GUIDE.md) and [shared policy](../skills/engineering/_shared/ARCHITECTURE.md). The `implement-spec` coordinator launches ready implementation tickets in separate worktrees, collects committed results, dispatches independent review and integrates serially. Dependencies unblock only after verified integration.

Persist run IDs, branches, claims and evidence in the tracker after every transition. On resumption, inspect existing runs before launching replacements. A single coordinator avoids duplicate claims; a multi-coordinator deployment needs an actual lock/lease mechanism. This package supplies no distributed locking service.

## Normalized frontier input

The helper is read-only. Export tracker state to this shape; do not treat the export as a second tracker:

```json
{
  "tickets": [
    { "id": "A", "status": "ready", "blockedBy": [] },
    { "id": "B", "status": "ready", "blockedBy": ["A"] }
  ]
}
```

`node scripts/frontier.mjs graph.json` returns `["A"]`. Allowed states are `ready`, `running`, `review`, `blocked`, `integrated`. A nonempty `claim` prevents dispatch. Integrated tickets require `verified: true` and an `integratedSha`. The helper validates consistency of that representation; the coordinator must verify the SHA/evidence against Git/CI before exporting it. It detects missing blockers and cycles, but does not claim tasks or invoke Paseo.

## Verification

Read [testing policy](../skills/engineering/_shared/TESTING.md). Unit/component/integration/E2E describe test boundaries; Fast/Verify change/Verify candidate describe when and how much to run. Configure exact project commands and required environment resources once, then inherit them in tickets. Worktrees do not isolate databases, ports or workers: provision isolated resources or serialize tests through an exclusive lease.

Read [delegation policy](../skills/engineering/_shared/DELEGATION.md). A different harness using the same model family does not satisfy independent review. Check the actual launched provider/model. If that cannot be verified, do not report the review gate as passed. Read-only prompts are not permission enforcement.

Review snapshots are outside the source tree and must be retained in the evidence store before cleanup. Keep the source worktree frozen while reviews run. A modified candidate invalidates its approval. CI/branch protection remains authoritative for merges; this package does not install application-specific CI.

## Live acceptance checklist

Offline tests do not prove a local Paseo installation or model/provider combination works. Before unattended use, run this small disposable-project trial:

1. Configure role profiles and enable Paseo tools (or CLI access). Launch one researcher and confirm actual model settings, primary-source retrieval and collected cited output.
2. Launch both review axes on a committed sample. Verify a different model family, fresh sessions, exact base/head and no candidate mutations. Simulate a failed reviewer and confirm the gate remains incomplete.
3. Give `implement-spec` two independent tickets and one dependent ticket. Confirm different worktrees/resources, concurrency cap, serial merges and delayed launch of the dependent ticket until integration verification.
4. Cause a test failure and a merge conflict. Confirm no ticket falsely closes, no shared environment is used concurrently, and retries stop at the configured limit.
5. Restart the coordinator. Confirm persisted run IDs are reconciled without duplicate workers. Confirm retained commits/evidence before cleanup.

Record host/Paseo/provider versions and outcomes. Missing tooling is unverified, not passed. ERPNext-specific Bench/site isolation is intentionally left for a subsequent adapter built on this contract.
