# Current workflow

This document explains the process and why its gates exist. **New readers:** the [manual's beginner reference](MANUAL.md#1-what-you-are-building) explains the two repositories, application folders, `.scratch` effort directories, artifacts, skills and `.mjs` helpers together. Its [numbered stage map](MANUAL.md#why-each-stage-exists) is the shared stage vocabulary. For installation, commands and a runnable PR-validation exercise, use [MANUAL.md](MANUAL.md#validate-the-framework-for-the-first-time). For design operations, use [ARCHITECTURE-GUIDE.md](ARCHITECTURE-GUIDE.md).

Read by topic: [components](#components-and-responsibilities) · [planning and execution](#planning-and-execution) · [frontier input](#normalized-frontier-input) · [verification](#verification) · [live acceptance](#live-acceptance-checklist). Terms such as claim, base/head and candidate are defined in the [manual vocabulary](MANUAL.md#2-vocabulary-you-will-use).

The tracker is the authoritative record of tickets, dependency edges, claims and evidence links. Its persistence and backup depend on the configured tracker; the lab's ignored local files need separate preservation. The coordinator is one active agent session that reads that state and controls the loop. Paseo launches and supervises sessions and workspaces. Git and project scripts/CI provide source isolation and verification. These responsibilities are separate.

## Solution overview

This repository provides a reusable **development workflow** for taking a need or proposed change through discovery, agreed requirements, an inspectable design, scoped implementation, independent review and verified integration. Its goals are to make decisions understandable, run independent work safely in parallel, avoid reviewing code with its own implementation model family, and preserve enough coordination state to resume after a session ends. The human owns consequential choices and acceptance; agents prepare proposals, carry out authorized work and provide evidence.

Work begins by understanding the need and the project's context. In an existing project, the planner inspects relevant source, tests and documentation to distinguish current behavior from proposed changes. In a new project, there may be no application source yet: the planner establishes context and describes the intended solution. Neither route assumes that requirements or architecture are already settled.

**Project contracts** means the project's written operating instructions and agreed constraints. They are ordinary documents, not a special tool or automatic enforcement mechanism. In the target application, `AGENTS.md` points agents to the relevant instructions; `docs/agents/issue-tracker.md` defines the tracker and status/ownership rules; `delegation.md` defines role profiles, models and concurrency; `testing.md` defines verification commands and environment rules; and `architecture.md` defines design, review and acceptance requirements. These four files live under `docs/agents/` unless the project configures another location. `docs/agents/architecture.md` is **the design process contract**; the application's overall design is `docs/architecture/overview.md`. The [setup procedure](../skills/engineering/setup-matt-pocock-skills/SKILL.md) creates or adapts the contracts with the human. Requirements and design documents are related artifacts: the spec says what to build, the design explains how and why, and the operating instructions govern how work proceeds. See the [folder and artifact guide](MANUAL.md#where-the-projects-and-artifacts-live) and [project setup walkthrough](MANUAL.md#7-configure-each-software-project).

Discovery resolves the uncertainty that matters. [Research](../skills/engineering/research/SKILL.md) establishes facts from documentation, inspected source or other evidence. [Grilling](../skills/productivity/grilling/SKILL.md) asks focused questions to expose assumptions and obtain human decisions. A [prototype](../skills/engineering/prototype/SKILL.md) gives the human a small concrete artifact to evaluate. For a large effort with connected questions, [Wayfinder](../skills/engineering/wayfinder/SKILL.md) organizes research, grilling, prototypes and prerequisite tasks into a shared map of decision tickets. Smaller changes can use the relevant activities directly. They are selected as needed and may recur; they are not a mandatory checklist of skills for every change. A decision ticket resolves a question, rather than necessarily delivering production code.

As decisions become clear, the planner consolidates agreed behavior into a specification, explains the proposed architecture and obtains fresh comprehension/challenge review. The resulting implementation plan links requirements to components, tickets and verification. After applicable human acceptance and a check that the reviewed inputs are still current, the coordinator launches eligible implementation work. Workers return committed candidates; fresh code reviewers inspect them; the coordinator integrates one at a time and verifies the combined result before unblocking dependents. The [planning and execution section](#planning-and-execution) explains each handoff and completion condition.

The independent quotation CLI is the teaching application built with that workflow. Its goals and runtime components belong in the application's [architecture overview template](../examples/validation-lab/template/docs/architecture/overview.md), copied to the generated project's `docs/architecture/overview.md`. The application reads a local catalog and produces a quote; it does not orchestrate agents. The lab supplies proposed requirements, design and tickets so you can exercise the workflow without first inventing an application. Those supplied artifacts still need the prescribed inspection, review and acceptance. Passing application tests is one part of workflow validation, not proof that planning, review or orchestration occurred.

### Components and responsibilities

| Component | Responsibility and connections | Where defined | Practical limit |
| --- | --- | --- | --- |
| Human owner/operator | Supplies goals and scope, resolves consequential choices, inspects evidence and makes acceptance decisions | Project `docs/agents/architecture.md` and run/decision records; [ownership guide](ARCHITECTURE-GUIDE.md#2-who-does-what) | An agent cannot substitute its own decision for missing human authorization |
| Skill procedures | Tell planners, coordinator, workers and reviewers how to perform their roles | [skills/](../skills/), especially [implement-spec](../skills/engineering/implement-spec/SKILL.md) and [architecture policy](../skills/engineering/_shared/ARCHITECTURE.md) | Written procedures must actually be followed; they are not a scheduler or enforced permissions |
| Project contracts and artifacts | Identify requirements, accepted decisions, role settings, tracker location, test commands and resources | Target application's `AGENTS.md`, `docs/agents/`, spec/design/ADRs | Templates contain proposals/placeholders until the project configures and reviews them |
| Planner and research sessions | Investigate open questions, draft requirements/design and prepare the dependency plan; bring consequential choices to the human | [Wayfinder](../skills/engineering/wayfinder/SKILL.md), [design-solution](../skills/engineering/design-solution/SKILL.md) and project contracts | Research findings and proposed decisions are not human acceptance or implementation authorization |
| Coordinator | Checks accepted inputs, reads the tracker, claims eligible tickets, asks Paseo to launch workers/reviewers, collects evidence, integrates serially and reconciles runs after restart | [implement-spec](../skills/engineering/implement-spec/SKILL.md), project tracker/delegation/testing contracts | One active agent session, not a standalone durable scheduler; multiple coordinators require actual locking |
| Implementation workers | Implement scoped tickets in assigned worktrees and return committed candidates with Verify change evidence | [implement](../skills/engineering/implement/SKILL.md), assigned ticket and project test contract | Do not own integration, tracker transitions or recursive review dispatch; source isolation does not isolate runtime services |
| Fresh review sessions | Explain/challenge designs or review exact code candidates on the Spec and Standards axes; return findings for collection | [review-design](../skills/engineering/review-design/SKILL.md), [code-review](../skills/engineering/code-review/SKILL.md) and [role briefs](../agents/) | Cannot approve their own work; actual model families must satisfy independence rules. Code reviewers do not edit candidates or run tests |
| Paseo | Launches and exposes sessions, profiles and workspaces for the coordinator to use | Installed host tools/API and project delegation settings; [delegation policy](../skills/engineering/_shared/DELEGATION.md) | Does not define correct requirements, review verdicts or completion policy |
| Tracker | Stores authoritative tickets, dependencies, one coordinator's claims, run IDs, transitions and evidence links | Project tracker contract; the lab uses one absolute `.scratch/quote-demo` root | A derived graph export is not a second tracker; a record is not an atomic distributed lock |
| Git and worktrees | Give workers separate source checkouts, identify candidates and retain integrated history | Coordinator/worker procedures and Git revisions | Worktrees do not isolate shared runtime services or establish test success |
| Focused scripts and tests | Check selected structural conditions or execute application verification; record evidence for identified revisions | [frontier](../scripts/frontier.mjs), [design readiness](../scripts/design-check.mjs), [review target](../scripts/review-target.mjs), [lab verification](../examples/validation-lab/verify.mjs) and project tests | Each command has a narrow scope; none alone proves overall design quality or correct orchestration |

Roles are responsibilities, not separate installed products. A coordinator is itself a coding-agent session, usually run through a configured harness such as Pi or Claude Code. Paseo manages sessions; the coordinator decides the next workflow action. Profile names select settings, but actual launched provider/model identities must be checked. The human owns acceptance; the coordinator records and applies it.

### How the components cooperate

The human brings a need or proposed change. The planner reads the project instructions described above and inspects available source/documentation. Research, grilling and prototypes resolve missing facts and choices, with Wayfinder organizing them when the effort needs a decision map. Consequential choices remain with the human; safely independent research can continue while a decision waits.

The planner turns those answers into requirements and a design. Fresh design sessions explain and challenge it, findings are resolved, and the planner prepares scoped tickets and dependencies. The coordinator checks applicable human acceptance, current artifact identities, tracker ownership and test/resource readiness before asking Paseo to launch workers in separate Git worktrees. Planning and coordination are roles; a handoff preserves the agreed artifacts rather than relying on a previous conversation.

Workers return committed candidates and verification evidence. The coordinator arranges fresh code review, integrates accepted candidates one at a time, runs the required combined checks and records resulting revisions. Verified integration can unblock more tickets. At completion the coordinator reconciles the design with implemented behavior and presents the result and evidence for human acceptance. A failure returns to bounded repair or a recorded blocker; a material requirement/design change returns affected work to planning.

For actual commands follow [MANUAL.md](MANUAL.md). For the design operations, artifact lifecycle and explicit handoff into execution, follow [ARCHITECTURE-GUIDE.md](ARCHITECTURE-GUIDE.md#operational-route-and-completion-checks). The [README documentation map](../README.md#documentation-map) is the entry point; historical notes describe earlier versions rather than the current procedure.

## Planning and execution

Planning makes the route clear: resolve uncertainty, agree on behavior, explain the design and approve scoped work. Execution follows that route: implement eligible tickets, review committed candidates, integrate one at a time and verify the combined result. A planning ticket can finish with a decision and no production code. An implementation ticket reaches integrated status only after its code passes the required integration checks.

**Quick route:** 1 Discover and clarify → 2 Specify → 3 Design and review → 4 Plan and authorize → 5 Check readiness → 6 Implement → 7 Review and integrate → repeat 6–7 for ready tickets → 8 Verify complete change → 9 Evaluate and decide. These nine names are the shared lifecycle vocabulary in the [manual](MANUAL.md#why-each-stage-exists) and [architecture guide](ARCHITECTURE-GUIDE.md#operational-route-and-completion-checks). Host installation, package checkout, project configuration and opening validation reports are **preparation**, not extra lifecycle stages. A small change can reuse applicable stage artifacts rather than generate new copies; its gates still apply.

The following explanation connects the [architecture policy](../skills/engineering/_shared/ARCHITECTURE.md) and [implement-spec procedure](../skills/engineering/implement-spec/SKILL.md). For commands and prompts, use the [architecture operational route](ARCHITECTURE-GUIDE.md#operational-route-and-completion-checks) and [manual execution walkthrough](MANUAL.md#12-execute-the-graph-and-observe-it).

### Stages, owners and completion conditions

An owner here is the role responsible for the action or decision. The same person may fill several roles; fresh review sessions still remain separate from authorship. Paths below are **inside the generated lab** unless marked as package scripts; in another project, use its configured tracker and artifact locations. The [manual](MANUAL.md#what-to-call-a-folder-under-scratch) calls `.scratch/quote-demo/` an **effort directory**: a stable, ignored local tracker/evidence root shared by all worktrees via its original absolute path. A ticket is a scoped work item, not a GitHub issue by necessity: this lab uses Markdown ticket files in `issues/`; a team may configure an issue tracker instead. Creating a file is not proof that its review or approval happened.

| Lifecycle stage | Owner and main action | Named artifacts created or updated in the lab | Check / handoff |
| --- | --- | --- | --- |
| **1 Discover and clarify** | Planner uses `wayfinder`, research and grilling; human answers product questions | Optional `.scratch/quote-discovery/` decision map, research notes, decision tickets and recorded answers; the lab already supplies the agreed choices | Needed decisions are resolved; unresolved questions remain explicit |
| **2 Specify** | Planner uses `to-spec` to write agreed behavior | `docs/specs/quote.md` (R1–R4 in the supplied lab), examples and exclusions; optionally a glossary | Observable behavior is clear; the lab's reference spec is inspected, not regenerated |
| **3 Design and review** | Planner uses `design-solution`; fresh reviewers use `review-design` for comprehension and challenge | `docs/designs/quote.md`, `docs/architecture/overview.md`, applicable ADR/model, and real reports in `docs/designs/reviews/` | Reports identify reviewed inputs; blocking findings and consequential choices are resolved |
| **4 Plan and authorize** | Planner uses `to-tickets`; human accepts actual scope and design | Ticket A/B/C files in `.scratch/quote-demo/issues/`, `.scratch/quote-demo/graph.json`, `docs/designs/quote-plan.md`, `docs/designs/quote-traceability.md`, and human decision reference | Requirement → component → ticket → check coverage holds; lab tickets are supplied for inspection |
| **5 Check readiness** | Coordinator checks current accepted inputs, profiles, resources and tracker | `docs/designs/quote-readiness.json` with input fingerprints, review references and actual human acceptance; initial/approved baseline SHAs in the run record | `scripts/design-check.mjs check` passes and accepted artifacts are committed before dispatch |
| **6 Implement** | Coordinator uses `implement-spec` to claim/dispatch; workers implement A and B separately, then C when ready | Tracker claims/run IDs, separate Git worktrees/branches, source commits such as `src/pricing.mjs`, `src/catalog.mjs`, `src/cli.mjs`, and Verify change logs | Worker returns committed candidate SHA and required focused checks |
| **7 Review and integrate** | Fresh reviewers use `code-review`; coordinator combines one accepted candidate at a time | Spec/Standards review reports for immutable base/head, dispositions, combined test manifests, integrated SHA and tracker transitions in `.scratch/quote-demo/` | Combined revision passes required checks/review; then repeat 6–7 for newly ready tickets |
| **8 Verify complete change** | Coordinator checks final behavior and full diff; human inspects evidence | Final `all` test manifest/logs, full-change review from approved execution baseline, final integrated SHA, updated design/coverage if needed | Complete scope and source/reviews/checks agree; no unresolved blocking finding |
| **9 Evaluate and decide** | Human assesses the delivered change and, for this lab, the framework | `.scratch/quote-demo/validation-report.md` and `architecture-validation.md`, finding records and proposed PR action; real project may create a PR | Human decision is explicit; any merge/release follows repository authorization |

The [manual first-time route](MANUAL.md#validate-the-framework-for-the-first-time) also has ten **operational steps**; its first five prepare the experiment, and later rows point to the numbered lifecycle stages here. The [architecture guide route](ARCHITECTURE-GUIDE.md#operational-route-and-completion-checks) uses its own numbered instructions and labels the corresponding stages. Neither numbering is another name for the lifecycle.

### Stage 1. Discover and clarify: make the route clear

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

Procedure: [Wayfinder](../skills/engineering/wayfinder/SKILL.md). Optional hands-on discovery: [manual planning rehearsal](MANUAL.md#optional-planning-rehearsal). [Architecture guide §6](ARCHITECTURE-GUIDE.md#6-worked-example-understand-the-quotation-tool) begins at the **design** exercise after the supplied spec and tickets are created.

### Stages 2–3. Specify behavior and propose a design

Once the important questions are settled, produce two complementary artifacts:

| Artifact | Question answered | Quotation example |
| --- | --- | --- |
| Specification | What behavior must the application provide? | Accept a catalog, SKU and quantity; return the required result or error |
| Design | How will components provide that behavior, and why this arrangement? | A CLI coordinates a catalog reader and pricing function |

The spec owns requirements. The design references those requirements and explains responsibilities, interactions, failure paths and tradeoffs. Avoid competing copies of requirements.

`to-spec` synthesizes agreed behavior. `design-solution` prepares an inspectable proposal. For a new application, label the architecture as **intended**. For an existing application, distinguish the observed current system, proposed target and transition, citing inspected source/configuration/tests.

A small change can use a short design note. New boundaries, persistence, ownership or external contracts require more explanation. Choose the [required design work and artifacts](ARCHITECTURE-GUIDE.md#3-choose-an-appropriate-amount-of-design); do not create the same document set for every change.

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

`to-tickets` breaks the work into scoped tasks and records dependencies. The quotation lab illustrates this with:

| Ticket | Scope | Dependency |
| --- | --- | --- |
| A | Pricing function | None |
| B | Catalog reader | None |
| C | CLI combining the components | A and B |

Before dispatch, check **requirement → responsible component → implementation ticket → verification**. For example, rejecting an invalid quantity needs an identified responsibility, implementation work and an observable check. A plausible ticket list can otherwise omit product behavior.

Ticket decomposition can expose a design problem. Material changes to responsibilities or assumptions require refreshing affected design review. Review the proposal before substantial decomposition, then check the resulting plan. The teaching fixture already supplies proposed tickets and a scope snapshot: inspect and reconcile them rather than generating duplicate tickets.

Procedure: [to-tickets](../skills/engineering/to-tickets/SKILL.md). Fixture source: [lab generator](../examples/validation-lab/create.mjs) and [ticket proposals](../examples/validation-lab/tickets/).

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

A **claim** records that a particular worker/run owns a ticket, so another dispatch skips it. It does not mean completion. A **candidate** is committed code proposed for integration; its SHA identifies the exact version tested and reviewed. For other terms, see the [manual vocabulary](MANUAL.md#2-vocabulary-you-will-use).

This is an agent-driven loop. Paseo provides sessions and workspaces; the coordinator applies requirements and procedures and updates the tracker. The [frontier helper](#normalized-frontier-input) calculates eligibility from exported implementation state. Planning tickets instead become ready when their decision prerequisites are resolved; do not apply implementation integration states to Wayfinder decisions. It does not launch agents, claim tasks or run as a standalone durable scheduler.

Setup supplies execution fields and closure rules in every [tracker template](../skills/engineering/setup-matt-pocock-skills/). Use one active coordinator for an effort. Multiple coordinators require a real lock/lease mechanism; assigning an issue or writing a Markdown claim is not an atomic distributed lock. This package supplies no distributed locking service.

### Stages 6–7. Implement in parallel; review and integrate one at a time

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

### Stage 7. Unblock dependencies only after verified integration

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

### Stages 5–8. Persist state so another session can resume

After every transition, record ticket status/dependencies, claims/run IDs, branches/revisions, verification/review evidence, failures, cancellations and blockers in the authoritative tracker.

After restart, inspect existing runs before launching replacements. The coordinator session ending does not prove that workers stopped. Reconcile a claimed ticket with its actual run, branch and evidence. Unknown ownership remains a blocker rather than a reason to launch a duplicate worker.

For a local tracker, pass the same **canonical absolute state-root path** to every worktree. Workers must not create independent tracker copies. Team sharing and retention also require explicit arrangements: the lab ignores `.scratch/`, so a source commit does not back up its tracker/evidence. Preserve that state separately. A future improvement is tracked in [Issue #3: storage, sharing and archival policy](https://github.com/netname/pi-adapted-mp-skills/issues/3); it does not change the current procedure.

Operations: [manual tracker setup](MANUAL.md#7-configure-each-software-project) and [restart exercise](MANUAL.md#14-negative-exercises-prove-failures-remain-failures).

### Stages 8–9. Verify the complete change and decide what to do

Continue automatically while eligible work remains. Pause when a required human decision is missing, resources are unavailable, ownership is uncertain, or the configured repair budget is exhausted. Record failures and cancelled runs; do not turn an incomplete review into a pass. No unbounded repair loops.

A material requirement/design change returns affected work to planning; safely independent work can continue. Ordinary internal choices within accepted constraints do not reopen design.

When all tickets are integrated, run Verify candidate and review the full change from the original starting revision. Fixes require applicable re-verification and review. Reconcile the design/model with implemented behavior and prepare/update the draft PR and delivery evidence. Report remaining gates honestly. Finishing the implementation loop does not authorize merging the PR; follow project authorization and CI/branch protection.

Remove only this effort's clean, inactive worktrees after retaining commits and evidence. Preserve failed work for diagnosis. Release coordination and close tickets according to the configured lifecycle.

Operations: [final inspection](MANUAL.md#13-inspect-the-final-result), [acceptance decision](MANUAL.md#15-evaluate-the-framework-and-recommend-acceptance) and [architecture completion policy](../skills/engineering/_shared/ARCHITECTURE.md#change-and-completion).

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

This small helper example is a two-ticket chain. It is different from the quotation lab above, where A and B are initially independent and C depends on both.

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

## Live acceptance checklist

Offline tests do not prove a local Paseo installation or model/provider combination works. Before unattended use, run this small disposable-project trial:

1. Configure role profiles and enable Paseo tools (or CLI access). Launch one researcher and confirm actual model settings, primary-source retrieval and collected cited output.
2. Launch both review axes on a committed sample. Verify a different model family, fresh sessions, exact base/head and no candidate mutations. Simulate a failed reviewer and confirm the gate remains incomplete.
3. Give `implement-spec` two independent tickets and one dependent ticket. Confirm different worktrees/resources, concurrency cap, serial merges and delayed launch of the dependent ticket until integration verification.
4. Cause a test failure and a merge conflict. Confirm no ticket falsely closes, no shared environment is used concurrently, and retries stop at the configured limit.
5. Restart the coordinator. Confirm persisted run IDs are reconciled without duplicate workers. Confirm retained commits/evidence before cleanup.

Record host/Paseo/provider versions and outcomes. Missing tooling is unverified, not passed. The worked example is a self-contained quotation CLI. Applications that use shared services must supply and validate their own resource-isolation contract.
