# Reproducible workflow-validation lab

New to Herdr or Claude Code? Follow the [beginner quotation walkthrough](../../docs/BEGINNER-VALIDATION.md) for a continuous Windows-to-Ubuntu first run, including role-row setup. The [full validation reference](../../docs/PR-VALIDATION.md) adds failure/recovery exercises and evaluation. Use one route at a time and keep the same lab when switching; normal project setup is documented separately in the manual.

Start with the [README documentation map](../../README.md#documentation-map), [application overview](template/docs/architecture/overview.md) and [design operational route](../../docs/PR-VALIDATION.md#3-review-the-quotation-design). Read [the validation guide](../../docs/PR-VALIDATION.md) for host setup and execution before running live agents. This is a teaching fixture for the orchestration workflow and its architecture/design extension. The generated application is an independent quotation CLI using local JSON files and Node's standard library; agents implement it during validation.

```bash
node /absolute/skills/examples/validation-lab/create.mjs /new/absolute/lab-directory
```

The destination's parent must exist. An existing destination is refused. No provider installs, model calls, Git initialization, remote writes or completed application source are performed. The generated project has an agreed spec, acceptance tests, local tracker and profile template. Fill the template, initialize/commit the project and follow the PR validation guide.

Tickets A (pricing) and B (catalog I/O) can run concurrently. C (CLI) depends on both being integrated and verified. The CLI journey exercises E2E without needing a browser or database.

The supplied tests are expected to fail until their corresponding behavior is implemented. Before C, run only the applicable suites. Final delivery requires all suites. Do not edit acceptance tests to manufacture a pass.

## Evidence runner

```bash
node /absolute/skills/examples/validation-lab/verify.mjs \
  /absolute/candidate-worktree all /absolute/evidence-root
```

Profiles: `unit`, `integration`, `e2e`, `combined-ab`, `all`.

The candidate must be committed/clean. The runner executes the supplied acceptance suites with Node, records exact SHA, command, exit/status and logs, and checks HEAD/cleanliness afterward. A timeout, failure or mutation returns nonzero. Evidence must be outside tracked source or in an ignored directory. It does not dispatch agents, enforce tracker locks or verify reviewer independence.

Use [VALIDATION-REPORT.md](../../docs/VALIDATION-REPORT.md) for live results. `npm test` in the skills repository tests the generator and evidence runner offline; it does not validate live Herdr/harness orchestration.

## Design validation extension

The generated project includes a draft architecture, LikeC4 views, proposed ADR, requirement coverage and an unaccepted readiness record. Follow [the design exercise](../../docs/PR-VALIDATION.md#3-review-the-quotation-design) before worker dispatch. Dependency readiness and green application tests do not establish design acceptance. Record results separately in [ARCHITECTURE-VALIDATION.md](../../docs/ARCHITECTURE-VALIDATION.md).


## Implementation preview and sequence diagrams

The worked example includes a concrete [implementation preview](template/docs/designs/quote.md#expected-implementation) for changes C1-C3, a component view and explicit success/failure sequence views in [quote.c4](template/docs/architecture/model/quote.c4). The [coverage table](template/docs/designs/quote-traceability.md) connects requirements, changes, components, scenarios, tickets and checks. Present the rendered views before actual design acceptance; record planned-versus-actual behavior at delivery. The supplied draft records still confer no approval.

After completing the original lab, use the separate [existing-code design exercise](design-change-exercise/README.md) to investigate a cached implementation that passes fixed-catalog examples but violates the proposed per-request read sequence. It also describes a harmless private-helper rename control. The exercise adds no batch functionality to the original lab and does not change its acceptance tests.

An already generated lab is a separate repository: updating this package does not migrate its documents. For a fresh validation, generate a new lab from the updated package revision. To continue an existing lab, reconcile its design, model, coverage and ticket snapshot deliberately; retain existing implementation and evidence, and refresh affected reviews/acceptance when their inputs change.
