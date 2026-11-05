# Quote design proposal

Status: draft. Route: full for teaching; this small app would ordinarily fit a lightweight note.
Spec: [quote](../specs/quote.md), requirements R1–R4. Authors: record actual drafting model families when reviewed; the fixture itself is supplied package material.

## Boundaries and scenarios

The [overview](../architecture/overview.md) and [model](../architecture/model/quote.c4) define proposed responsibilities. The CLI validates the argument count and decimal-digit quantity, loads the catalog, finds the exact-case SKU and delegates cents multiplication. Success writes one JSON object with an accented name preserved, then exits 0. Invalid input, malformed data, missing SKU or unsafe product writes only a concise stderr message and exits 1. No stack traces or catalog modifications.

## Expected implementation

All runtime components are proposed; no application source exists in the scaffold. These choices remain draft until the actual review/acceptance exercise. The spec supplies the public paths and signatures, so those are constraints in this lab rather than placement estimates. Private helper names remain implementation choices.

| Change / requirements | Current | Proposed change and example | Implementation areas / scenario | Decision status |
| --- | --- | --- | --- | --- |
| C1 / R1, R4 | No pricing implementation | Pure safe integer-cent multiplication; 1250 x 3 returns 3750; reject unsafe input/product | `src/pricing.mjs`, `calculateTotalCents`; `quoteSuccess` | Supplied spec seam; design draft |
| C2 / R2 | No catalog implementation | Await real file read, parse and validate entries/unique SKUs; return products or reject; never write catalog | `src/catalog.mjs`, `loadCatalog`; both sequence views | Supplied spec seam; design draft |
| C3 / R3, R4 | No CLI | Validate arguments, await catalog, find SKU, calculate, print one JSON object. Invalid catalog exits 1 with stderr only and never calls pricing | `src/cli.mjs`; `quoteSuccess`, `quoteFailure` | Supplied CLI contract; proposed ordering |

For input PEN, quantity 3 and name `Bolígrafo`, success is `{"sku":"PEN","name":"Bolígrafo","quantity":3,"totalCents":3750}` plus newline, exit 0 and empty stderr. Malformed catalog input produces no stdout, a concise stderr error and exit 1. Exact criteria remain in the spec. Caching, persistence, network services and changes to error presentation are not implied by this proposal.

## Sequence diagrams and walkthrough

Sequence views are useful here because argument checking, asynchronous file loading, validation and calculation must be understandable in order. The single model supplies `components`, `quoteSuccess` and `quoteFailure`; both dynamic views use `variant sequence`. All interactions are proposed. The success view exposes the resolved catalog and pricing result; the failure view shows rejection reaching the CLI without calculation or file writes. Other invalid inputs follow the spec and need no separate diagram unless they expose a new decision.

Use the pinned commands in `docs/agents/architecture.md` and the package PR validation guide. Before acceptance, present the rendered component and sequence views with this walkthrough. Record source snapshot, view IDs, actual command results, preview/export location and visual inspection in review evidence. Rendering/validation and human acceptance are pending in the scaffold. At delivery compare C1-C3 with actual source/checks and retain any approved deviations.

## Alternatives and consequences

One CLI file is a viable simpler alternative, but the exercise has agreed public seams and independently testable A/B work. Separate catalog and pricing modules preserve those seams without a framework, service or database. This is an exercise-specific choice, not a rule that each component must become a ticket.

Floating-point currency would complicate exact-cent behavior; [ADR 001](../adr/001-integer-cents.md) proposes retaining integer cents. A database could support concurrent product updates but introduces infrastructure outside the agreed scope. File size and catalog reload performance are not production guarantees in this fixture.

## Verification and delivery

See [coverage](quote-traceability.md) and the project testing contract. A checks pure arithmetic; B uses real temporary files; C checks the complete process boundary. A/B use different worktrees and temporary directories; C waits for verified integration of both. The stable plan snapshot is quote-plan.md, generated from the supplied tickets. The live tracker remains authoritative for claims and state.

## Open decisions and review

The scope and public seams are supplied exercise constraints. Confirm that these responsibilities and tradeoffs explain them correctly. Reports and actual human acceptance remain pending; quote-readiness.json deliberately starts as draft. Completing this document is not approval.
