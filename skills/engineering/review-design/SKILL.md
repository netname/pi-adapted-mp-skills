---
name: review-design
description: "Review a proposed design for comprehension, requirement coverage and tradeoffs before implementation."
disable-model-invocation: true
license: MIT
metadata:
  origin: local
  adapted-for: pi
---

Read `../_shared/PLAIN-LANGUAGE.md` before writing human-facing questions or artifacts. Preserve exact requirements and decisions when simplifying language.

Read `../_shared/ARCHITECTURE.md`, `../_shared/DELEGATION.md` and the project's architecture/delegation contracts.

1. Freeze the explicit review inputs: spec, design including implementation preview, model sources and decision-bearing configuration, relevant ADRs and available traceability/plan. Confirm selected inputs cover the proposed changes and that rendered previews correspond to this snapshot; regenerate stale renders. Capture their hashes with `scripts/design-check.mjs snapshot REPO FILE...` from this package. Keep reports outside that input set. Give reviewers the exact files and inspected source revision, not the drafting conversation or desired verdict.
2. Reuse existing reports only when both axes cover the exact current inputs/scope and satisfy independence. For missing or affected reports, launch fresh comprehension and challenge **batch** sessions through Herdr (`scripts/herdr-delegate.mjs launch --config <docs/agents/delegation.json> --role design-comprehension|design-challenge`; without the JSON, the manual form with `--mode batch`) with `agents/mp-review-design.md` as the brief, assigning one axis each. Supply the plain-language policy explicitly with the briefs. Verify the actual model with `herdr-delegate.mjs inspect <record>` (a manual launch needs `--expect-model`) and derive its family; each must differ from all design authors. If unavailable, remain incomplete and report the capability gap. Do not silently use the drafting session.
3. Ask comprehension to reconstruct the expected implementation changes and trace representative requirements through concrete success/failure scenarios, including sequence diagrams when selected. Ask challenge to test alternatives, missing behavior, failure paths and tradeoffs. Collect separate reports with run ID, effective model/family, snapshot and findings. Record failures/timeouts as incomplete. Configure read-only access where supported and check fingerprints afterward; instructions alone are not a sandbox.
4. Resolve blocking findings with the planner. Preserve disagreements and evidence. Re-review affected changes against new hashes. Present the rendered views and implementation walkthrough with unresolved choices before acceptance. Have the human decide consequential tradeoffs; reuse prior explicit authorization only when it covers the exact current scope.
5. After ticket decomposition, verify coverage and plan consistency against the accepted design. Before dispatch, capture final input hashes including traceability and a stable ticket snapshot; refresh affected review and record the human's actual plan authorization. Use `scripts/design-check.mjs check REPO RECORD` to validate the record. Missing reports, stale files, unresolved blockers or absent acceptance remain blocked.
6. Report what was understood, challenged, decided and still unknown. This is a design-readiness decision, not a claim that code passes tests or that deployment is authorized.
