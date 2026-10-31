# Current workflow

This document explains the **normal project workflow** and why its gates exist. Read the [manual](MANUAL.md#stages-and-artifacts) for stages, folders, tools, setup and day-to-day operations, and the [architecture guide](ARCHITECTURE-GUIDE.md) for design. The disposable experiment that evaluates this package lives only in [PR-VALIDATION.md](PR-VALIDATION.md).

Read by topic: [components](#components-and-responsibilities) · [planning and execution](#planning-and-execution) · [frontier input](#normalized-frontier-input) · [verification](#verification). Terms such as claim, base/head and candidate are defined in the [manual vocabulary](MANUAL.md#vocabulary).

The tracker is the authoritative record of tickets, dependency edges, claims and evidence links. Its persistence and backup depend on the configured tracker; ignored local files need separate preservation. The coordinator is one active agent session that reads that state and controls the loop. Paseo launches and supervises sessions and workspaces. Git and project scripts/CI provide source isolation and verification. These responsibilities are separate.

## Solution overview

This repository provides a reusable **development workflow** for taking a need or proposed change through discovery, agreed requirements, an inspectable design, scoped implementation, independent review and verified integration. Its goals are to make decisions understandable, run independent work safely in parallel, avoid reviewing code with its own implementation model family, and preserve enough coordination state to resume after a session ends. The human owns consequential choices and acceptance; agents prepare proposals, carry out authorized work and provide evidence.

Work begins by understanding the need and the project's context. In an existing project, the planner inspects relevant source, tests and documentation to distinguish current behavior from proposed changes. In a new project, there may be no application source yet: the planner establishes context and describes the intended solution. Neither route assumes that requirements or architecture are already settled.

**Project contracts** means the project's written operating instructions and agreed constraints. They are ordinary documents, not a special tool or automatic enforcement mechanism. In the target application, `AGENTS.md` points agents to the relevant instructions; `docs/agents/issue-tracker.md` defines the tracker and status/ownership rules; `delegation.md` defines role profiles, models and concurrency; `testing.md` defines verification commands and environment rules; and `architecture.md` defines design, review and acceptance requirements. These four files live under `docs/agents/` unless the project configures another location. `docs/agents/architecture.md` is **the design process contract**; the application's overall design is `docs/architecture/overview.md`. The [setup procedure](../skills/engineering/setup-matt-pocock-skills/SKILL.md) creates or adapts the contracts with the human. Requirements and design documents are related artifacts: the spec says what to build, the design explains how and why, and the operating instructions govern how work proceeds. See the [folder and artifact guide](MANUAL.md#project-folders-and-effort-directories) and [project setup walkthrough](MANUAL.md#configure-each-software-project).

Discovery resolves the uncertainty that matters. [Research](../skills/engineering/research/SKILL.md) establishes facts from documentation, inspected source or other evidence. [Grilling](../skills/productivity/grilling/SKILL.md) asks focused questions to expose assumptions and obtain human decisions. A [prototype](../skills/engineering/prototype/SKILL.md) gives the human a small concrete artifact to evaluate. For a large effort with connected questions, [Wayfinder](../skills/engineering/wayfinder/SKILL.md) organizes research, grilling, prototypes and prerequisite tasks into a shared map of decision tickets. Smaller changes can use the relevant activities directly. They are selected as needed and may recur; they are not a mandatory checklist of skills for every change. A decision ticket resolves a question, rather than necessarily delivering production code.

As decisions become clear, the planner consolidates agreed behavior into a specification, explains the proposed architecture and obtains fresh comprehension/challenge review. The resulting implementation plan links requirements to components, tickets and verification. After applicable human acceptance and a check that the reviewed inputs are still current, the coordinator launches eligible implementation work. Workers return committed candidates; fresh code reviewers inspect them; the coordinator integrates one at a time and verifies the combined result before unblocking dependents. The [planning and execution section](#planning-and-execution) explains each handoff and completion condition.

### Components and responsibilities

| Component | Responsibility and connections | Where defined | Practical limit |
| --- | --- | --- | --- |
| Human owner/operator | Supplies goals and scope, resolves consequential choices, inspects evidence and makes acceptance decisions | Project `docs/agents/architecture.md` and run/decision records; [ownership guide](ARCHITECTURE-GUIDE.md#owners-and-decisions) | An agent cannot substitute its own decision for missing human authorization |
| Skill procedures | Tell planners, coordinator, workers and reviewers how to perform their roles | [skills/](../skills/), especially [implement-spec](../skills/engineering/implement-spec/SKILL.md) and [architecture policy](../skills/engineering/_shared/ARCHITECTURE.md) | Written procedures must actually be followed; they are not a scheduler or enforced permissions |
| Project contracts and artifacts | Identify requirements, accepted decisions, role settings, tracker location, test commands and resources | Target application's `AGENTS.md`, `docs/agents/`, spec/design/ADRs | Templates contain proposals/placeholders until the project configures and reviews them |
| Planner and research sessions | Investigate open questions, draft requirements/design and prepare the dependency plan; bring consequential choices to the human | [Wayfinder](../skills/engineering/wayfinder/SKILL.md), [design-solution](../skills/engineering/design-solution/SKILL.md) and project contracts | Research findings and proposed decisions are not human acceptance or implementation authorization |
| Coordinator | Checks accepted inputs, reads the tracker, claims eligible tickets, asks Paseo to launch workers/reviewers, collects evidence, integrates serially and reconciles runs after restart | [implement-spec](../skills/engineering/implement-spec/SKILL.md), project tracker/delegation/testing contracts | One active agent session, not a standalone durable scheduler; multiple coordinators require actual locking |
| Implementation workers | Implement scoped tickets in assigned worktrees and return committed candidates with Verify change evidence | [implement](../skills/engineering/implement/SKILL.md), assigned ticket and project test contract | Do not own integration, tracker transitions or recursive review dispatch; source isolation does not isolate runtime services |
| Fresh review sessions | Explain/challenge designs or review exact code candidates on the Spec and Standards axes; return findings for collection | [review-design](../skills/engineering/review-design/SKILL.md), [code-review](../skills/engineering/code-review/SKILL.md) and [role briefs](../agents/) | Cannot approve their own work; actual model families must satisfy independence rules. Code reviewers do not edit candidates or run tests |
| Paseo | Launches and exposes sessions, profiles and workspaces for the coordinator to use | Installed host tools/API and project delegation settings; [delegation policy](../skills/engineering/_shared/DELEGATION.md) | Does not define correct requirements, review verdicts or completion policy |
| Tracker | Stores authoritative tickets, dependencies, one coordinator's claims, run IDs, transitions and evidence links | Project tracker contract; a local tracker can use one canonical absolute `.scratch/<effort-slug>/` root | A derived graph export is not a second tracker; a record is not an atomic distributed lock |
| Git and worktrees | Give workers separate source checkouts, identify candidates and retain integrated history | Coordinator/worker procedures and Git revisions | Worktrees do not isolate shared runtime services or establish test success |
| Focused scripts and tests | Check selected structural conditions or execute application verification; record evidence for identified revisions | [frontier](../scripts/frontier.mjs), [design readiness](../scripts/design-check.mjs), [review target](../scripts/review-target.mjs), project test commands | Each command has a narrow scope; none alone proves overall design quality or correct orchestration |

Roles are responsibilities, not separate installed products. A coordinator is itself a coding-agent session, usually run through a configured harness such as Pi or Claude Code. Paseo manages sessions; the coordinator decides the next workflow action. Profile names select settings, but actual launched provider/model identities must be checked. The human owns acceptance; the coordinator records and applies it.

### How the components cooperate

The human brings a need or proposed change. The planner reads the project instructions described above and inspects available source/documentation. Research, grilling and prototypes resolve missing facts and choices, with Wayfinder organizing them when the effort needs a decision map. Consequential choices remain with the human; safely independent research can continue while a decision waits.

The planner turns those answers into requirements and a design. Fresh design sessions explain and challenge it, findings are resolved, and the planner prepares scoped tickets and dependencies. The coordinator checks applicable human acceptance, current artifact identities, tracker ownership and test/resource readiness before asking Paseo to launch workers in separate Git worktrees. Planning and coordination are roles; a handoff preserves the agreed artifacts rather than relying on a previous conversation.

Workers return committed candidates and verification evidence. The coordinator arranges fresh code review, integrates accepted candidates one at a time, runs the required combined checks and records resulting revisions. Verified integration can unblock more tickets. At completion the coordinator reconciles the design with implemented behavior and presents the result and evidence for human acceptance. A failure returns to bounded repair or a recorded blocker; a material requirement/design change returns affected work to planning.

For setup and operations follow [MANUAL.md](MANUAL.md). For design review and acceptance follow [ARCHITECTURE-GUIDE.md](ARCHITECTURE-GUIDE.md#operational-route-and-completion-checks). The [README documentation map](../README.md#documentation-map) is the entry point.

## Planning and execution

Planning makes the route clear: resolve uncertainty, agree on behavior, explain the design and approve scoped work. Execution follows that route: implement eligible tickets, review committed candidates, integrate one at a time and verify the combined result. A planning ticket can finish with a decision and no production code. An implementation ticket reaches integrated status only after its code passes the required integration checks.

**Quick route:** 1 Discover and clarify → 2 Specify → 3 Design and review → 4 Plan and authorize → 5 Check readiness → 6 Implement → 7 Review and integrate → repeat 6–7 for ready tickets → 8 Verify complete change → 9 Evaluate and decide. These nine names are shared with the [manual](MANUAL.md#stages-and-artifacts) and [architecture guide](ARCHITECTURE-GUIDE.md#operational-route-and-completion-checks). Host installation and project configuration are **preparation**, not extra lifecycle stages. A small change can reuse applicable stage artifacts rather than generate new copies; its gates still apply.

The following explanation connects the [architecture policy](../skills/engineering/_shared/ARCHITECTURE.md) and [implement-spec procedure](../skills/engineering/implement-spec/SKILL.md). For actions, use the [architecture operational route](ARCHITECTURE-GUIDE.md#operational-route-and-completion-checks) and [manual lifecycle](MANUAL.md#use-the-skills-across-the-software-engineering-cycle).

### Stages, owners and completion conditions

An owner is responsible for an action or decision. Paths are conventions in the **target project**, not in this skills package. Use its configured tracker and existing directories. Creating a document alone is not evidence that a review or approval happened.

| Lifecycle stage | Owner / action | Typical artifact or evidence | Completion condition |
| --- | --- | --- | --- |
| **1 Discover and clarify** | Planner investigates; human decides product questions | Optional decision map/tickets, cited research, recorded choices | Necessary choices resolved or explicitly pending |
| **2 Specify** | Planner uses `to-spec` | Agreed spec with IDs, examples and exclusions | Observable acceptance clear |
| **3 Design and review** | Planner drafts; fresh independent reviewers explain/challenge | Overview, feature design, optional ADR/model and real reports | Review target identified and blockers resolved |
| **4 Plan and authorize** | Planner decomposes; human accepts applicable scope | Implementation tickets, dependency edges and requirement coverage | Every requirement maps to work and a check |
| **5 Check readiness** | Coordinator checks files, models, resources and acceptance | Readiness record and approved committed baseline | Current files match reviewed/accepted inputs |
| **6 Implement** | Coordinator dispatches scoped workers | Claims/run IDs, isolated worktrees, committed code and focused tests | Clean exact worker candidate with required checks |
| **7 Review and integrate** | Fresh code reviewers report; coordinator combines serially | Spec/Standards findings, combined checks and integrated SHA | Verified integrated revision; repeat for newly ready tickets |
| **8 Verify complete change** | Coordinator checks complete change; human inspects | Final checks, full-change review, reconciled design | Agreed scope and evidence align |
| **9 Evaluate and decide** | Human accepts delivery under project policy | Delivery/PR decision, outstanding risks and follow-ups | Merge/release remains subject to repository authorization |

### Stage 1. Discover and clarify: make the route clear

**Use Wayfinder for unresolved decisions.** It is useful when an effort contains too many connected questions to resolve in one conversation. It organizes those questions into a map and decision tickets. It produces decisions that make subsequent work possible; it does not automatically authorize implementation. Its map points to tickets containing the detailed answers.

For example, a proposed file import may need research about format limits, a human decision about invalid rows, a prototype of the error display and investigation into which component owns validation. A Wayfinder map holds the destination and links child decision tickets. [Local tracker layout](MANUAL.md#project-folders-and-effort-directories).

**Batch and repeat ready research.** A research ticket is ready when its prerequisites are resolved and nobody already owns it. The agent can investigate independent questions concurrently, record findings, then check whether those findings make more research possible. Work depending on an undecided constraint must wait. The configured concurrency and resource limits still apply.

**Stop for a human's grilling/prototype decisions.** Research establishes facts. Grilling asks the human to choose between meaningful alternatives. A prototype gives the human something concrete to react to. An agent can discover that fractional quantities are technically possible; it cannot infer that the product owner therefore wants them. Pause for the unresolved decision that matters, while safely independent work can continue. Ordinary implementation choices within accepted constraints do not need a new confirmation.

Procedure: [Wayfinder](../skills/engineering/wayfinder/SKILL.md). Use the [manual's stages](MANUAL.md#stages-and-artifacts) for the project route.

### Stages 2–3. Specify behavior and propose a design

Once the important questions are settled, produce two complementary artifacts:

| Artifact | Question answered | Example |
| --- | --- | --- |
| Specification | What behavior must the application provide? | Specify allowed file-import rows and expected error behavior |
| Design | How will components provide that behavior, and why this arrangement? | A parser validates input before an importer stores accepted rows |

The spec owns requirements. The design references those requirements and explains responsibilities, interactions, failure paths and tradeoffs. Avoid competing copies of requirements.

`to-spec` synthesizes agreed behavior. `design-solution` prepares an inspectable proposal. For a new application, label the architecture as **intended**. For an existing application, distinguish the observed current system, proposed target and transition, citing inspected source/configuration/tests.

A small change can use a short design note. New boundaries, persistence, ownership or external contracts require more explanation. Choose the [required design work and artifacts](ARCHITECTURE-GUIDE.md#choose-the-amount-of-design); do not create the same document set for every change.

### Stage 3. Design and review before substantial decomposition

`review-design` uses fresh sessions for two purposes:

| Review | What it checks |
| --- | --- |
| Comprehension | Can another session correctly explain the proposal, components and workflows? |
| Challenge | Are there missing requirements, weak assumptions, failure cases or better alternatives? |

Comprehension matters because a proposal can sound reasonable while remaining too ambiguous to implement. Challenge matters because a clear proposal can still contain a bad decision. Each design reviewer must use a model family different from every design author, in a fresh session. Record actual models; a different harness name alone does not establish independence. See [review-design](../skills/engineering/review-design/SKILL.md) and the [delegation policy](../skills/engineering/_shared/DELEGATION.md).

The planner addresses blocking findings and presents consequential choices to the human. A proposal and two report files do not by themselves establish acceptance: reports must represent actual reviews, and relevant human decisions must be resolved. Reuse applicable explicit authorization already given; do not invent consent or ask again merely because the session changed.

Operations and handoffs: [architecture guide](ARCHITECTURE-GUIDE.md#operational-route-and-completion-checks). Procedure: [review-design](../skills/engineering/review-design/SKILL.md).

### Stage 4. Plan and authorize implementation tickets

`to-tickets` breaks work into scoped tasks and records real dependencies. For a file import, independent tickets could implement parsing and error presentation; a command that combines both waits until the required components are verified and integrated. These are illustrative: choose the actual project's boundaries and acceptance criteria.

Before dispatch, check **requirement → responsible component → implementation ticket → verification**. For example, rejecting an invalid row needs an identified responsibility, implementation work and an observable check. A plausible ticket list can otherwise omit product behavior.

Ticket decomposition can expose a design problem. Material changes to responsibilities or assumptions require refreshing affected design review. Review the proposal before substantial decomposition, then check the resulting plan. A project may reuse an approved ticket breakdown if its scope remains current.

Procedure: [to-tickets](../skills/engineering/to-tickets/SKILL.md).

### Stage 5. Check readiness against the accepted plan

Acceptance applies to particular artifacts. If the design changes after review, an old approval may no longer cover it. Before dispatch, the coordinator checks that:

- Required decisions are resolved.
- Reviewed design and approved ticket scope match the current files.
- Test commands and environment requirements are configured.
- Required review and acceptance records exist.

Where configured, `design-check.mjs` checks recorded file fingerprints and required fields. A fingerprint identifies particular file contents and helps detect changes after review. The helper cannot judge design quality, discover omitted inputs or authenticate consent. Participants and repository controls retain those responsibilities. Never refresh hashes automatically to bypass stale approval; even editorial changes to recorded inputs need a recorded refresh.

Repeat readiness checks after restart, before new dispatch and before accepting integration. See [planning gates and change policy](../skills/engineering/_shared/ARCHITECTURE.md) and the [design-check helper](../scripts/design-check.mjs).

### Stages 6–7. Run the implementation and integration loop

Before the first worker starts, the coordinator records the agreed starting base SHA, integration branch, worker cap and bounded retry budget. It creates a dedicated integration worktree from that base and establishes exclusive coordination for the effort. The base is the reference for final full-change review; each later worker starts from the current verified integration SHA. Existing user checkouts must not be reset to prepare these workspaces.

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

A **claim** records that a particular worker/run owns a ticket, so another dispatch skips it. It does not mean completion. A **candidate** is committed code proposed for integration; its SHA identifies the exact version tested and reviewed. For other terms, see the [manual vocabulary](MANUAL.md#vocabulary).

This is an agent-driven loop. Paseo provides sessions and workspaces; the coordinator applies requirements and procedures and updates the tracker. The [frontier helper](#normalized-frontier-input) calculates eligibility from exported implementation state. Planning tickets instead become ready when their decision prerequisites are resolved; do not apply implementation integration states to Wayfinder decisions. It does not launch agents, claim tasks or run as a standalone durable scheduler.

Setup supplies execution fields and closure rules in every [tracker template](../skills/engineering/setup-matt-pocock-skills/). Use one active coordinator for an effort. Multiple coordinators require a real lock/lease mechanism; assigning an issue or writing a Markdown claim is not an atomic distributed lock. This package supplies no distributed locking service.

### Stages 6–7. Implement in parallel; review and integrate one at a time

Two independent tickets can start together, subject to worker cap and resources. Each gets its own branch/worktree, spec, scoped ticket, immutable starting commit, accepted constraints and test contract. Workers return committed candidates with verification evidence.

Separate worktrees prevent workers from editing the same checkout. They do not isolate databases, ports or shared services. Provision separate resources or use an exclusive lease. See [testing policy](../skills/engineering/_shared/TESTING.md).

Integration is serial because every accepted change alters the combined application:

1. The first worker finishes and passes required review and checks.
2. The coordinator integrates that candidate and verifies the result.
3. The other worker finishes, but its starting point may predate the new integration tip.
4. The coordinator combines it with the latest integration revision in a disposable candidate worktree.
5. That combined candidate receives required checks and fresh review before integration advances.

A clean reviewed candidate can fast-forward when its base is still the integration tip. Otherwise the new combined candidate must be evaluated. Resolve conflicts from requirements, never by blindly choosing one side. Two successful workers do not automatically prove a successful combined application. The source remains frozen during review; modifications invalidate approval of the previous candidate.

Operations: [manual lifecycle](MANUAL.md#use-the-skills-across-the-software-engineering-cycle). Exact integration rules: [implement-spec](../skills/engineering/implement-spec/SKILL.md#coordinator-loop).

### Stage 7. Unblock dependencies only after verified integration

A dependent ticket waits until all of its prerequisites are available in the shared, verified integration revision.

| Event | Enough to unblock a dependent ticket? |
| --- | --- |
| Worker says implementation is finished | No |
| Worker commits its code | No |
| Worker checks pass | No |
| Candidate passes review | Not yet |
| Required dependencies are integrated and combined checks pass | Yes |

**Integrated** and **merged into the project's target branch** are different milestones. The coordinator can integrate prerequisites on the effort's integration branch and start a dependent ticket while a delivery PR awaits acceptance. A remote issue can remain open until that PR merges, according to the tracker contract. Closing an issue alone does not prove verified integration.

Record the resulting SHA and evidence before unblocking dependents. The [frontier input rules](#normalized-frontier-input) express this distinction; the coordinator still checks the records against Git and actual evidence.

### Stages 5–8. Persist state so another session can resume

After every transition, record ticket status/dependencies, claims/run IDs, branches/revisions, verification/review evidence, failures, cancellations and blockers in the authoritative tracker.

After restart, inspect existing runs before launching replacements. The coordinator session ending does not prove that workers stopped. Reconcile a claimed ticket with its actual run, branch and evidence. Unknown ownership remains a blocker rather than a reason to launch a duplicate worker.

For a local tracker, pass the same **canonical absolute state-root path** to every worktree. Workers must not create independent tracker copies. Team sharing and retention also require explicit arrangements: a project may ignore `.scratch/`, so a source commit does not back up its tracker/evidence. Preserve that state separately. A future improvement is tracked in [Issue #3: storage, sharing and archival policy](https://github.com/netname/pi-adapted-mp-skills/issues/3); it does not change the current procedure.

Operations: [project setup](MANUAL.md#configure-each-software-project) and [coordinator policy](../skills/engineering/implement-spec/SKILL.md).

### Stages 8–9. Verify the complete change and decide what to do

Continue automatically while eligible work remains. Pause when a required human decision is missing, resources are unavailable, ownership is uncertain, or the configured repair budget is exhausted. Record failures and cancelled runs; do not turn an incomplete review into a pass. No unbounded repair loops.

A material requirement/design change returns affected work to planning; safely independent work can continue. Ordinary internal choices within accepted constraints do not reopen design.

When all tickets are integrated, run Verify candidate and review the full change from the original starting revision. Fixes require applicable re-verification and review. Reconcile the design/model with implemented behavior and prepare/update the draft PR and delivery evidence. Report remaining gates honestly. Finishing the implementation loop does not authorize merging the PR; follow project authorization and CI/branch protection.

Remove only this effort's clean, inactive worktrees after retaining commits and evidence. Preserve failed work for diagnosis. Release coordination and close tickets according to the configured lifecycle.

Operations: [manual lifecycle](MANUAL.md#use-the-skills-across-the-software-engineering-cycle) and [architecture completion policy](../skills/engineering/_shared/ARCHITECTURE.md#change-and-completion).

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

This example is a two-ticket chain; substitute your project's actual graph.

`node scripts/frontier.mjs graph.json` returns `["A"]`. Allowed states are `ready`, `running`, `review`, `blocked`, `integrated`. A nonempty `claim` prevents dispatch. Integrated tickets require `verified: true` and an `integratedSha`. The helper validates consistency of that representation; the coordinator must verify the SHA/evidence against Git/CI before exporting it. It detects missing blockers and cycles, but does not claim tasks or invoke Paseo.

## Verification

Read [testing policy](../skills/engineering/_shared/TESTING.md). Unit/component/integration/E2E describe test boundaries; Fast/Verify change/Verify candidate describe when and how much to run. Configure exact project commands and required environment resources once, then inherit them in tickets. Worktrees do not isolate databases, ports or workers: provision isolated resources or serialize tests through an exclusive lease.

These profiles describe when verification runs, rather than naming a fixed test suite:

| Profile | When it runs | Revision/evidence expectations |
| --- | --- | --- |
| Fast | During each meaningful implementation cycle | Focused feedback; dirty work is allowed during development |
| Verify change | Before a worker reports a candidate | Relevant project checks on a clean committed candidate; record exact revision, commands, environment and outcomes |
| Verify candidate | After integration and before delivery | Required combined regression/integration/E2E checks on the clean committed result |

Verify change and Verify candidate must check source cleanliness and HEAD before and after execution. Source changes invalidate evidence for the previous revision. A timeout, skipped required check or unavailable environment remains blocked/unverified. Workers run their configured implementation checks; the coordinator runs or collects required verification evidence and owns integration verification. Code reviewers inspect supplied evidence and source; they do not run tests.

Code review has two axes: **Spec** checks required behavior and **Standards** checks project conventions and accepted design constraints. Both must pass for the exact target. A failed, cancelled or missing reviewer output remains incomplete, even when all application tests pass.

Read [delegation policy](../skills/engineering/_shared/DELEGATION.md). For code review, each reviewer's model family must differ from every implementation family that contributed to its target; both axes may use the same review family in separate fresh sessions. Design review instead separates reviewers from design authors. A different harness using the same model family does not satisfy independent review. Check the actual launched provider/model. If that cannot be verified, do not report the review gate as passed. Read-only prompts are not permission enforcement.

Review snapshots are outside the source tree and must be retained in the evidence store before cleanup. Keep the source worktree frozen while reviews run. A modified candidate invalidates its approval. CI/branch protection remains authoritative for merges; this package does not install application-specific CI.
