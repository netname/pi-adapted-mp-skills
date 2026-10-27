# Quote CLI: agreed validation spec

## Problem and solution

A shop operator needs a quote for a whole number of one product, without a database, browser or ERPNext. Read a JSON catalog and print the calculated quote. This is a workflow-validation exercise, not a production POS specification.

## Approved seams and acceptance criteria

1. **R1** — `calculateTotalCents(unitPriceCents, quantity)` is exported from `src/pricing.mjs`. Price is a nonnegative safe integer. Quantity is a positive safe integer. Return their product in integer cents. Reject invalid inputs or unsafe products with RangeError; do not coerce strings. Zero-price items are allowed in this lab only.
2. **R2** — `loadCatalog(path)` is exported from `src/catalog.mjs` and returns a Promise of the parsed array. Use the real filesystem. Each entry has nonempty string sku/name and nonnegative safe-integer unitPriceCents. SKUs are unique, case-sensitive. An empty array is valid. Reject malformed JSON, invalid entries and unreadable/missing files. Do not modify input files. Extra properties may be preserved.
3. **R3** — `node src/cli.mjs CATALOG SKU QUANTITY` accepts exactly three arguments. QUANTITY must contain only decimal digits and represent a positive safe integer. Find the case-sensitive SKU, call the two public APIs and print exactly one JSON object plus a newline: {sku,name,quantity,totalCents}. Exit 0, empty stderr. On any user/data error, exit 1, empty stdout, a concise message on stderr, no stack trace.
4. **R4** — A PEN priced at 1250 cents, quantity 3, produces totalCents 3750. Preserve the product name, including accents.

## Testing decisions

The pricing API, catalog API and CLI are approved seams. The included tests are acceptance examples already supplied by the customer, not a prescription to author all TDD tests before coding. Add focused tests one behavior at a time where useful. Do not edit supplied acceptance tests to hide defects. A justified spec/test correction requires the human's agreement.

A: focused unit checks. B: focused real-filesystem integration checks. C and combined candidate: all tests including the complete CLI user journey. Before C exists, the E2E acceptance tests are expected to fail; they are not a gate on A or B. See docs/agents/testing.md.

## Out of scope

Decimals/weight, VAT, discounts, inventory, payments, HTTP, UI, databases, dependencies from npm, deployment, authentication and ERPNext. Do not install a framework or generalize beyond this exercise.
