# Migrate to 0.2.0

1. Install the entire updated package and reload Pi. Check for shadowing copies of skills before use.
2. Keep any globally installed pi-subagents or pi-web-access package if other workflows use it. This package no longer registers subagents or requires those packages; it does not uninstall anything.
3. Configure Paseo host profiles and populate project `docs/agents/delegation.md` and `docs/agents/testing.md` from the templates under `skills/engineering/_shared/`. The setup skill can do this. Select real models available on the host; no static model-name recommendation is baked in.
4. Preserve existing glossary content when moving domain `CONTEXT.md` to `GLOSSARY.md`, updating references together. `CONTEXT-MAP.md` remains the multi-context index. Do not rename an unrelated context document or overwrite an existing glossary.
5. Use `implement-spec` for a graph, `implement` for one ticket. The coordinator owns review, tracker updates and serial integration. Close tickets according to the project's PR lifecycle; an integrated status can unblock dependencies before PR closure.
6. Commit candidates before gated review. Dirty reviews now fail explicitly. Review approval names immutable base/head revisions and must be refreshed after fixes/merges.
7. Retire calls to `resolving-merge-conflicts`; integration conflict handling now belongs to the coordinator and must preserve both sides' requirements. Never reset or force-update a user's work to repair a merge.

## Upstream and local changes

The selective v1.3.1 port uses commit `24fe0ef7737efae15c87225755e9f6f5965e4888`: new `implement-spec`, `pr`, `retro`, and updated `tdd`, `to-spec`, `to-tickets`. Other skills keep their original source pin, with explicit local changes for delegation and glossary naming. Existing sidecars remain adapted references unless noted otherwise. The inventory's upstream commit is the comparison baseline; each shipped row's sourceCommit and each skill's metadata record provenance.

Local policy adds Paseo delegation, model-family separation, committed review snapshots, bounded coordination, environment ownership and three verification profiles. These supersede v0.1's frozen D10/D16 package prerequisites and transport decisions. The historical token map remains intact for compatibility validation, not as a mandate to restore pi-subagents.

The old smoke harness and probes are retained only for historical reproduction, guarded by `MP_RUN_LEGACY_SMOKE=1`; they are not 0.2.0 tests. The active smoke command is offline. Run the live acceptance checklist before relying on unattended execution.
