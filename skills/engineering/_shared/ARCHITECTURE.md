# Architecture and design contract

Read the project's `docs/agents/architecture.md` (or configured equivalent). If absent, establish a minimal contract before implementation; do not infer an exemption from missing configuration.

## Scope and authority

Requirements belong in the spec. Keep stable requirement IDs and link them from design, tickets and tests; do not maintain competing copies of requirements. The design explains how components satisfy them and why alternatives were rejected. An ADR records a significant decision and its consequences. A diagram explains relationships or an execution scenario; it is not acceptance evidence by itself.

Choose and record the smallest useful route:

- **Lightweight:** an existing boundary and contract remain unchanged. Record a short design note, affected requirement IDs, reused decisions and checks. A model and separate ADR are optional. Reuse existing review reports and human acceptance only when their exact inputs, scope and independence remain valid. Otherwise obtain both fresh review axes and applicable acceptance; never invent consent.
- **Full:** new or changed boundaries, ownership, external contracts, persistence, deployment, or significant quality constraints. Record context/components, success and failure workflows, alternatives, risks, and verification. Use LikeC4 when multiple views benefit from one model; Markdown and Mermaid remain valid.

For greenfield, mark architecture as intended. For brownfield, separate observed current, proposed target and any transition; cite source/config/test evidence at an inspected commit. Mark inference and unknowns. Never call a proposed model the existing system.

## Implementation preview and sequence diagrams

Keep the preview in the feature design (a short note suffices for lightweight work). Give each meaningful change a stable reference, such as C1, and describe current behavior, proposed behavior, affected components/contracts, concrete input/output or state examples, and exclusions. Cite inspected source for existing behavior. Identify expected implementation areas; distinguish observed paths from proposed paths. Separate accepted constraints, implementation estimates and unresolved choices. File placement estimates are not binding unless placement itself implements an accepted boundary. Resolve consequential choices before affected dispatch.

Choose views by the questions the change raises. A context view locates the system and external actors; a component view explains affected responsibilities and ownership. Reuse existing views and model only enough surrounding context to explain the change. For UI or output changes, include a mockup or concrete output example where architecture views cannot explain the user experience.

**Sequence diagrams are a conditional design deliverable.** Create one when understanding the proposed change depends on interaction order, asynchronous execution, state changes or failure handling. Otherwise record briefly why it adds no useful explanation. Use LikeC4 dynamic views with `variant sequence` when using a shared model; Mermaid sequence diagrams remain suitable for a lightweight note. Apply these rules:

- Name the scenario and link its requirement IDs and change references. Identify new/changed/removed interactions and distinguish inspected current behavior from proposed behavior. Never silently resolve an open choice in a diagram.
- Use actors, components, services and stores as participants; show functions only when their interaction is the decision. Reuse model identities. LikeC4 sequence participants must be leaf elements; select meaningful participants within a container rather than flattening the system merely to render it.
- Show decision-relevant calls, responses, state writes and failure propagation. Explain synchronous/asynchronous behavior, retries, timeouts, transactions and parallel work where they affect correctness; do not invent guarantees or imply an order between independent concurrent steps.
- Include the important failure or alternative path. Split scenarios when branches obscure the explanation; do not prescribe a diagram for every exception or function call.
- Validate with the configured pinned tooling and inspect the rendered views for readable labels, order, branches and consistency with the spec/design. Retain a usable preview/export and its source snapshot, view IDs and rendering command. Raw model source alone is not the human review deliverable. Missing rendering capability is an incomplete presentation check; report it rather than claiming review occurred.

Present the rendered views and a plain-language walkthrough before applicable human acceptance: what the agent expects to change, what happens on success/failure, and what the human needs to decide. Include decision-bearing model sources and configuration in the existing readiness input set. Derived renders must correspond to that snapshot; regenerate them after source changes. Keep review reports and approval records outside their own input set. Syntax checks and hashes cannot establish comprehension or input completeness.

## Planning gates

1. Clarify behavior and unresolved decisions. `to-spec` publishes requirements, not permission to implement.
2. `design-solution` prepares an inspectable proposal. Review it before substantial ticket decomposition to avoid planning the wrong design.
3. `review-design` uses fresh comprehension and challenge sessions launched through Herdr. Require both reports, resolve blockers and present tradeoffs to the human. A proposed decision is not accepted just because an agent wrote it.
4. `to-tickets` produces the dependency plan and requirement → component → ticket → verification mapping. Recheck coverage, dependency ordering and shared-resource assumptions. The human's final scope/plan authorization covers the exact artifacts dispatched. Refresh affected review after changes; do not automatically repeat unrelated research.
5. Before dispatch, the coordinator checks the accepted design and approved plan against the current files. For configured machine records, run `scripts/design-check.mjs check REPO RECORD`. Preserve its output with the tracker. Run again after restart, before new dispatch and before accepting integration. Each worker receives the same constraints and artifact identities.

The helper checks recorded fingerprints and required record fields. It cannot discover omitted files, prove an approver's identity, judge semantics, or enforce execution unless called by the coordinator/CI. The coordinator must inspect the authoritative spec, scope and actual records. Protect approval records through ordinary repository review and permissions. Do not manufacture reviewer results or approvals to make the command pass.

## Change and completion

A material change to scope, a boundary, data ownership, an external contract or a significant tradeoff returns to design review and human decision before affected implementation continues. Pause only affected work when independent work can safely continue. Material deviations include changes to accepted sequence ordering, side effects, persistence or failure/recovery behavior. Internal implementation choices and estimated file moves within accepted constraints do not require reopening design; report them in the delivery comparison. Never refresh hashes automatically to bypass stale approval. Even editorial edits to tracked design inputs require a recorded refresh; the helper deliberately cannot infer semantic equivalence.

During code review, check conformity with accepted decisions in the existing Standards/Spec axes. Do not create a redundant third code review. At integration, reconcile design/model with observed implementation; retain accepted ADR history, supersede changed decisions and mark remaining differences. Return a planned-versus-actual comparison by change reference, linking candidate source/check evidence and actual decisions for deviations. Preserve the reviewed proposal while reconciling observed documentation; never rewrite the proposal to conceal divergence. An integration check is still required: accepted design does not imply correct code.

## Ownership

Planner drafts; fresh reviewers explain and challenge; human owns consequential decisions and scope; coordinator checks readiness and preserves evidence; workers implement within constraints. Herdr transports sessions. The tracker stores links/status/claims. Neither is an architecture oracle or approval engine.
