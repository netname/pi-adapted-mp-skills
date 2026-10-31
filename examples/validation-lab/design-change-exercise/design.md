# Batch quotation design exercise

Synthetic review inputs, not real project approval. In a live exercise obtain an actual decision before implementation. No real readiness record may cite this document as human consent.

## Behavior request

R-B1: Add a batch API that accepts an ordered list of catalog path, SKU and quantity and returns corresponding quote results. R-B2: Reject the batch on a catalog, SKU or pricing error. Reuse the existing read-only catalog and pricing interfaces.

## Expected implementation

Current application: the original quotation lab has one-request CLI/catalog/pricing interfaces. In a live existing-code run, record its integrated SHA and inspect those actual modules before applying this proposal. Package probes demonstrate a selected behavioral seam, not a verified production baseline.

| Change | Proposed behavior | Areas | Status for the exercise |
| --- | --- | --- | --- |
| C-B1 / R-B1 | Process requests in input order and call the catalog loader separately for each request, including repeated paths. A later request can observe a newer catalog | New batch component; proposed `src/batch.mjs`; reuse catalog/pricing APIs | D-B1 is assumed accepted only within the synthetic probe |
| C-B2 / R-B2 | On first error stop; do not start later reads or return a partial batch | Batch control flow | D-B2 is assumed accepted only within the synthetic probe |

D-B1: Each request performs its own awaited read before pricing. Caching, deduplication and preloading change this choice and require a decision. This does not promise a filesystem snapshot or immunity to external concurrent writes.
D-B2: Complete one request before starting the next; reject on first error. Private variable/helper names and the proposed batch file location are estimates. Existing public catalog/pricing contracts remain binding. No CLI change, network, writes or durable quote storage is part of this exercise.

Example: two requests for PEN, quantity 1, use prices 100 then 200 if the catalog changes between their reads. Fixed catalog examples produce identical results with caching and cannot distinguish D-B1. If the first read fails, the second is not attempted.

## Sequence presentation

`batch.c4` uses the same participant identities for structural and sequence views. All batch interactions are proposed; catalog/pricing responsibilities are reused. `freshReads` shows repeated paths and changing values; `firstError` shows early rejection. Sequence diagrams are needed because ordered results alone do not establish ordered reads or freshness. Validate and render with LikeC4 1.60.0, inspect both views, and record actual snapshot/preview evidence before a live decision.
