# Quotation architecture

State: **proposed, not implemented**. The fixture is greenfield. The generator supplies this overview, the spec and acceptance tests as teaching material. Independent design review and actual human acceptance are still required. The runtime `src/` modules below are created later by implementation workers.

## Purpose and goals

An operator needs a quotation for a whole number of one product in a local JSON catalog. The application reads the catalog and prints the result through a command-line interface. It uses Node's standard library and local files; its runtime needs no web server, database, browser or network service.

The goals are to make a valid quote predictable, preserve exact integer-cent arithmetic, explain invalid requests/data through a consistent command-line error response, and keep catalog input unchanged. These summarize intent: [the spec](../specs/quote.md), requirements R1–R4, remains authoritative for exact accepted inputs, output, exceptions and exclusions.

## Actors, components and responsibilities

| Actor/component | Responsibility | Input and output / data ownership | Intended implementation and verification |
| --- | --- | --- | --- |
| Operator (`operator` in the model) | Chooses catalog path, product SKU and whole quantity; consumes the quote or error | Supplies the catalog file and arguments; owns the input data. The application does not maintain a product database | Invokes the CLI; no operator-facing web UI |
| Quote CLI (`cli`) | Validates command arguments, looks up the exact SKU, coordinates the reader/pricing API and presents results/errors | Reads arguments and returned products; owns stdout/stderr/exit-status presentation. It does not save quotations or change the catalog | Proposed `src/cli.mjs`; ticket C and `test/e2e/quote.test.mjs` |
| Catalog reader (`catalog`) | Loads the real file, parses JSON and validates catalog entries and uniqueness | Returns validated products or rejects the load. Owns file-format/catalog validation, not terminal output | Proposed `src/catalog.mjs`, `loadCatalog(path)`; ticket B and `test/integration/catalog.test.mjs` |
| Price calculation (`pricing`) | Validates numeric inputs and calculates a safe integer-cent total | Pure input/output function; owns arithmetic/range checks and has no filesystem or terminal side effects | Proposed `src/pricing.mjs`, `calculateTotalCents(unitPriceCents, quantity)`; ticket A and `test/unit/pricing.test.mjs` |
| Catalog file (`file`) | Holds the operator-supplied product list | Read-only application input; no component writes it | A local JSON path; tests create independent temporary fixtures |

The model identifiers in parentheses match [quote.c4](model/quote.c4). They are runtime responsibilities, not names of human approval roles. The human owner, planner, coordinator and reviewers belong to the development process configured in [the architecture contract](../agents/architecture.md).

## Successful quotation

1. The operator invokes the CLI with a catalog path, SKU and quantity.
2. The CLI validates its arguments and asks the catalog reader for products.
3. The reader loads and validates the local JSON file, then returns its products.
4. The CLI finds the requested product and calls pricing with its unit price and parsed quantity.
5. Pricing validates inputs and the product's safe-integer range, then returns total cents.
6. The CLI prints the spec's JSON result and exits successfully.

For the supplied example, PEN at 1250 cents and quantity 3 yields 3750 cents while preserving the accented product name. `catalog.json` in sample commands is an operator input path; the PR validation guide's final inspection creates an example file. No pre-existing external catalog service is assumed.

## Failure path and state changes

If the file is unreadable, JSON is malformed or an entry is invalid, the reader rejects the load. The CLI converts that failure to the agreed error response. Invalid arguments, a missing SKU or an unsafe price calculation also reach the CLI's error presentation. The CLI must not print a quote on those failures. Standard output (`stdout`) carries the normal result; standard error (`stderr`) carries diagnostic text; the process exit code reports success or failure to the calling shell. Exact stream/exit behavior is defined by R3 in the spec.

The application retains no durable quotation state. The catalog remains unchanged on success and failure. Tests use separate temporary directories, so A/B verification needs no database or service lease.

## Boundaries, tradeoffs and work order

The reader and pricing function are independently implementable because their public interfaces are supplied in the spec. A/B can run in parallel; C waits for both to be integrated and verified. This component-based split is intentional for the tiny concurrency exercise, not a general requirement to turn every application layer into a ticket.

The choice of separate modules, integer cents and no external service is explained in [the feature design](../designs/quote.md) and [ADR 001](../adr/001-integer-cents.md). The [coverage table](../designs/quote-traceability.md) connects requirements to components, tickets and checks. Keep those references authoritative rather than creating another independent set of acceptance criteria here.

## Views and lifecycle

[The LikeC4 model](model/quote.c4) is the single source for component, successful-quotation and invalid-catalog views. Preview/validation instructions are in the skills package's PR validation guide. Do not hand-maintain a competing component diagram in this overview.

In an ordinary project, the planner creates or updates this overview during design. Here the generator supplies a draft so you can validate the process. At delivery, the coordinator compares it with source/tests/review evidence at the final integration SHA and records observed behavior and any remaining differences. Preserve the reviewed proposal and decision history; do not relabel intended structure as implemented without inspection.
