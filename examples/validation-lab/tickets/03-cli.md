# C: Produce a customer quote

Status: ready
Claim:
Blocked by: A, B

Implement acceptance criteria 3 and 4 in docs/specs/quote.md using the integrated APIs. Own src/cli.mjs and additional focused CLI tests. Verify change: all. Do not start until A and B have verified integration revisions. Return committed head, base, model family and evidence. Do not close tickets or dispatch reviewers.

Design constraints: docs/designs/quote.md and docs/designs/quote-traceability.md. Dependency readiness does not override pending design/plan acceptance.

Design change: C3 in docs/designs/quote.md. Sequence scenarios: quoteSuccess and quoteFailure in docs/architecture/model/quote.c4. Return planned-versus-actual evidence for this change; public paths/signatures come from the supplied spec, private helper placement remains an estimate.
