# Lab architecture contract

Read __SKILLS_ROOT__/skills/engineering/_shared/ARCHITECTURE.md.
Human owner: the operator validating this lab. Route: full for the teaching exercise.
Design: docs/designs/quote.md. Overview: docs/architecture/overview.md.
Model: docs/architecture/model/quote.c4. ADR: docs/adr/001-integer-cents.md.
Coverage: docs/designs/quote-traceability.md. Approved plan snapshot: docs/designs/quote-plan.md.
Readiness record: docs/designs/quote-readiness.json (starts draft).

Before dispatch, use the quotation design/review exercise in the package's docs/PR-VALIDATION.md. Record actual design author families and two fresh independent review sessions launched through Herdr with the configured role rows, each checked with `herdr-delegate.mjs inspect --expect-model`. Fill the readiness record only from real reports and an actual human decision. The A/B dependency frontier is not authorization to bypass this gate.

Run: node __SKILLS_ROOT__/scripts/design-check.mjs check REPO docs/designs/quote-readiness.json
Replace REPO with this checkout's absolute path. Include spec, overview, design, ADR, model, coverage and stable plan snapshot in the input set. Keep two report files under docs/designs/reviews/ and hash them separately. Ticket scope changes must update the snapshot and refresh readiness; tracker status changes alone do not change scope.

LikeC4 is documentation tooling outside the dependency-free application runtime. From the model directory: npx --yes --package=likec4@1.60.0 likec4 validate. Missing tooling is a reported incomplete model check, not a pass.

Presentation: from the model directory, run `npx --yes --package=likec4@1.60.0 likec4 start` and inspect the local preview. Present `components`, `quoteSuccess` and `quoteFailure` (the latter two are sequence views). Save preview/export references, source snapshot, view IDs and visual inspection results in review evidence. Missing rendering remains incomplete; a syntax pass alone does not complete presentation. Stop the local server when finished.

For retained images, from the model directory run `npx --yes --package=likec4@1.60.0 likec4 export png --sequence --flat -o "__STATE_ROOT__/evidence/design-preview"` using the configured canonical evidence destination. PNG export requires the matching Playwright browser; record a missing browser as an incomplete render.
