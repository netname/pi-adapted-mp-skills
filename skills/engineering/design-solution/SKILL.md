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
2. Draft from `../_shared/design.template.md`. Explain component responsibilities, boundaries, data ownership and one success/failure workflow. Distinguish current, proposed and transitional states. Start greenfield designs with the smallest viable structure.
3. Compare alternatives and document important consequences. Reuse approved constraints; link significant ADRs. Show the proposal in Markdown/Mermaid or a shared LikeC4 model according to project needs. Validate model syntax with the configured command and record actual results.
4. Link requirements to proposed components and verification seams. Leave ticket mapping explicitly pending until decomposition. Check feasibility of parallel work and isolated test resources without turning every component into a horizontal ticket.
5. Present the proposal, views, assumptions and unresolved choices. Hand off to `/skill:review-design`; do not label the draft accepted, launch implementation or automatically publish externally.
