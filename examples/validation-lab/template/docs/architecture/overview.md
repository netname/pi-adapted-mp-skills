# Quotation architecture

State: **proposed, not implemented**. The fixture is greenfield. Its supplied spec and tests define the exercise; the design still needs review and acceptance before workers start.

The operator invokes a CLI. The CLI owns argument parsing, SKU lookup and output/error presentation. A catalog reader owns file parsing and catalog validation. A pure pricing component owns integer arithmetic and range checks. The catalog file is read-only application input; no component stores quotations.

See [design and tradeoffs](../designs/quote.md), [requirement coverage](../designs/quote-traceability.md) and [LikeC4 model](model/quote.c4). The model is the source for component and scenario views. Render it with the pinned command in the package architecture guide. Do not hand-maintain a competing Mermaid component map.

At delivery, update this state to observed only after comparing source, tests and review evidence at the final integration SHA. Preserve any difference between intended and implemented behavior explicitly.
