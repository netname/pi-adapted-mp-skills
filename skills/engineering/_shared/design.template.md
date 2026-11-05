# <Feature>: design proposal

Status: draft. Route: lightweight/full. Spec: <reference and requirement IDs>.
Owner: <human>. Authors: <actual model families>. Inspected source revision: <SHA or greenfield>.

## Plain-language overview

Briefly explain what changes, why it matters and what the reader needs to decide. Keep exact requirements in the linked spec. Explain unfamiliar terms before using them in the detailed sections.

## Intent and boundaries

Link requirements and exclusions. Explain actors, components, responsibilities, data ownership and external contracts. State which decisions already exist and which require approval.

## Current, proposed and transitional architecture

For brownfield, cite source/config/tests for current claims. Mark unknowns and distinguish proposals. For greenfield, describe intended architecture. Link views; do not duplicate the shared model in multiple hand-edited diagrams.

## Expected implementation

| Change reference / requirements | Current behavior and evidence | Proposed behavior and concrete example | Affected components/contracts and expected implementation areas | Decision status |
| --- | --- | --- | --- | --- |
| C1 / requirement IDs | Inspected source at revision, or greenfield | Inputs, outputs, side effects and exclusions | Existing/proposed paths; interfaces/data to add, change or retire | Accepted constraint with reference / implementation estimate / unresolved choice |

Keep this table proportional to the change. Describe binding behavior and ownership precisely; file estimates may evolve within those constraints. Expose consequential open choices before implementation. Include a UI mockup or output example when needed to explain the result.

## Sequence diagrams and scenario walkthroughs

Record why sequence diagrams are needed, or briefly why ordering/state/failure behavior needs no diagram. Link each selected scenario to requirement IDs and change references. Present rendered views plus a plain-language success and important failure/alternative walkthrough. Label current/proposed/transition and changed interactions. Show relevant responses, state changes and sync/async behavior; expose consequential retries, timeouts and concurrency without inventing guarantees. Split crowded flows and reuse component identities.

Use LikeC4 dynamic views with `variant sequence` for a shared model, or Mermaid for a lightweight note. Record source snapshot, view IDs, pinned validation/render commands, actual outcomes and a usable preview/export location. Inspect legibility and correspondence to the proposal. Record unavailable validation/rendering as incomplete, not passed.

## Alternatives and decisions

Compare the simplest viable alternative, chosen option, consequences, reversibility and unresolved risks. Link ADRs for significant decisions. Lightweight changes can record why existing constraints suffice here.

## Verification and delivery

Map requirement IDs to change references, component/scenario IDs, planned ticket IDs and specific observable checks. Identify unit, integration and E2E seams, test environments and shared resources. Complete the traceability table after ticket breakdown, before dispatch.

## Review and acceptance

Link independent comprehension/challenge reports, findings/dispositions, the preview actually presented and the actual human decision. Record the reviewed artifact identities; a status word alone is insufficient.
