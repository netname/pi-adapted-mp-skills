# Quote requirement coverage

The [spec](../specs/quote.md) is authoritative. This table links requirements; it does not restate them as a second specification. Component IDs correspond to the LikeC4 model. Tickets refer to the canonical local tracker and quote-plan.md snapshot.

| Requirement | Components | Tickets | Observable verification |
| --- | --- | --- | --- |
| R1 | pricing | A | test/unit/pricing.test.mjs: valid cents, bad inputs and overflow |
| R2 | catalog, file | B | test/integration/catalog.test.mjs: real file loading, invalid data, duplicates |
| R3 | cli, catalog, pricing | C, depends on A/B | test/e2e/quote.test.mjs: success output and error exit/stdout/stderr contract |
| R4 | cli, pricing, catalog | C | test/e2e/quote.test.mjs: PEN × 3 = 3750, accented name preserved |

Review every in-scope requirement, including unhappy paths, against the actual tests. A path in this table does not prove that its tests exercise all claimed behavior. No requirement is excluded from this lab.
