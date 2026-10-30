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

Planning makes the route clear: resolve uncertainty, agree on behavior, explain the design and approve scoped work. Execution follows that route: implement eligible tickets, review committed candidates, integrate one at a time and verify the combined result. A planning ticket can finish with a decision and no production code. An implementation ticket reaches integrated status only after its code passes the required integration checks.

**Quick route:** clarify decisions → specify behavior → propose and review the design → produce and approve tickets → dispatch isolated workers → review committed candidates → integrate and verify → repeat → inspect the final result.

The following explanation connects the [architecture policy](../skills/engineering/_shared/ARCHITECTURE.md) and [implement-spec procedure](../skills/engineering/implement-spec/SKILL.md). For commands and prompts, use the [architecture operational route](ARCHITECTURE-GUIDE.md#operational-route-and-completion-checks) and [manual execution walkthrough](MANUAL.md#12-execute-the-graph-and-observe-it).

### Stages, owners and completion conditions

An owner here is the role responsible for the action or decision. The same person may fill several roles; fresh review sessions still remain separate from authorship.

| Stage | Inputs | Responsible role | Outputs | Completion condition |
| --- | --- | --- | --- | --- |
| Clarify | Need, existing source and open questions | Planner; human decides consequential choices | Answers, research and optional Wayfinder map | Required product choices are resolved; remaining unknowns are explicit |
| Specify | Agreed behavior and exclusions | Planner, with human scope ownership | Spec with stable requirement IDs | Behavior and observable acceptance are clear |
| Design and review | Spec and inspected project context | Planner drafts; fresh reviewers explain/challenge; human decides | Design proposal, review reports and decisions | Required reports exist and blocking findings are resolved |
| Plan and authorize | Reviewed design and requirements | Planner prepares tickets; human authorizes scope/plan | Tickets, dependencies and requirement coverage | Current design and exact plan have applicable acceptance |
| Check readiness | Accepted artifacts, tracker and project contracts | Coordinator | Readiness evidence and eligible work | Current inputs match acceptance; tests/resources and ownership are configured |
| Implement | Claimed ticket, spec, constraints and immutable base | Scoped worker launched by coordinator | Committed candidate and Verify change evidence | Required worker checks pass; exact revision is identified |
| Review and integrate | Frozen candidate, review findings and latest integration revision | Fresh code reviewers; coordinator integrates | Reviewed, verified integrated SHA and evidence | Required review/checks cover the resulting integrated code |
| Complete and deliver | All integrated tickets and original starting base | Coordinator prepares evidence; human inspects/accepts | Final verification, full-change review and delivery report/draft PR | Remaining gates are explicit; merge follows project authorization |

### 1. Planning: make the route clear

**Use Wayfinder for unresolved decisions.** It is useful when an effort contains too many connected questions to resolve in one conversation. It organizes those questions into a map and decision tickets. It produces decisions that make subsequent work possible; it does not automatically authorize implementation. Its map points to tickets containing the detailed answers.

For a quotation application, unresolved questions might include:

| Question | Work needed | Expected result |
| --- | --- | --- |
| Does the proposed catalog format preserve accented product names? | Research or a small experiment | Findings with evidence |
| Should quantities allow fractions? | Human decision through grilling | An agreed product rule |
| Which error presentation is understandable? | Prototype and human feedback | An agreed interaction |
| Where should catalog validation happen? | Design investigation | Proposed responsibility and rationale |

These questions illustrate discovery. The supplied quotation lab already defines its requirements; running the lab does not require reopening them.

**Batch and repeat ready research.** A research ticket is ready when its prerequisites are resolved and nobody already owns it. The agent can investigate independent questions concurrently, record findings, then check whether those findings make more research possible. Work depending on an undecided constraint must wait. The configured concurrency and resource limits still apply.

**Stop for a human's grilling/prototype decisions.** Research establishes facts. Grilling asks the human to choose between meaningful alternatives. A prototype gives the human something concrete to react to. An agent can discover that fractional quantities are technically possible; it cannot infer that the product owner therefore wants them. Pause for the unresolved decision that matters, while safely independent work can continue. Ordinary implementation choices within accepted constraints do not need a new confirmation.

Procedure: [Wayfinder](../skills/engineering/wayfinder/SKILL.md). Worked planning exercise: [architecture guide, section 6](ARCHITECTURE-GUIDE.md#6-worked-example-understand-the-quotation-tool).

### 2. Turn decisions into requirements and a design

Once the important questions are settled, produce two complementary artifacts:

| Artifact | Question answered | Quotation example |
| --- | --- | --- |
| Specification | What behavior must the application provide? | Accept a catalog, SKU and quantity; return the required result or error |
| Design | How will components provide that behavior, and why this arrangement? | A CLI coordinates a catalog reader and pricing function |

The spec owns requirements. The design references those requirements and explains responsibilities, interactions, failure paths and tradeoffs. Avoid competing copies of requirements.

`to-spec` synthesizes agreed behavior. `design-solution` prepares an inspectable proposal. For a new application, label the architecture as **intended**. For an existing application, distinguish the observed current system, proposed target and transition, citing inspected source/configuration/tests.

A small change can use a short design note. New boundaries, persistence, ownership or external contracts require more explanation. Choose the [smallest useful artifact set](ARCHITECTURE-GUIDE.md#3-choose-an-appropriate-amount-of-design); do not create the same document set for every change.

### 3. Review the design before substantial decomposition

`review-design` uses fresh sessions for two purposes:

| Review | What it checks |
| --- | --- |
| Comprehension | Can another session correctly explain the proposal, components and workflows? |
| Challenge | Are there missing requirements, weak assumptions, failure cases or better alternatives? |

Comprehension matters because a proposal can sound reasonable while remaining too ambiguous to implement. Challenge matters because a clear proposal can still contain a bad decision. Apply the configured [review independence policy](../skills/engineering/_shared/DELEGATION.md) and record actual models; a different harness name alone does not establish independence.

The planner addresses blocking findings and presents consequential choices to the human. A proposal and two report files do not by themselves establish acceptance: reports must represent actual reviews, and relevant human decisions must be resolved. Reuse applicable explicit authorization already given; do not invent consent or ask again merely because the session changed.

Operations and handoffs: [architecture guide](ARCHITECTURE-GUIDE.md#operational-route-and-completion-checks). Procedure: [review-design](../skills/engineering/review-design/SKILL.md).

### 4. Convert the reviewed proposal into implementation tickets

`to-tickets` breaks the work into scoped tasks and records dependencies. The quotation lab illustrates this with:

| Ticket | Scope | Dependency |
| --- | --- | --- |
| A | Pricing function | None |
| B | Catalog reader | None |
| C | CLI combining the components | A and B |

Before dispatch, check **requirement → responsible component → implementation ticket → verification**. For example, rejecting an invalid quantity needs an identified responsibility, implementation work and an observable check. A plausible ticket list can otherwise omit product behavior.

Ticket decomposition can expose a design problem. Material changes to responsibilities or assumptions require refreshing affected design review. Review the proposal before substantial decomposition, then check the resulting plan. The teaching fixture already supplies proposed tickets and a scope snapshot: inspect and reconcile them rather than generating duplicate tickets.

Procedure: [to-tickets](../skills/engineering/to-tickets/SKILL.md). Fixture source: [lab generator](../examples/validation-lab/create.mjs) and [ticket proposals](../examples/validation-lab/tickets/).

### 5. Check that the accepted plan is still current

Acceptance applies to particular artifacts. If the design changes after review, an old approval may no longer cover it. Before dispatch, the coordinator checks that:

- Required decisions are resolved.
- Reviewed design and approved ticket scope match the current files.
- Test commands and environment requirements are configured.
- Required review and acceptance records exist.

Where configured, `design-check.mjs` checks recorded file fingerprints and required fields. A fingerprint identifies particular file contents and helps detect changes after review. The helper cannot judge design quality, discover omitted inputs or authenticate consent. Participants and repository controls retain those responsibilities. Never refresh hashes automatically to bypass stale approval; even editorial changes to recorded inputs need a recorded refresh.

Repeat readiness checks after restart, before new dispatch and before accepting integration. See [planning gates and change policy](../skills/engineering/_shared/ARCHITECTURE.md) and the [design-check helper](../scripts/design-check.mjs).

### 6. Execution: run the coordinator loop

`implement-spec` instructs one coordinator session to repeat these actions:

| Step | Coordinator action | Result |
| --- | --- | --- |
| Select | Find eligible, unclaimed tickets | Work that can safely start |
| Claim | Record ownership before launch | Duplicate dispatch is avoided under single coordination |
| Dispatch | Ask Paseo to launch scoped workers in separate worktrees | Isolated implementation sessions |
| Collect | Obtain committed code and Verify change evidence | An identifiable candidate |
| Review | Launch independent Spec and Standards code review | Findings tied to that candidate |
| Integrate | Combine one accepted candidate with current integrated code | A new combined candidate when integration changes the revision |
| Verify and record | Check the combined result and record its SHA/evidence | Verified integration that can unblock dependents |

A **claim** records that a particular worker/run owns a ticket, so another dispatch skips it. It does not mean completion. A **candidate** is committed code proposed for integration; its SHA identifies the exact version tested and reviewed. For other terms, see the [manual vocabulary](MANUAL.md#2-vocabulary-you-will-use).

This is an agent-driven loop. Paseo provides sessions and workspaces; the coordinator applies requirements and procedures and updates the tracker. The [frontier helper](#normalized-frontier-input) calculates eligibility from exported state. It does not launch agents, claim tasks or run as a standalone durable scheduler.

Setup supplies execution fields and closure rules in every [tracker template](../skills/engineering/setup-matt-pocock-skills/). Use one active coordinator for an effort. Multiple coordinators require a real lock/lease mechanism; assigning an issue or writing a Markdown claim is not an atomic distributed lock. This package supplies no distributed locking service.

### 7. Implement in parallel; integrate one at a time

A and B can start together because neither depends on the other, subject to the worker cap and resources. Each gets its own branch/worktree, spec, scoped ticket, immutable starting commit, accepted constraints and test contract. Workers return committed candidates with verification evidence.

Separate worktrees prevent workers from editing the same checkout. They do not isolate databases, ports or shared services. Provision separate resources or use an exclusive lease. See [testing policy](../skills/engineering/_shared/TESTING.md).

Integration is serial because every accepted change alters the combined application:

1. A finishes and passes required review and checks.
2. The coordinator integrates A and verifies the result.
3. B finishes, but its starting point may predate A.
4. The coordinator combines B with the latest integration revision in a disposable candidate worktree.
5. That combined candidate receives required checks and fresh review before integration advances.

A clean reviewed candidate can fast-forward when its base is still the integration tip. Otherwise the new combined candidate must be evaluated. Resolve conflicts from requirements, never by blindly choosing one side. Two successful workers do not automatically prove a successful combined application. The source remains frozen during review; modifications invalidate approval of the previous candidate.

Operations: [manual execution](MANUAL.md#12-execute-the-graph-and-observe-it). Exact integration rules: [implement-spec](../skills/engineering/implement-spec/SKILL.md#coordinator-loop).

### 8. Unblock dependencies only after verified integration

C waits until A and B are available in the shared, verified integration revision.

| Event | Enough to unblock C? |
| --- | --- |
| Worker says implementation is finished | No |
| Worker commits its code | No |
| Worker checks pass | No |
| Candidate passes review | Not yet |
| Required dependencies are integrated and combined checks pass | Yes |

**Integrated** and **merged into the project's target branch** are different milestones. The coordinator can integrate A and B on the effort's integration branch and start C while the final PR awaits acceptance. A remote issue can remain open until that PR merges, according to the tracker contract. Closing an issue alone does not prove verified integration.

Record the resulting SHA and evidence before unblocking dependents. The [frontier input rules](#normalized-frontier-input) express this distinction; the coordinator still checks the records against Git and actual evidence.

### 9. Persist state so another session can resume

After every transition, record ticket status/dependencies, claims/run IDs, branches/revisions, verification/review evidence, failures, cancellations and blockers in the authoritative tracker.

After restart, inspect existing runs before launching replacements. The coordinator session ending does not prove that workers stopped. Reconcile a claimed ticket with its actual run, branch and evidence. Unknown ownership remains a blocker rather than a reason to launch a duplicate worker.

For a local tracker, pass the same **canonical absolute state-root path** to every worktree. Workers must not create independent tracker copies. Team sharing and retention also require explicit arrangements: the lab ignores `.scratch/`, so a source commit does not back up its tracker/evidence. Preserve that state separately. A future improvement is tracked in [Issue #3: storage, sharing and archival policy](https://github.com/netname/pi-adapted-mp-skills/issues/3); it does not change the current procedure.

Operations: [manual tracker setup](MANUAL.md#7-configure-each-software-project) and [restart exercise](MANUAL.md#14-negative-exercises-prove-failures-remain-failures).

### 10. Know when the loop pauses and finishes

Continue automatically while eligible work remains. Pause when a required human decision is missing, resources are unavailable, ownership is uncertain, or the configured repair budget is exhausted. Record failures and cancelled runs; do not turn an incomplete review into a pass. No unbounded repair loops.

A material requirement/design change returns affected work to planning; safely independent work can continue. Ordinary internal choices within accepted constraints do not reopen design.

When all tickets are integrated, run Verify candidate and review the full change from the original starting revision. Fixes require applicable re-verification and review. Reconcile the design/model with implemented behavior and prepare/update the draft PR and delivery evidence. Report remaining gates honestly. Finishing the implementation loop does not authorize merging the PR; follow project authorization and CI/branch protection.

Remove only this effort's clean, inactive worktrees after retaining commits and evidence. Preserve failed work for diagnosis. Release coordination and close tickets according to the configured lifecycle.

Operations: [final inspection](MANUAL.md#13-inspect-the-final-result), [acceptance decision](MANUAL.md#15-decide-whether-pr-1-is-ready) and [architecture completion policy](../skills/engineering/_shared/ARCHITECTURE.md#change-and-completion).

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
