# Reproducible workflow-validation lab

Start with the [README documentation map](../../README.md#documentation-map), [application overview](template/docs/architecture/overview.md) and [design operational route](../../docs/ARCHITECTURE-GUIDE.md#operational-route-and-completion-checks). Read [the full manual](../../docs/MANUAL.md) for host setup and execution before running live agents. This is a teaching fixture for PR #1. The generated application is an independent quotation CLI using local JSON files and Node's standard library; agents implement it during validation.

```bash
node /absolute/skills/examples/validation-lab/create.mjs /new/absolute/lab-directory
```

The destination's parent must exist. An existing destination is refused. No provider installs, model calls, Git initialization, remote writes or completed application source are performed. The generated project has an agreed spec, acceptance tests, local tracker and profile template. Fill the template, initialize/commit the project and follow the manual.

Tickets A (pricing) and B (catalog I/O) can run concurrently. C (CLI) depends on both being integrated and verified. The CLI journey exercises E2E without needing a browser or database.

The supplied tests are expected to fail until their corresponding behavior is implemented. Before C, run only the applicable suites. Final delivery requires all suites. Do not edit acceptance tests to manufacture a pass.

## Evidence runner

```bash
node /absolute/skills/examples/validation-lab/verify.mjs \
  /absolute/candidate-worktree all /absolute/evidence-root
```

Profiles: `unit`, `integration`, `e2e`, `combined-ab`, `all`.

The candidate must be committed/clean. The runner executes the supplied acceptance suites with Node, records exact SHA, command, exit/status and logs, and checks HEAD/cleanliness afterward. A timeout, failure or mutation returns nonzero. Evidence must be outside tracked source or in an ignored directory. It does not dispatch agents, enforce tracker locks or verify reviewer independence.

Use [VALIDATION-REPORT.md](../../docs/VALIDATION-REPORT.md) for live results. `npm test` in the skills repository tests the generator and evidence runner offline; it does not validate live Paseo/provider orchestration.

## Design validation extension

The generated project now includes a draft architecture, LikeC4 views, proposed ADR, requirement coverage and an unaccepted readiness record. Follow [the architecture guide](../../docs/ARCHITECTURE-GUIDE.md) before worker dispatch. Dependency readiness and green application tests do not establish design acceptance. Record results separately in [ARCHITECTURE-VALIDATION.md](../../docs/ARCHITECTURE-VALIDATION.md).
