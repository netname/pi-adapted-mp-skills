# Current workflow

For setup, a beginner-friendly explanation and a runnable PR-validation exercise, see [MANUAL.md](MANUAL.md).

The tracker is the durable source of tickets, dependency edges, claims and evidence. The coordinator is one active agent session that reads that state and controls the loop. Paseo launches and supervises sessions and workspaces. Git and project scripts/CI provide source isolation and verification. These responsibilities are separate.

## Solution overview

This repository provides a reusable **development workflow**. The goal is to turn an agreed need into an understandable design, scoped work, independently reviewed code and a verified integrated result, while preserving enough state to resume after a session ends. The coordinator continues through eligible tickets instead of requiring a human to launch each one.

The independent quotation CLI is the teaching application built with that workflow. Its goals and runtime components belong in the application's [architecture overview template](../examples/validation-lab/template/docs/architecture/overview.md), copied to the generated project's `docs/architecture/overview.md`. The application does not orchestrate agents. Passing its tests is one part of workflow validation, not proof that the process was followed.

### Components and responsibilities

| Component | Responsibility and connections | Where defined | Practical limit |
| --- | --- | --- | --- |
| Human owner/operator | Supplies goals and scope, resolves consequential choices, inspects evidence and makes acceptance decisions | Project `docs/agents/architecture.md` and run/decision records; [ownership guide](ARCHITECTURE-GUIDE.md#2-who-does-what) | An agent cannot substitute its own decision for missing human authorization |
| Skill procedures | Tell planners, coordinator, workers and reviewers how to perform their roles | [skills/](../skills/), especially [implement-spec](../skills/engineering/implement-spec/SKILL.md) and [architecture policy](../skills/engineering/_shared/ARCHITECTURE.md) | Written procedures must actually be followed; they are not a scheduler or enforced permissions |
| Project contracts and artifacts | Identify requirements, accepted decisions, role settings, tracker location, test commands and resources | Target application's `AGENTS.md`, `docs/agents/`, spec/design/ADRs | Templates contain proposals/placeholders until the project configures and reviews them |
| Coding-agent sessions | Planner proposes; coordinator controls the loop; workers implement scoped tickets; fresh reviewers judge identified targets | Configured harnesses such as Pi/Claude Code plus [role briefs](../agents/) | A harness/profile label does not prove actual model identity or independence |
| Paseo | Launches and exposes sessions, profiles and workspaces for the coordinator to use | Installed host tools/API and project delegation settings; [delegation policy](../skills/engineering/_shared/DELEGATION.md) | Does not define correct requirements, review verdicts or completion policy |
| Tracker | Stores authoritative tickets, dependencies, one coordinator's claims, run IDs, transitions and evidence links | Project tracker contract; the lab uses one absolute `.scratch/quote-demo` root | A derived graph export is not a second tracker; a record is not an atomic distributed lock |
| Git and worktrees | Give workers separate source checkouts, identify candidates and retain integrated history | Coordinator/worker procedures and Git revisions | Worktrees do not isolate shared runtime services or establish test success |
| Focused scripts and tests | Check selected structural conditions or execute application verification; record evidence for identified revisions | [frontier](../scripts/frontier.mjs), [design readiness](../scripts/design-check.mjs), [review target](../scripts/review-target.mjs), [lab verification](../examples/validation-lab/verify.mjs) and project tests | Each command has a narrow scope; none alone proves overall design quality or correct orchestration |

### How the components cooperate

Planning reads the project contracts and existing source, then produces requirements and an inspectable design. Fresh design sessions explain/challenge it. After the human resolves choices and accepts the current plan, the coordinator reads the tracker, checks readiness and asks Paseo to launch scoped workers in separate Git worktrees.

Workers return committed candidates and verification evidence. The coordinator arranges fresh code review, integrates accepted candidates one at a time, runs the required combined checks, and records resulting revisions. Those records can unblock more tickets. At completion the human inspects the result and evidence. A failure returns to a bounded repair or a recorded blocker; a material requirement/design change returns to planning.

For actual commands follow [MANUAL.md](MANUAL.md). For the design operations, artifact lifecycle and explicit handoff into execution, follow [ARCHITECTURE-GUIDE.md](ARCHITECTURE-GUIDE.md#operational-route-and-completion-checks). The [README documentation map](../README.md#documentation-map) is the entry point; historical notes describe earlier versions rather than the current procedure.

## Planning and execution

Use Wayfinder for unresolved decisions. It can batch and repeat **ready research**; it must stop for a human's grilling/prototype decisions. Once the route is clear, synthesize a spec, explain the proposed architecture with `design-solution`, and independently review it with `review-design`. Resolve human decisions, produce tickets, then check requirement coverage and current design/plan acceptance before dispatch. See [the architecture guide](ARCHITECTURE-GUIDE.md) and [shared policy](../skills/engineering/_shared/ARCHITECTURE.md). The `implement-spec` coordinator launches ready implementation tickets in separate worktrees, collects committed results, dispatches independent review and integrates serially. Dependencies unblock only after verified integration.

Setup supplies implementation-specific fields and closure rules in every tracker template. A local tracker has one canonical absolute state root shared by all worktrees. Remote issue closure remains separate from verified integration. Persist run IDs, branches, claims and evidence in the tracker after every transition. On resumption, inspect existing runs before launching replacements. A single coordinator avoids duplicate claims; a multi-coordinator deployment needs an actual lock/lease mechanism. This package supplies no distributed locking service.

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

Record host/Paseo/provider versions and outcomes. Missing tooling is unverified, not passed. The worked example is a self-contained quotation CLI. Applications that use shared services must supply and validate their own resource-isolation contract.
