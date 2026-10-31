# Quote design proposal

Status: draft. Route: full for teaching; this small app would ordinarily fit a lightweight note.
Spec: [quote](../specs/quote.md), requirements R1–R4. Authors: record actual drafting model families when reviewed; the fixture itself is supplied package material.

## Boundaries and scenarios

The [overview](../architecture/overview.md) and [model](../architecture/model/quote.c4) define proposed responsibilities. The CLI validates the argument count and decimal-digit quantity, loads the catalog, finds the exact-case SKU and delegates cents multiplication. Success writes one JSON object with an accented name preserved, then exits 0. Invalid input, malformed data, missing SKU or unsafe product writes only a concise stderr message and exits 1. No stack traces or catalog modifications.

## Alternatives and consequences

One CLI file is a viable simpler alternative, but the exercise has agreed public seams and independently testable A/B work. Separate catalog and pricing modules preserve those seams without a framework, service or database. This is an exercise-specific choice, not a rule that each component must become a ticket.

Floating-point currency would complicate exact-cent behavior; [ADR 001](../adr/001-integer-cents.md) proposes retaining integer cents. A database could support concurrent product updates but introduces infrastructure outside the agreed scope. File size and catalog reload performance are not production guarantees in this fixture.

## Verification and delivery

See [coverage](quote-traceability.md) and the project testing contract. A checks pure arithmetic; B uses real temporary files; C checks the complete process boundary. A/B use different worktrees and temporary directories; C waits for verified integration of both. The stable plan snapshot is quote-plan.md, generated from the supplied tickets. The live tracker remains authoritative for claims and state.

## Open decisions and review

The scope and public seams are supplied exercise constraints. Confirm that these responsibilities and tradeoffs explain them correctly. Reports and actual human acceptance remain pending; quote-readiness.json deliberately starts as draft. Completing this document is not approval.
