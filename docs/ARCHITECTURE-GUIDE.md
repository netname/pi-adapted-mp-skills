# Design and architecture in a software project

This guide explains **Stages 3–5** of the [shared development lifecycle](MANUAL.md#stages-and-artifacts). Use the [manual](MANUAL.md#project-folders-and-effort-directories) for project paths, terminology and setup, and [WORKFLOW.md](WORKFLOW.md#planning-and-execution) for the full planning and implementation loop. The separate [PR validation guide](PR-VALIDATION.md#3-review-the-quotation-design) contains the disposable quotation exercise.

## Purpose and boundaries

A **spec** says what users need and how to recognize correct behavior. An **architecture overview** places the change among the application's components, data and boundaries. A **feature design** explains how the change will satisfy the spec and why this approach was selected. An **ADR** preserves a consequential choice, alternatives and consequences. A **model or diagram** helps inspect relationships or scenarios. Review and actual human acceptance must target specific, current artifacts; a diagram alone does not establish correctness.

For an existing application, inspect the source, tests and configuration at a named revision. Separate **observed current behavior**, **proposed target** and **transition**. Mark inferences and unknowns. In a new application, say the components are *intended*, because source may not exist yet. Reuse accepted documentation where it applies; do not create a diagram or ADR just to fill a directory.

The order is: agree on behavior (Stage 2) → explain a proposed design (3) → have fresh reviewers independently explain and challenge it (3) → resolve findings → make a ticket plan and verify requirement coverage (4) → obtain applicable human acceptance and check that the reviewed inputs are still current (5). During implementation, material deviations return for a decision; at completion, compare the overview and design with the integrated source. [Architecture policy](../skills/engineering/_shared/ARCHITECTURE.md).

## Owners and decisions

| Owner | Responsibility and limit | Durable result |
| --- | --- | --- |
| Human product owner | Supplies scope, settles consequential tradeoffs and accepts/rejects the current proposal. A session cannot make this decision for them | Actual decision reference linked to the accepted inputs |
| Maintainer | Configures project operating contracts, paths, profiles and checks | `AGENTS.md` and `docs/agents/{architecture,delegation,testing,issue-tracker}.md` |
| Planner / design author | Inspects context, drafts spec/design/overview, maps requirements to checks, revises proposal | Design and coverage artifacts with source/author provenance |
| Fresh comprehension reviewer | Reconstructs components, scenarios and requirement links without the drafting conversation | Separate report targeting identified inputs |
| Fresh challenge reviewer | Looks for omissions, weak assumptions, alternative designs and failure paths | Separate report and blocker recommendations |
| Coordinator | Preserves findings and actual decision, checks readiness against current files, dispatches only authorized work | Review and readiness references, run IDs and evidence links |
| Implementation worker | Builds within accepted scope and surfaces material deviations | Candidate commit and check evidence; no design acceptance authority |

Design reviewers use fresh sessions with a model family different from **every design author**. Code review later uses fresh Spec and Standards sessions from a family different from **every implementation contributor** to their target. A Paseo profile chooses launch settings; it does not enforce reviewer independence or create a human decision. Record actual launched provider/model, run ID and target. [Delegation policy](../skills/engineering/_shared/DELEGATION.md).

## Artifacts and relationships

Paths below are conventions **inside the target application**, unless its configured tracker uses different locations. Read the project-specific `AGENTS.md` and `docs/agents/architecture.md` first. `docs/agents/architecture.md` is a **process contract**, while `docs/architecture/overview.md` describes the **application**. There is no required `docs/architecture.md` file. For the broader folder map, decision map and effort directory naming, use [the manual](MANUAL.md#project-folders-and-effort-directories).

| Artifact | Why it exists | Typical location / responsible role |
| --- | --- | --- |
| Agreed spec | Single authority for behavior, requirement IDs and exclusions | `docs/specs/<feature>.md` or configured tracker; planner with human decisions |
| System overview and optional model | Locate actors, components, boundaries and success/failure paths | `docs/architecture/overview.md`, optional `model/`; planner |
| Feature design | Explain proposed responsibilities, alternatives, consequences and checks | `docs/designs/<feature>.md`; planner |
| ADR | Explain one significant decision, alternatives and consequences | `docs/adr/<decision>.md`; planner records accepted choice |
| Review reports | Preserve separate comprehension/challenge findings and the input versions inspected | `docs/designs/reviews/` or configured evidence store; reviewers report, coordinator persists |
| Implementation tickets and dependencies | Allocate independently buildable work with explicit blockers | Configured issue tracker, perhaps `.scratch/<effort-slug>/issues/`; planner/coordinator |
| Plan snapshot and coverage | Link requirement → component → ticket → observable check; preserve agreed scope | `docs/designs/<feature>-plan.md`, `-traceability.md` when warranted |
| Readiness record | Bind actual reviews and human acceptance to current inputs | `docs/designs/<feature>-readiness.json` when using supplied helper; coordinator |

A Wayfinder **decision ticket** answers a question before implementation; an **implementation ticket** produces scoped code. The Wayfinder map indexes decisions; an architecture model depicts software components. Neither substitutes for a spec. Local ignored `.scratch` state needs separate sharing/retention; the committed design documents remain versioned. See [local tracker convention](../skills/engineering/setup-matt-pocock-skills/issue-tracker-local.md).

## Choose the amount of design

| Change | Required design work | Optional addition when useful |
| --- | --- | --- |
| Small change within accepted boundaries | Link the existing requirement/decision and test, write a short change note and identify the ticket | Diagram/ADR only if existing material cannot explain the change |
| New application or feature | Explain intended actors/components, interfaces, normal/error paths, choices and verification | LikeC4 model when several views must share component identities |
| Existing application's new feature | Describe inspected current state at a named commit, proposed change and affected seams | Transition/compatibility/migration plan for a changing contract |
| Cross-cutting boundary or data change | Describe all affected owners/contracts, significant decisions and checks | Deployment/resource model and rollback plan when relevant |

A lightweight note may include a small coverage table and link existing decisions. The amount of prose varies; applicable review and human acceptance still apply. Do not treat a missing contract as permission to bypass a gate. [Design template](../skills/engineering/_shared/design.template.md).

## Operational route and completion checks

This table gives the **normal project route**, not the PR experiment's numbered steps. Use the linked skills for the agent procedures and [manual setup](MANUAL.md#configure-each-software-project) for host/project preparation. Existing documents can be reused when the scope and input identity still match.

| Stage | Action / owner | Output and completion check |
| --- | --- | --- |
| **2 Specify** | Planner runs `to-spec`, human decides product behavior | One authoritative spec with stable IDs, exclusions, observable acceptance; no hidden product choice |
| **3 Design and review** | Planner runs `design-solution`; fresh sessions run `review-design` comprehension and challenge | Proposal/overview with clear responsibilities and alternatives; reports on identified inputs; blockers resolved |
| **4 Plan and authorize** | Planner runs `to-tickets`; human accepts applicable design and ticket scope | Tickets/dependencies and requirement → component → ticket → check coverage; refresh affected review if design changed |
| **5 Check readiness** | Coordinator captures input identity, preserves real human decision/reviews and checks project contracts | Readiness evidence matches current files and scope; required models/resources/tests configured; approved committed baseline before dispatch |
| **6–8 Implement through verification** | Coordinator uses `implement-spec`, checks changes and reconciles docs with final source | Verified integrated SHA, actual code reviews and final design reconciliation; material changes return to the affected stage |

For a project using the supplied structural helper, run it **from the skills checkout by absolute path**, with the target repository and its chosen relative files:

```bash
node /ABSOLUTE/SKILLS/scripts/design-check.mjs snapshot \
  /ABSOLUTE/PROJECT docs/specs/feature.md docs/designs/feature.md
node /ABSOLUTE/SKILLS/scripts/design-check.mjs check \
  /ABSOLUTE/PROJECT docs/designs/feature-readiness.json
```

These are illustrative paths: create a real record with the selected inputs, both real review reports and an actual human acceptance reference before the `check` command can pass. The initial command prints SHA-256 fingerprints; the second checks selected fields and current file contents. It **cannot** judge design quality, discover omitted inputs or authenticate consent. If an accepted file changes, review the affected scope and refresh the decision as needed; do not merely update hashes to bypass stale evidence. [Helper implementation](../scripts/design-check.mjs) · [Review design procedure](../skills/engineering/review-design/SKILL.md).

## Adoption and limits

Start with one bounded feature and a named owner. Reuse the project's existing ADRs, tests, diagrams and tracker. Configure actual verification resources and protect approvals through the project's review/branch rules. No file in this package installs a Paseo scheduler or CI protections. Brownfield work should model only the boundaries relevant to the change, expanding when that prevents a real misunderstanding. [Shared policy](../skills/engineering/_shared/ARCHITECTURE.md) · [testing policy](../skills/engineering/_shared/TESTING.md).
