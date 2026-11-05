# ADR 001: integer cents at the pricing boundary

Status: proposed; the spec already requires integer cents, but this explanation has not yet been reviewed.

Context: R1 requires exact safe-integer cent multiplication and rejects invalid inputs or unsafe products. Fractional quantities are excluded.

Decision proposed: retain integer cents throughout the catalog, pricing API and JSON result. Validate before calculation and reject an unsafe product. Do not coerce strings at the pricing API.

Alternative: floating-point major currency units would require rounding rules outside the exercise scope. A decimal library would add an unnecessary dependency here.

Consequences: simple exact results within the safe-integer range; unsuitable without a new decision for fractional quantities or broader currency rules. Future changes must revisit the spec and acceptance tests, not silently extend this module.
