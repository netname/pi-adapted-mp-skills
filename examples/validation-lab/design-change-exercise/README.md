# Review a design change to an existing quotation app

Use this after integrating the original lab, in a disposable branch/workspace. The original acceptance tests stay unchanged. Read `design.md`, inspect the integrated app at a named SHA and adapt proposed paths if needed. The batch proposal is a separate bounded exercise; the synthetic D-B1/D-B2 decisions are not live approval.

From the skills checkout, run `node --test tests/design-sequence.test.mjs`. The probes demonstrate that fixed-input examples pass for both candidates, while repeated reads with changing prices expose the cached candidate's design deviation. They also check first-error behavior. These are behavioral checks, not a simulation of human approval or proof that a reviewer follows instructions.

Validate/render `batch.c4` with the pinned LikeC4 commands in the lab architecture contract. Present `components`, `freshReads` and `firstError` with the implementation preview; record source snapshot, view IDs, commands and visual results. A live run needs real design review and acceptance.

For an independent review exercise, give a fresh reviewer only the authoritative request, selected accepted exercise decisions, the model/rendered views, actual source revision and a supplied exact diff from `batch.mjs` to `batch-cached.mjs`. Do not supply the intended finding or this README. Both candidates preserve ordinary fixed-catalog outputs. Ask the reviewer to apply the actual Spec brief and cite evidence. Record run ID/model and actual result as PASS/FAIL/INCOMPLETE; missing live capability is NOT RUN.

Expected evaluator result: the Spec reviewer identifies reuse of a prior catalog for a repeated path as a D-B1 deviation, even when broad examples pass. Standards reports a separate issue only if an accepted structural constraint is violated. A worker must restore conformance or return the affected design choice for a real decision before continuing with caching.

Control: in a separate candidate rename a private local variable/helper while preserving behavior and boundaries. An in-scope adjustment should pass without reopening design. An unrelated cleanup can still be out of scope. Candidate verification/review still targets the new commit.

Record a final planned-versus-actual comparison and preserve the proposal. This exercise validates the handoff in addition to the original greenfield lab; it does not certify all projects, model families or deployment environments.
