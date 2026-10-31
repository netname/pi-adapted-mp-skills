# Architecture and design contract

Read the project's `docs/agents/architecture.md` (or configured equivalent). If absent, establish a minimal contract before implementation; do not infer an exemption from missing configuration.

## Scope and authority

Requirements belong in the spec. Keep stable requirement IDs and link them from design, tickets and tests; do not maintain competing copies of requirements. The design explains how components satisfy them and why alternatives were rejected. An ADR records a significant decision and its consequences. A diagram explains relationships or an execution scenario; it is not acceptance evidence by itself.

Choose and record the smallest useful route:

- **Lightweight:** an existing boundary and contract remain unchanged. Record a short design note, affected requirement IDs, reused decisions and checks. A model and separate ADR are optional. Fresh review and human acceptance can reuse an existing explicit authorization covering this scope; never invent consent.
- **Full:** new or changed boundaries, ownership, external contracts, persistence, deployment, or significant quality constraints. Record context/components, success and failure workflows, alternatives, risks, and verification. Use LikeC4 when multiple views benefit from one model; Markdown and Mermaid remain valid.

For greenfield, mark architecture as intended. For brownfield, separate observed current, proposed target and any transition; cite source/config/test evidence at an inspected commit. Mark inference and unknowns. Never call a proposed model the existing system.

## Planning gates

1. Clarify behavior and unresolved decisions. `to-spec` publishes requirements, not permission to implement.
2. `design-solution` prepares an inspectable proposal. Review it before substantial ticket decomposition to avoid planning the wrong design.
3. `review-design` uses fresh comprehension and challenge sessions through Paseo. Require both reports, resolve blockers and present tradeoffs to the human. A proposed decision is not accepted just because an agent wrote it.
4. `to-tickets` produces the dependency plan and requirement → component → ticket → verification mapping. Recheck coverage, dependency ordering and shared-resource assumptions. The human's final scope/plan authorization covers the exact artifacts dispatched. Refresh affected review after changes; do not automatically repeat unrelated research.
5. Before dispatch, the coordinator checks the accepted design and approved plan against the current files. For configured machine records, run `scripts/design-check.mjs check REPO RECORD`. Preserve its output with the tracker. Run again after restart, before new dispatch and before accepting integration. Each worker receives the same constraints and artifact identities.

The helper checks recorded fingerprints and required record fields. It cannot discover omitted files, prove an approver's identity, judge semantics, or enforce execution unless called by the coordinator/CI. The coordinator must inspect the authoritative spec, scope and actual records. Protect approval records through ordinary repository review and permissions. Do not manufacture reviewer results or approvals to make the command pass.

## Change and completion

A material change to scope, a boundary, data ownership, an external contract or a significant tradeoff returns to design review and human decision before affected implementation continues. Pause only affected work when independent work can safely continue. Internal implementation choices within accepted constraints do not require reopening design. Never refresh hashes automatically to bypass stale approval. Even editorial edits to tracked design inputs require a recorded refresh; the helper deliberately cannot infer semantic equivalence.

During code review, check conformity with accepted decisions in the existing Standards/Spec axes. Do not create a redundant third code review. At integration, reconcile design/model with observed implementation; retain accepted ADR history, supersede changed decisions and mark remaining differences. An integration check is still required: accepted design does not imply correct code.

## Ownership

Planner drafts; fresh reviewers explain and challenge; human owns consequential decisions and scope; coordinator checks readiness and preserves evidence; workers implement within constraints. Paseo transports sessions. The tracker stores links/status/claims. Neither is an architecture oracle or approval engine.
