# A: Calculate a line price

Status: ready
Claim:
Blocked by: None

Implement acceptance criterion 1 in docs/specs/quote.md. Own src/pricing.mjs and any additional focused pricing tests. Do not edit catalog/CLI or supplied acceptance tests. Verify change: unit. Return committed head, base, model family and evidence. The coordinator owns review and integration.

Design constraints: docs/designs/quote.md and docs/designs/quote-traceability.md. Dependency readiness does not override pending design/plan acceptance.

Design change: C1 in docs/designs/quote.md. Sequence scenarios: quoteSuccess in docs/architecture/model/quote.c4. Return planned-versus-actual evidence for this change; public paths/signatures come from the supplied spec, private helper placement remains an estimate.
