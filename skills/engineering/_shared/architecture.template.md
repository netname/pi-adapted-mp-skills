# Project architecture contract

Owner: configure the human decision owner.
Default route: lightweight for unchanged boundaries/contracts; full otherwise.
Spec location: docs/specs/ (or configure tracker references).
System overview: docs/architecture/overview.md.
Feature design: docs/designs/<feature>.md.
Decisions: docs/adr/.
Model: docs/architecture/model/ when useful; otherwise Mermaid in design notes.
Traceability: docs/designs/<feature>-traceability.md.
Readiness record: docs/designs/<feature>-readiness.json.

Configure concrete paths per effort; angle-bracket placeholders are not runnable configuration.
Choose the decision-bearing inputs explicitly: spec, design, applicable ADRs, model files, traceability and a stable snapshot of approved tickets. Keep approval records and review reports outside their own input hash set. Source implementation files belong to code-review evidence, not this design fingerprint set.

Design reviewers: two fresh Paseo sessions, comprehension and challenge. Configure profiles in delegation.md; model family must differ from all design authors. They may share a family with one another. Code review has its separate implementation-family rule.
Model validation: configure an installed, pinned LikeC4 command if using LikeC4; otherwise record not applicable. Syntax validation does not prove design quality.
Gate: node PACKAGE/scripts/design-check.mjs check REPO RECORD

Coordinator owns the readiness record and links the human's actual acceptance message/issue to it. Capture acceptance after final ticket coverage review; earlier design feedback can be reused if the target is unchanged. Never convert absent approval into accepted status.

Implementation preview: part of the feature design, with change references, concrete examples and accepted constraints versus estimates/open choices.
Sequence diagrams: required when order, asynchronous execution, state changes or failure handling explain the change; otherwise record why unnecessary. Use shared LikeC4 identities where modeled, or Mermaid for a lightweight note.
Model presentation: configure a pinned preview/export command and destination accessible to the human. Record source snapshot and view IDs; visually inspect the rendered views before acceptance. Include decision-bearing model configuration among readiness inputs. No model means validation/rendering is not applicable; an unavailable required renderer means incomplete.
