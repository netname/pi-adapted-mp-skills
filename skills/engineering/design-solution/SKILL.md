---
name: design-solution
description: "Propose an inspectable architecture and implementation design from agreed requirements."
disable-model-invocation: true
license: MIT
metadata:
  origin: local
  adapted-for: pi
---

Read `../_shared/PLAIN-LANGUAGE.md` before writing human-facing questions or artifacts. Preserve exact requirements and decisions when simplifying language.

Read `../_shared/ARCHITECTURE.md` and the project's architecture, testing and delegation contracts. Work from the authoritative spec; expose unresolved requirements rather than choosing product behavior silently.

1. Inspect the existing code, configuration, tests and ADRs. Record the inspected revision and evidence for current-state claims. Select lightweight/full scope with reasons.
2. Draft from `../_shared/design.template.md`. Fill the expected implementation table with change references, concrete behavior/examples, affected contracts and inspected or proposed implementation areas. Separate accepted constraints, estimates and unresolved choices. Explain component responsibilities, boundaries, data ownership and one success/failure workflow. Distinguish current, proposed and transitional states. Start greenfield designs with the smallest viable structure.
3. Compare alternatives and document important consequences. Reuse approved constraints; link significant ADRs. Apply the shared architecture policy to choose context/component views and conditional sequence diagrams. For relevant ordering, state or failure behavior, author LikeC4 dynamic views with `variant sequence` (or Mermaid in a lightweight note); otherwise record why no sequence is useful. Validate with configured pinned tooling, render and visually inspect selected views, and record commands, source snapshot, view IDs and actual results. Fix ambiguous, crowded or contradictory views before presenting them.
4. Link requirements to proposed components and verification seams. Leave ticket mapping explicitly pending until decomposition. Check feasibility of parallel work and isolated test resources without turning every component into a horizontal ticket.
5. Present what will change using the implementation preview, rendered views and concrete success/failure walkthroughs. Identify the choices the human needs to decide. Use a mockup/output example when diagrams cannot explain the user-visible change. Missing rendering remains an incomplete presentation check. Preserve preview evidence tied to the reviewed sources. Hand off to `/skill:review-design`; do not label the draft accepted, launch implementation or automatically publish externally.
