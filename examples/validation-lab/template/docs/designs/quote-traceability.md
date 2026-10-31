# Quote requirement coverage

The [spec](../specs/quote.md) is authoritative. This table links requirements; it does not restate them as a second specification. Component IDs correspond to the LikeC4 model. Tickets refer to the canonical local tracker and quote-plan.md snapshot.

| Requirement | Design changes | Components | Sequence views | Tickets | Observable verification |
| --- | --- | --- | --- | --- | --- |
| R1 | C1 | pricing | quoteSuccess | A | test/unit/pricing.test.mjs: valid cents, bad inputs and overflow |
| R2 | C2 | catalog, file | quoteSuccess, quoteFailure | B | test/integration/catalog.test.mjs: real file loading, invalid data, duplicates |
| R3 | C2, C3 | cli, catalog, pricing | quoteSuccess, quoteFailure | C, depends on A/B | test/e2e/quote.test.mjs: success output and error exit/stdout/stderr contract |
| R4 | C1, C3 | cli, pricing, catalog | quoteSuccess | C | test/e2e/quote.test.mjs: PEN x 3 = 3750, accented name preserved |

Review every in-scope requirement, including unhappy paths, against the actual tests. A path in this table does not prove that its tests exercise all claimed behavior. No requirement is excluded from this lab.

Change references belong to the [implementation preview](quote.md#expected-implementation); sequence views belong to [the shared model](../architecture/model/quote.c4). Scenarios illustrate the selected paths; they do not replace uncovered requirement cases. At delivery compare each change with the actual source/check evidence and explain any approved deviations.
