# B: Load a catalog from disk

Status: ready
Claim:
Blocked by: None

Implement acceptance criterion 2 in docs/specs/quote.md. Own src/catalog.mjs and any additional focused catalog tests. Do not edit pricing/CLI or supplied acceptance tests. Verify change: integration. Return committed head, base, model family and evidence. The coordinator owns review and integration.

Design constraints: docs/designs/quote.md and docs/designs/quote-traceability.md. Dependency readiness does not override pending design/plan acceptance.

Design change: C2 in docs/designs/quote.md. Sequence scenarios: quoteSuccess and quoteFailure in docs/architecture/model/quote.c4. Return planned-versus-actual evidence for this change; public paths/signatures come from the supplied spec, private helper placement remains an estimate.
