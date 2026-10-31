# Validate the workflow PRs with the quotation lab

This guide is **only for evaluating proposed changes to this skills package**. The quotation CLI is a disposable test project. For normal software projects, use [WORKFLOW.md](WORKFLOW.md) to understand the process, [ARCHITECTURE-GUIDE.md](ARCHITECTURE-GUIDE.md) for design work and [MANUAL.md](MANUAL.md) for setup and daily use. This guide records what the package does on your tested host and models; it does not grant PR merge authorization.

The lab supplies a reference spec (R1–R4), draft design, A/B/C tickets and acceptance tests. Agents must inspect and review them; supplied files are **not** proof that live planning/review happened. A implements pricing, B reads a local catalog and C connects both into a CLI after verified integration. Runtime needs Node and local files only. Read the [fixture README](../examples/validation-lab/README.md) and [application overview](../examples/validation-lab/template/docs/architecture/overview.md) for the exercise itself.

Use [the workflow report](VALIDATION-REPORT.md) for orchestration and [the architecture report](ARCHITECTURE-VALIDATION.md) for design/readiness. Copy them into the lab as instructed below and record PASS, FAIL, NOT RUN or BLOCKED with observed evidence. Historical preparation checks in the templates are not results from your run. Preserve the ignored `.scratch/` tracker separately from Git commits.

| Step | Action and prerequisite | Evidence before continuing |
| --- | --- | --- |
| 1 | [Prepare the execution host and profiles](MANUAL.md#prepare-the-execution-host), then [freeze the PR checkout](#1-freeze-the-package-under-test) | Pi/Claude/Paseo work on the selected host; package SHA and offline tests recorded |
| 2 | [Create and configure the lab](#2-create-and-configure-the-lab) | Initial lab SHA, actual role profiles, canonical tracker path and report copies |
| 3 | Optionally [rehearse discovery](#optional-planning-rehearsal); then [review the design](#3-review-the-quotation-design) | Real review reports, human acceptance of current scope, passing readiness and approved execution baseline |
| 4 | [Run A/B and then C](#4-execute-the-ticket-graph) | Distinct worktrees and run IDs; independent reviews; serial verified integration |
| 5 | [Inspect the result](#5-inspect-the-result) and [exercise failure paths](#6-exercise-failure-paths) | Final SHA, test/review evidence, failures and recovery observations |
| 6 | [Complete the reports](#7-evaluate-the-framework) | A recommendation bounded by the checks actually run; no implied merge approval |

The optional discovery rehearsal tests Stages 1–2 of the [normal lifecycle](WORKFLOW.md#stages-owners-and-completion-conditions); the supplied spec/tickets remain the reference for subsequent execution. Do not run both the normal project procedures and this validation route as if they were two required copies of the same work.

### What the live run must demonstrate

Offline package tests cannot prove that your Paseo host, providers and worktrees follow the workflow. During this disposable run, observe actual provider/model IDs, cited research when rehearsed, two independent design review axes, two independent code review axes on exact committed targets, concurrent A/B worktrees, serial combined integration and C waiting for both verified dependencies. Exercise a failed test/reviewer, a changed or dirty candidate, a merge conflict and coordinator restart; retain the evidence and bounded retry history. The [workflow report](VALIDATION-REPORT.md#acceptance-matrix) and [architecture report](ARCHITECTURE-VALIDATION.md#live-validation-report-fill-for-your-run) enumerate the observations. A missing capability or unperformed exercise is NOT RUN or BLOCKED, not a pass.

## 1. Freeze the package under test

A package install from the default branch does not validate an unmerged PR. Use a dedicated checkout outside any existing application repository. The skills package and generated lab are sibling directories:

```text
~/code/pi-skills-validation-01       skills package under test
~/code/quote-workflow-lab-01         separate application repository
```

For a first validation of the current combined framework, use the architecture branch below; it includes the orchestration changes. Only when intentionally testing PR #1 alone, substitute `improve/paseo-testing-workflow` and record that narrower scope. These commands capture the branch at clone time: record the printed SHA and keep it fixed for the run.

```bash
export MP_SKILLS="$HOME/code/pi-skills-validation-01"
mkdir -p "$HOME/code" &&
git clone --branch improve/architecture-design-review --single-branch \
  https://github.com/netname/pi-adapted-mp-skills.git \
  "$MP_SKILLS" &&
cd "$MP_SKILLS" &&
git rev-parse --show-toplevel &&
git rev-parse HEAD &&
npm ci &&
npm test
```

The destination is an absolute path derived from `$HOME`, so the clone goes to the same place regardless of the terminal's starting directory. Each `&&` runs the following command only after the preceding command succeeds. A failed clone or `cd` therefore prevents the Git/npm checks from running in another project. If the destination already exists, inspect it or choose a fresh numbered directory; do not overwrite or reset it.

### What each command does

| Command | Explanation | Expected result |
| --- | --- | --- |
| `export MP_SKILLS=…` | Stores the absolute skills-checkout path and exposes it to child processes. | Later commands use this exact destination. |
| `mkdir -p "$HOME/code"` | Creates the parent directory if needed. | The destination's parent exists. |
| `git clone … "$MP_SKILLS"` | Downloads the selected branch directly into the absolute destination. | A new skills repository, without depending on the previous working directory. |
| `cd "$MP_SKILLS"` | Enters that checkout. | Subsequent commands operate on the skills package. |
| `git rev-parse --show-toplevel` | Prints the Git repository root. | It matches `$MP_SKILLS`; investigate any mismatch. |
| `git rev-parse HEAD` | Prints the exact revision under test. | Save this as the skills-under-test SHA. |
| `npm ci` | Installs exact development dependencies from package-lock.json, including the YAML parser. | Reproducible validation tooling. |
| `npm test` | Validates the skills, then runs the package's offline tests. | Exit 0 with no failed checks. |

### Understand the clone command

This is the complete clone command when `MP_SKILLS` has been set above:

```bash
git clone --branch improve/architecture-design-review --single-branch \
  https://github.com/netname/pi-adapted-mp-skills.git \
  "$MP_SKILLS"
```

- `--branch` selects the combined architecture/workflow PR branch; the slash in the name is not a filesystem path.
- `--single-branch` limits the fetched branch history, not the checkout to one commit.
- `"$MP_SKILLS"` is the absolute local destination, kept identical to the path used by later commands.
- A trailing `\` continues the same Bash command onto the next line; it must be the final character on that line.

The command does not merge the PR or update GitHub. It gets the branch state at clone time. Source: [git clone](https://git-scm.com/docs/git-clone).

### Understand paths and version identity

`$HOME` is the home directory of the current execution-host user. Quotes preserve spaces while allowing variables to expand. `MP_SKILLS` and `MP_LAB` are names chosen for this guide; they are not built-in Git or Paseo settings. Keep them pointed at different sibling directories.

Print the actual values when diagnosing a path problem:

```bash
printf 'Skills checkout: %s\nLab: %s\n' "$MP_SKILLS" "${MP_LAB:-not-created-yet}"
pwd
```

For an existing checkout, use this complete check block after setting `MP_SKILLS` to its actual location:

```bash
cd "$MP_SKILLS" &&
git rev-parse --show-toplevel &&
git rev-parse HEAD &&
test -f package-lock.json &&
npm ci &&
npm test
```

If a previous relative clone landed elsewhere, update `MP_SKILLS` to that checkout's actual absolute path. A missing package.json or package-lock.json is a reason to verify the directory and revision before changing dependencies. Do not generate a replacement lockfile to hide a wrong-directory error.

Record the SHA printed by Git, not a commit ID copied from an older conversation. Keep the package checkout unchanged during a validation run. A new revision needs a new run record; a fresh numbered lab avoids mixing changed fixtures with old evidence. The variable assignments last for the current shell and its children, so set them again in a fresh terminal.

### Understand the test result

`npm test` is defined by this repository's [package.json](../package.json): skill validation followed by Node's test runner. A validation failure prevents the runner from starting. Run `npm ci` first; the checks themselves are offline and need no model authentication.

This corrected architecture branch has 23 offline tests; PR #1 has 19. Judge success by the complete result and exit status, not by matching a fixed number. In Bash, `echo $?` immediately after `npm test` prints that command's exit status: `0` means success; a nonzero value means it failed. Run it immediately because another command replaces the status.

Passing package checks does not establish that live Paseo sessions, model separation or the generated application pass. Those are later exercises. The generated application itself uses only local files and Node's standard library. Source: [npm test](https://docs.npmjs.com/cli/v11/commands/npm-test/).

### Install the package into the lab project later

Do not run a lab installation command yet: `$MP_LAB` may not exist. In [Generate a new directory](#generate-a-new-directory), the generator creates the application directory first. The same command block then enters it and runs `pi install -l "$MP_SKILLS"`. Follow that block once; there is no separate installation to repeat here.

The `-l` option records a project-local installation. Pi loads the package from its existing checkout after project trust. Check startup diagnostics and avoid duplicate skill copies with shadowing names. Keep unrelated packages where needed, but verify the configured Paseo delegation path. See [Pi packages](https://pi.dev/docs/latest/packages) and [Pi skills](https://pi.dev/docs/latest/skills).


## 2. Create and configure the lab

### What A, B and C mean

These letters identify three implementation tickets, not models, profiles or different applications:

| Ticket | Worker implements | Verification boundary | Dependency |
| --- | --- | --- | --- |
| A | `src/pricing.mjs`: total in integer cents | Pricing unit tests | No implementation blocker; design/readiness gates still apply |
| B | `src/catalog.mjs`: read and validate a JSON catalog | Real filesystem integration tests | Can overlap A in a different worktree |
| C | `src/cli.mjs`: parse input and combine catalog/pricing | Complete CLI process E2E | Waits for verified integration of A and B |

A and B use separate fresh sessions with the same implementation profile. C uses another fresh session later. The coordinator creates these workers and their worktrees; you do not manually launch each ticket. The model/profile/run distinctions are explained in the [project manual](MANUAL.md#what-is-a-profile).

### What you will build

An operator runs:

```bash
node src/cli.mjs catalog.json PEN 3
```

For a product named `Bolígrafo`, priced at 1250 cents, the successful output is:

```json
{"sku":"PEN","name":"Bolígrafo","quantity":3,"totalCents":3750}
```

There is no completed implementation in the scaffold. The agents must create it. The bundled tests are customer-supplied acceptance examples. They are not permission to modify tests until the application looks green.

### Generate a new directory

These commands assume step 1 set `MP_SKILLS`. Generate the application beside the skills checkout, outside any existing application repository. The application uses Node's standard library and a local JSON catalog; agent providers and optional diagram tooling are validation tools, not application runtime services:

```bash
export MP_LAB="$HOME/code/quote-workflow-lab-01"
mkdir -p "$HOME/code" &&
node "$MP_SKILLS/examples/validation-lab/create.mjs" "$MP_LAB" &&
cd "$MP_LAB" &&
git init -b main &&
pi install -l "$MP_SKILLS"
```

The generator refuses an existing destination. Use a new numbered directory for a fresh attempt rather than deleting a failed run's evidence. The generator itself only creates the scaffold; the following commands initialize Git and install the Pi package locally. If a later command fails, inspect the newly created directory and resume the failed step; do not rerun the generator over it. No command in this block installs providers, launches agents or changes global setup.

Generated artifacts include:

- A complete agreed spec in `docs/specs/quote.md`.
- A glossary, standards, project instructions and testing/tracker configuration.
- Acceptance tests for pricing, catalog I/O and CLI behavior.
- Three Markdown tickets and a derived graph under `.scratch/quote-demo/`.
- A delegation template requiring your real profile/model settings.

### Open and configure the lab

**You act next.** Confirm Paseo Desktop is connected to the execution host where `MP_LAB` exists, such as `sen03`. Open that lab directory as a project in Paseo; alternatively, register it on that host from the lab terminal:

```bash
cd "$MP_LAB" &&
paseo project create
```

Check the host and absolute path shown in Paseo before starting a session. Registration does not configure profiles or implement code. See [Paseo CLI projects](https://paseo.sh/docs/cli#projects).

Print both actual absolute paths from the same host shell:

```bash
printf 'Skills package: %s\nLab project: %s\n' "$MP_SKILLS" "$MP_LAB"
```

If a value is empty, set it to the actual existing checkout/directory; do not create another lab merely to obtain a path. Variables are shell-specific and may need to be set again in a new terminal.

#### Recommended: configure with Claude in Paseo

In the lab project on the correct host, create a fresh Claude planning session using the profile you configured in [profile setup](MANUAL.md#create-role-profiles-on-the-execution-host). Replace both placeholders in the complete prompt below with the printed absolute paths before sending it to that session:

```text
Read PACKAGE_PATH/skills/engineering/setup-matt-pocock-skills/SKILL.md and
follow that procedure for APPLICATION_PATH. Resolve references relative to
the skill file. Treat Pi-specific installation checks as checks of the Pi
worker environment. Use only actual discovered Paseo settings.

Inspect and preserve the supplied local tracker, quote specification, testing
contract, acceptance tests and application scope. Use the canonical absolute
tracker path already recorded in the lab's AGENTS.md; do not create another
tracker in a worktree. Inspect existing project instructions before changing
anything, and complete them rather than replacing them unnecessarily.

Help me populate docs/agents/delegation.md with the actual Paseo profiles,
provider/model IDs and model families I provide or that can be independently
verified. A profile must already exist in Paseo; do not invent one. Preserve
the configured worker and retry limits unless I decide to change them.

Do not implement the application, accept the design on my behalf, alter the
supplied acceptance tests, install or change global packages, create a remote
repository, or launch implementation workers. Report missing settings and any
conflict with the installed Pi/Paseo versions. Summarize files changed and
questions that need my decision so I can inspect the result.
```

`PACKAGE_PATH` is the skills checkout; `APPLICATION_PATH` is the generated lab. They are placeholders, not literal paths. Pi package installation does not create Claude slash commands. Respond to setup questions with existing verified decisions and settings; do not assume the agent can infer your actual model IDs from profile names.

#### Alternative: configure with Pi

Instead of the Claude route, create a Pi session in Paseo in the **same lab project**. Confirm Pi loaded the project-local package installed above. Send the following two messages in that session:

```text
/skill:setup-matt-pocock-skills
```

```text
Configure this quotation lab using its existing instructions and actual Paseo
profiles. Preserve the supplied spec, acceptance tests, testing contract, scope
and canonical absolute tracker path in AGENTS.md. Inspect existing files before
changing them; resolve all delegation.md placeholders using verified provider,
model and family information, asking me when information is missing. Do not
implement the application, fabricate design acceptance, modify global
installations, create a remote repository, or launch implementation workers.
Summarize changes, missing settings and conflicts for my inspection.
```

Use **one** setup path, not both. If Pi cannot find the skill, inspect installation/startup diagnostics and the [command visibility guidance](MANUAL.md#two-setup-checks-command-visibility-and-shared-tracker-paths).

#### Inspect the configuration before committing

You inspect the agent's proposed changes; the setup session can help explain them. From a terminal on the execution host:

```bash
cd "$MP_LAB" &&
git status --short &&
git diff &&
cat AGENTS.md &&
cat docs/agents/delegation.md &&
cat docs/agents/testing.md &&
cat docs/agents/architecture.md
```

`git diff` shows tracked changes; new untracked files also appear in `git status`, so open any relevant new file separately. Check:

- `AGENTS.md` points to the lab instructions and its canonical tracker root, `$MP_LAB/.scratch/quote-demo`. All worktrees must use that **original absolute path**.
- `docs/agents/issue-tracker.md` describes ownership and tracker transitions. `delegation.md` contains real profile names, provider/model IDs and families, with no unresolved required `configure` placeholders.
- `testing.md` identifies usable lab commands and resources; `architecture.md` identifies required design review and acceptance. The supplied specification, tests and scope remain intact.
- Profiles have actually been saved in Paseo; the Markdown file records them but does not create them. Design reviewers differ from design authors, and code reviewers differ from every implementation family contributing to their target.
- Any missing tools, model identity or unresolved decision is recorded as a blocker. Do not start implementation until the configuration and design-readiness gates are complete.

#### Commit the initial lab baseline

After you have inspected the intended setup changes, commit the project configuration and supplied scaffold:

```bash
cd "$MP_LAB" &&
git add . &&
git commit -m "Define quote lab specification, acceptance tests and workflow" &&
git rev-parse HEAD
```

Record this output as the **initial lab baseline SHA**, distinct from the skills-package SHA. The tracker/evidence under `.scratch/` is ignored: retain it separately; the commit does not save it.

Later, after actual design review and human acceptance, the [architecture handoff](#commit-and-hand-off-to-execution) records the **approved execution baseline**. It may be a later commit; workers start from that accepted revision. Preserve both identities in the reports.

**Next:** copy the two reports below, run the optional planning rehearsal if validating the whole cycle, then follow the linked design review. Return to [step 4](#4-execute-the-ticket-graph) only after the design readiness check and handoff.

### Record the environment first

Copy both reports after generating the lab. This copies templates; it does not mark any check as passed:

```bash
cp "$MP_SKILLS/docs/VALIDATION-REPORT.md" \
  "$MP_LAB/.scratch/quote-demo/validation-report.md" &&
cp "$MP_SKILLS/docs/ARCHITECTURE-VALIDATION.md" \
  "$MP_LAB/.scratch/quote-demo/architecture-validation.md"
```

Fill run identity and actual Node/Git/Pi/Paseo/Claude versions/models in both. The workflow report covers execution/recovery; the architecture report covers design/review/readiness. Add evidence from the harmless session/delegation checks. Historical offline checks in the architecture template are reference information, not results from your run. After copying, relative documentation links may not resolve: use the recorded skills checkout or GitHub links. No secrets belong in reports. These copies are ignored by Git, so retain them separately.

**Next:** do the planning rehearsal below for whole-cycle validation, then [step 3](#3-review-the-quotation-design). After its accepted readiness record is committed, return to [step 4](#4-execute-the-ticket-graph).

### Optional planning rehearsal

The ready-made spec and tickets make execution repeatable. To exercise the earlier SWE stages too, run this rehearsal before implementation:

1. Ask Wayfinder to investigate a quote tool, but put its map in a separate `.scratch/quote-discovery/` directory.
2. Create two independent research questions: how Node reports CLI exit status, and how its standard library reads a UTF-8 file. Ask for current official sources and saved notes.
3. Create one HITL decision: integer quantities versus measured/decimal quantities. Observe that the coordinator asks you; answer “positive whole quantities for this lab.”
4. Resolve money representation: integer cents. Confirm no tax, discounts or inventory.
5. Use grilling, then `to-spec` and `to-tickets`, asking the agent to compare its result with the supplied reference rather than overwriting it.

Success means cited research artifacts, no blocked research launched prematurely, the human decision preserved and a graph equivalent to A+B→C. Prose need not match word-for-word. If the planner invents external-system requirements or answers the human decision itself, record a failure.

Use the supplied reference spec/tickets for the execution test after the rehearsal. This separates planning variability from orchestration correctness.

Before starting [step 4](#4-execute-the-ticket-graph), complete [the design review and acceptance exercise](#3-review-the-quotation-design). The new scaffold deliberately starts with a draft design; A/B being dependency-ready is insufficient.


## 3. Review the quotation design

This is the lab's design and review exercise. Complete [lab setup](#2-create-and-configure-the-lab), including the initial commit and report copies, first. Use the *same* `MP_LAB`; do not generate a second lab. Return to [step 4](#4-execute-the-ticket-graph) after readiness and the execution baseline are recorded.

### Prepare the lab before review

The supplied design, LikeC4 model, proposed ADR, coverage and ticket scope snapshot start as **drafts**. The generator provides no completed application or live review evidence. Confirm the actual profiles, decision owner and canonical tracker root in the original lab. A package update does not retroactively change a generated lab: use a new numbered lab and package SHA for another run. See [normal host/profile setup](MANUAL.md#prepare-the-execution-host) for details.

The supplied overview describes proposed components. Read it first, then use the spec to check exact behavior. Runtime files such as `src/cli.mjs` are intentionally created later by workers; a missing `src/` before dispatch is expected.

Before launching A/B workers, read these files in the generated application:

1. `docs/specs/quote.md`: R1–R4 define behavior.
2. `docs/architecture/overview.md`: responsibilities and intended state.
3. `docs/designs/quote.md`: alternatives, consequences and scenarios.
4. `docs/adr/001-integer-cents.md`: arithmetic decision.
5. `docs/designs/quote-traceability.md` and `quote-plan.md`: coverage and proposed work.

You should be able to explain why pricing knows nothing about files, why the catalog reader does not print errors, and why C must wait for A/B. For PEN at 1250 cents and quantity 3, the CLI loads products, finds PEN, calls pricing and prints totalCents 3750. For malformed JSON, loading fails and the CLI prints only a concise stderr error with exit 1. The full teaching route is intentionally more elaborate than this tiny program ordinarily needs.

### Visualize and validate

From the generated application's `docs/architecture/model` directory:

```bash
npx --yes --package=likec4@1.60.0 likec4 validate
npx --yes --package=likec4@1.60.0 likec4 start
```

The first command checks model syntax/layout validity and exits. The second starts a local preview; use its printed URL and stop it with Ctrl+C when done. The package version is pinned for the exercise. This may download documentation tooling from npm; it does not add runtime dependencies to the quotation application. In a real project, pin tooling in the project's development dependencies and lockfile for CI reproducibility.

Inspect the component, success and failure views. Rendering makes relationships easier to see; it does not review them. Official references: [LikeC4 tutorial](https://likec4.dev/tutorial/), [CLI](https://likec4.dev/tooling/cli/), [dynamic views](https://likec4.dev/dsl/views/dynamic/).

### Explain the proposal

Open a Claude planning session in Paseo for the lab. Expand the paths from your terminal and paste their actual values into the prompts:

```bash
printf 'Package path: %s\nApplication path: %s\n' "$MP_SKILLS" "$MP_LAB"
```

Replace `PACKAGE_PATH` and `APPLICATION_PATH` below with those absolute values; they are explanatory placeholders, not literal directories. Installing this package in Pi does not register its slash commands in Claude Code, so use the explicit file path.

```text
Read PACKAGE_PATH/skills/engineering/design-solution/SKILL.md and follow it
for APPLICATION_PATH. Resolve relative references from the skill's directory.

Read the application's architecture, delegation and testing contracts and R1–R4.
Explain the supplied quotation proposal and its overview in plain language:
components, responsibilities, data ownership, success/failure paths and tradeoffs.
Preserve the supplied behavior, tests and exclusions. Identify assumptions and
contradictions. Update the proposal if needed, keeping changes visible.
Do not implement the application or record human acceptance.
```

Expected result: you can explain what will be built and why without needing the author's missing context. Ask “Which component rejects an unsafe product?”, “Who presents a missing-SKU error?” and “Which ticket/test covers accented names?” Review changes in Git before approving them. Actual implementation remains absent.

### Run independent review and check the plan

Use the planning/coordinator session to arrange review through the configured profiles:

```text
Read PACKAGE_PATH/skills/engineering/review-design/SKILL.md and follow it
for APPLICATION_PATH, using the actual configured Paseo profiles.

Freeze and identify the proposal inputs. Launch separate fresh comprehension
and challenge sessions with the package brief and explicit project paths.
Inspect their effective models and ensure independence from the design authors.
Preserve their reports under docs/designs/reviews/ and record findings/dispositions.
Do not change the frozen proposal while reviewers inspect it.

Check R1–R4 coverage, the supplied A/B/C tickets, quote-plan.md and verification
mapping. Do not generate duplicate tickets. Refresh affected review if the final
plan changes the design. Present unresolved questions and the final proposal to me.
Do not fabricate acceptance or start implementation workers.
```

Design review checks understanding before decomposition. The teaching fixture already supplies its proposed tickets, so the final plan check inspects those tickets and their scope snapshot rather than running a second breakdown. For a new feature, use `to-tickets` after the proposal review. Either way, record any changed scope in the snapshot and refresh affected review/acceptance; live claim/status changes alone do not alter ticket scope.

Complete means two actual reports identify their input target and effective models, blockers are resolved or still visibly pending, and every in-scope requirement maps to planned work and an observable check. A finished session or a report filename alone does not establish a pass. Keep failed/cancelled sessions in the evidence history.

### Capture exact inputs

Use the same `MP_LAB` absolute path established above. This command can run from any directory and prints the current input fingerprints:

```bash
node "$MP_SKILLS/scripts/design-check.mjs" snapshot "$MP_LAB" \
  docs/specs/quote.md \
  docs/architecture/overview.md \
  docs/architecture/model/quote.c4 \
  docs/designs/quote.md \
  docs/adr/001-integer-cents.md \
  docs/designs/quote-traceability.md \
  docs/designs/quote-plan.md
```

This prints a map of relative file paths to SHA-256 fingerprints. It writes nothing and approves nothing. A fingerprint changes when file bytes change. Do not include the readiness record itself or review reports in this input set; those refer to the inputs and would otherwise create circular identities.

The coordinator records this map as `inputs` in `quote-readiness.json`, in both review entries and in the human approval entry. Each reviewer must actually have inspected that snapshot. If the final ticket breakdown changes the target, obtain a targeted refresh from each affected reviewer and record the final inputs; do not merely relabel the old report.

### Record acceptance and check readiness

After reviews and the final plan check, the human can accept or request changes to the exact current proposal. For example: “I accept the current quotation design and A/B/C plan for this disposable lab, preserving R1–R4 and the supplied exclusions.” This sentence is an example to use only if it reflects your decision. The coordinator preserves a durable reference to the actual message and records the current fingerprints; it does not decide on your behalf.

Record shape (angle-bracket values below are explanatory placeholders, not usable approval):

```json
{
  "schemaVersion": 1,
  "route": "full",
  "status": "accepted",
  "authorFamilies": ["<actual design-author family>"],
  "inputs": { "<each selected file>": "<its SHA-256>" },
  "reviews": [
    {
      "axis": "comprehension",
      "runId": "<actual fresh run>",
      "model": "<effective model>",
      "family": "<actual independent family>",
      "status": "complete",
      "blockingFindings": 0,
      "inputs": { "<each selected file>": "<its SHA-256>" },
      "report": "docs/designs/reviews/comprehension.md",
      "reportSha256": "<hash of actual report>"
    },
    {
      "axis": "challenge",
      "runId": "<another actual fresh run>",
      "model": "<effective model>",
      "family": "<actual independent family>",
      "status": "complete",
      "blockingFindings": 0,
      "inputs": { "<each selected file>": "<its SHA-256>" },
      "report": "docs/designs/reviews/challenge.md",
      "reportSha256": "<hash of actual report>"
    }
  ],
  "approval": {
    "by": "<actual human>",
    "at": "<ISO timestamp>",
    "reference": "<durable reference to actual acceptance>",
    "inputs": { "<each selected file>": "<its SHA-256>" }
  }
}
```

Use the snapshot command on the two actual report files to calculate their hashes separately. Keep reports and approval references accessible after sessions end. `blockingFindings: 0` means no unresolved blocking findings after recorded dispositions, not that earlier findings disappeared. Freeze decision-bearing files before final review/acceptance; changing an ADR's status afterward also changes its hash. Record acceptance in the separate readiness record to avoid that cycle.

After the human has accepted the actual current proposal and plan, the coordinator can check:

```bash
node "$MP_SKILLS/scripts/design-check.mjs" check "$MP_LAB" \
  docs/designs/quote-readiness.json
```

On the initial scaffold this **must fail**, because it is draft. With complete current records it returns `ready: true`. That result means structural checks passed: selected files and reports match their hashes, the two recorded reviews are complete with no blockers, recorded families differ, and acceptance targets the same files. It cannot authenticate a human, verify Paseo settings, discover a missing requirement/file or judge whether a report is honest. Those are review/coordinator responsibilities; this is not a tamper-proof approval service.

### Commit and hand off to execution

Once the check passes and the source is ready to commit:

```bash
cd "$MP_LAB" &&
git add docs &&
git commit -m "Record reviewed quotation design and execution readiness" &&
git rev-parse HEAD
```

Run that commit only when there are intended planning changes; if they are already committed, inspect status and record the existing HEAD instead of manufacturing a change. Preserve the earlier initial lab SHA for the run history, and record this latest approved committed revision as the **execution baseline**. Readiness is tied to file contents; committing the readiness record does not change those inputs. Do not edit accepted decision-bearing files afterward without following the refresh rules.

Now follow [step 4](#4-execute-the-ticket-graph) to start a fresh coordinator. Supply the execution baseline, spec, accepted design/readiness record, tracker root and project contracts. Include the actual existing authorization. It launches A/B in isolated worktrees and C only after verified A+B integration; it does not ask you to launch each ready ticket manually. Planning can keep its conversation, but workers and reviewers use fresh sessions.

At the observation checkpoint verify actual run IDs, models and worktree paths before releasing A/B. The coordinator rechecks readiness before dispatch and integration. `frontier.mjs` checks dependencies only; it does not invoke the design check or launch a worker. Continue through [final inspection](#5-inspect-the-result) and the failure exercises before deciding whether the workflow PRs are ready.



## 4. Execute the ticket graph

### First, inspect the frontier yourself

```bash
node "$MP_SKILLS/scripts/frontier.mjs" \
  "$MP_LAB/.scratch/quote-demo/graph.json"
```

Expected result:

```json
["A", "B"]
```

C must not be included. The graph is an export of ticket state. Have the coordinator regenerate it after transitions; do not independently edit it to unblock a ticket.

### Start the coordinator

Start one fresh Claude Code session inside Paseo for the lab, using your planning/coordinator profile. Continue only after the human has actually accepted the current design and plan and the readiness check passes. Supply this prompt with the two absolute paths and the approved execution baseline SHA filled in:

```text
Read /ABSOLUTE/SKILLS/PATH/skills/engineering/implement-spec/SKILL.md and follow it
for /ABSOLUTE/LAB/PATH. Resolve skill references relative to their files.

Use the agreed spec at docs/specs/quote.md and the canonical tracker path in AGENTS.md.
Read project tracker, delegation and testing configuration. Verify the recorded human
acceptance of the current spec, design and three-ticket plan. Do not invent approval
or reconfirm an existing decision that covers the current inputs.

Use the configured Paseo implementation and independent review profiles.
Maximum two implementation workers. You are the sole tracker and integration writer.
Do not implement code yourself. Never have a worker dispatch its own review.

Create a dedicated integration branch/worktree from the approved execution baseline
commit APPROVED_EXECUTION_BASELINE_SHA. Confirm it matches the accepted inputs.
For this first supervised run, launch A and B into separate worktrees and ask both to
pause before editing until I have inspected their run IDs, base revisions, worktree
paths and effective models. This is an observation checkpoint, not a new requirement.

Once I release them, continue the graph automatically through committed verification,
two-axis review and serial integration. Do not launch C before verified integration
of A and B. Use the lab evidence runner for committed checks. Record every transition.

Use only local delivery for this disposable lab. Do not create a remote repository,
push, merge main, or delete worktrees/evidence before I inspect the results.
If a capability cannot be verified or a required check fails, record the blocker.
```

### At the observation checkpoint

Inspect both workers in Paseo and run this in the original lab terminal:

```bash
git -C "$MP_LAB" worktree list --porcelain
```

Record these observations:

| Check | Expected |
| --- | --- |
| Worker identity | Distinct A and B run IDs |
| Worktree | Distinct absolute directories and branches |
| Base | Both start from the approved integration revision |
| Implementation model | The effective configured implementation family, not just its label |
| Tracker | Both claimed once; C still unclaimed |
| Ownership | Only coordinator edits tracker/integration |
| Source | No worker writing in another worker's checkout |

Then release both:

```text
The observation checkpoint is complete. Release A and B and continue automatically
within the configured limits. Record worker, review and integration evidence.
Pause only for a genuine blocker, required human decision or the final inspection.
```

This is the only intentional launch checkpoint. You should not need to type “run the next ticket” for C. If you do, the automatic frontier loop did not pass its intended validation.

### What to watch as work progresses

A and B may finish at different times. That is normal. Their implementation periods should overlap in this deliberately staged run. The exact completion order does not matter.

The coordinator must collect a **commit SHA**, not just a final chat message. It must arrange two review sessions with the role briefs, exact source/diff and relevant spec/standards. It must preserve failed results and use the configured retry budget.

For B's integration after A, or vice versa, expect a new combined candidate and evidence for both implemented seams. C's starting revision should contain both accepted modules. When C finishes, final acceptance requires all suites plus review of the full diff from the original baseline.

### Run the committed verification helper yourself when needed

Set `MP_CANDIDATE` to the actual worktree path shown by the coordinator:

```bash
export MP_CANDIDATE="/absolute/path/to/candidate-worktree"
node "$MP_SKILLS/examples/validation-lab/verify.mjs" \
  "$MP_CANDIDATE" unit "$MP_LAB/.scratch/quote-demo/evidence"
```

Profiles are `unit`, `integration`, `e2e`, `combined-ab` and `all`. Use `all` for the final result. The helper prints a JSON manifest and creates a unique evidence directory containing stdout/stderr logs. It returns a nonzero exit for failed tests, timeouts, dirty source or a changed HEAD.

Use an ignored evidence directory or one outside the candidate. Putting evidence in an unignored source directory dirties the candidate and correctly fails verification. The helper runs the supplied acceptance suites; if you add other required checks, extend the project contract and run/preserve those too.


## 5. Inspect the result

Ask the coordinator for the final integration worktree path, SHA, original baseline SHA, all ticket records, review artifacts and verification manifest locations. Do not accept “all green” without those pointers.

### Inspect behavior

Create a catalog outside the candidate source checkout:

```bash
cat > "$MP_LAB/.scratch/quote-demo/catalog.json" <<'JSON'
[{"sku":"PEN","name":"Bolígrafo","unitPriceCents":1250}]
JSON
node "$MP_CANDIDATE/src/cli.mjs" \
  "$MP_LAB/.scratch/quote-demo/catalog.json" PEN 3
```

Expected: exactly the JSON quote shown in [the lab introduction](#what-you-will-build), exit code 0, no stderr. Use the E2E suite for the formal assertions; visual output alone is not sufficient.

### Inspect verification and source

```bash
node "$MP_SKILLS/examples/validation-lab/verify.mjs" \
  "$MP_CANDIDATE" all "$MP_LAB/.scratch/quote-demo/evidence"
git -C "$MP_CANDIDATE" status --short
git -C "$MP_CANDIDATE" log --oneline --graph --all
```

Expected: manifest `passed: true`, required tests executed, clean candidate, and history retaining both parallel changes. Compare the manifest's head with the final revision in the tracker and review reports.

### Capture a full review target

Use the approved execution baseline SHA from the architecture handoff (the coordinator’s original integration base), not the earlier initial scaffold baseline or a branch name that may move:

```bash
export MP_BASELINE="paste-the-approved-execution-baseline-SHA"
node "$MP_SKILLS/scripts/review-target.mjs" \
  --repo "$MP_CANDIDATE" --base "$MP_BASELINE" --head HEAD
```

The helper prints the temporary artifact directory. Read its manifest and diff. The diff should include pricing, catalog and CLI. Reviewers must receive these artifacts and the candidate source at that revision. Preserve the artifacts in the evidence store before temporary-directory cleanup.

A successful capture is **not** review approval. You still need both review results, verified model independence and dispositions for blocking findings.

### Complete the tracker

For each ticket, record its integrated SHA, successful verification and both review results, plus previous failures/repairs. The local lab can consider work resolved after final accepted integration. On a GitHub project whose lifecycle requires merging a PR, leave closure to that configured lifecycle.

After inspection, authorize cleanup of only clean, inactive lab worktrees whose commits/evidence are retained. Keep the original lab directory and report until the skills PR is accepted. Do not use `git clean -fd`, a hard reset or indiscriminate branch deletion as a cleanup shortcut.


## 6. Exercise failure paths

The happy path is necessary but insufficient. Run these exercises in isolated probe worktrees or a fresh numbered lab. Never inject a fault into an active worker/reviewer checkout. Record the candidate SHA before each exercise and stop competing writers first.

### N1. Dirty review target

After a valid final candidate exists, create a separate probe worktree:

```bash
git -C "$MP_LAB" worktree add --detach \
  "$HOME/code/quote-review-probe-01" FINAL_INTEGRATION_SHA
export MP_PROBE="$HOME/code/quote-review-probe-01"
printf 'uncommitted review probe\n' > "$MP_PROBE/review-probe.txt"
node "$MP_SKILLS/scripts/review-target.mjs" \
  --repo "$MP_PROBE" --base "$MP_BASELINE" --head HEAD
```

Expected: nonzero exit and a dirty-worktree message, no successful review capture. Stage `review-probe.txt` with `git add` and repeat: still rejected. To test an unstaged tracked edit, remove/reset only this explicitly created probe file in the disposable checkout, then append a line to its tracked `GLOSSARY.md` and repeat. Inspect each change; do not use broad cleanup commands on other work.

The automated package tests cover staged, unstaged and untracked cases too. This exercise confirms the coordinator does not bypass the guard by reviewing an old clean commit elsewhere and calling the dirty candidate approved.

### N2. Failing test gate

In another disposable final-candidate worktree, ask the implementation profile to introduce an explicit temporary fault: calculate the three-pen example as 3751 instead of 3750. Commit that fault; do not alter the tests.

Run profile `all`. Expected: exit nonzero, `passed: false`, failure logs retained. Give that candidate to the coordinator as a rejected probe, not as authorized production work. It must keep the ticket unresolved, arrange repair if asked and not unblock dependents from the failed revision. A later repair gets a new commit and new verification/review evidence.

This tests the difference between a test failure and an environment failure. Both block the gate, but their recorded reasons should differ.

### N3. Missing or cancelled review axis

In a fresh supervised review, ask the Standards worker to pause before producing its report. Record its run ID, then stop that specific worker using the Paseo UI or documented CLI. Leave the Spec result available.

Expected: the report says Standards incomplete/cancelled and does not synthesize an overall pass. A replacement worker must be fresh, use the independent profile and receive the same immutable target if it has not changed. If the original worker already completed, the cancellation drill was not executed; repeat with an observable checkpoint.

### N4. Wrong model family

Create a temporary review profile using the same family as the implementation profile, and ask the coordinator to inspect it before launching the review. Do not overwrite your normal review profile.

Expected: the coordinator rejects that profile for this candidate, records why and selects a compliant configured alternative or pauses. The review must not pass merely because the profile's label says “review.” If a provider fallback occurs after launch, inspect the actual session again.

### N5. Dependency and claim checks

Copy the normalized graph to a separate probe file, leaving the real tracker unchanged. Test one mutation at a time:

| Probe | Expected helper result |
| --- | --- |
| A in `review`; B ready; C blocked by A+B | Only B ready |
| A ready but has a nonempty `claim` | A omitted from ready results |
| C depends on a nonexistent ID | Nonzero exit: unknown blocker |
| A depends on C while C depends on A | Nonzero exit: cycle |
| A says integrated without verified SHA fields | Nonzero exit: invalid completion |

The helper validates structure, not the truth of a fabricated SHA. Verify real Git/CI evidence separately. Never set `verified: true` just to make the helper return the ticket you want.

### N6. Restart the coordinator without duplicate work

Use a new lab run. At the A/B observation checkpoint, ensure run IDs, ownership and branch paths are persisted. End or detach from the coordinator session while keeping the worker sessions observable. Do not restart the entire Paseo daemon for this exercise.

Start a fresh coordinator with the same skill and project pointers:

```text
Resume this effort from the canonical tracker. Before launching anything, reconcile
recorded worker IDs against Paseo and their branches against Git. Establish whether
the previous coordinator is still active. Do not steal ownership from a live or
unknown coordinator and do not duplicate a claimed worker. Report your reconciliation.
```

Expected: it checks live state, establishes single ownership and reuses/collects existing runs. If worker sessions stopped with their parent on your provider/version, record that observed behavior and resume explicitly; do not claim workers survived. An uncertain run remains a blocker until reconciled.

### N7. Merge conflict and changed-target review

In a separate lab, add an explicit temporary test requirement that A and B each add its own distinct, required note to the same line of a tracked `docs/demo-notes.md`. Create that one-line file in the baseline before dispatch. Both notes must survive final integration.

This deliberate overlap is for testing conflict handling; it is not a recommended ticket design. When the second branch is combined, inspect the conflict. The coordinator must resolve by preserving both requirements, create a new combined revision, run affected checks and refresh review. Blindly choosing one side or reusing approval for the pre-merge head fails the exercise.

If the merge happens cleanly, the conflict scenario was not triggered. Record it as not exercised rather than passed, then repeat with changes that actually overlap. Keep this drill separate from the standard three-ticket graph.

### N8. Unavailable environment and retry budget

Temporarily declare a required verification environment unavailable in a fresh lab's project testing contract. Ask the coordinator to run that gate. Expected: blocked/unverified, not “skipped, therefore passed.” Restore availability only through an explicit recorded change.

For bounded retries, use a controlled failing candidate and tell the implementation workers to report the failure without changing it. With two repair attempts configured, the coordinator must pause after those two repair attempts fail; it must not launch an endless sequence. Record the original attempt separately from repair attempts 1 and 2.

This exercises scheduling and reporting. It does **not** prove real database lease recovery; that needs an application adapter with a real shared resource.


### Design and language failure exercises

Run destructive edits only in a disposable copy/branch and retain the failing outputs. Restore the original bytes afterward; never erase a real user's work to make a check pass.

| Exercise | Action | Expected result |
| --- | --- | --- |
| Draft cannot dispatch | Check the scaffold readiness record | Nonzero; no workers launched |
| Missing requirement | Remove R4 from the coverage table before review | Reviewer flags omission; syntax validation alone may still pass |
| Contradictory responsibility | Propose that catalog prints JSON/errors directly | Reviewer challenges conflict with CLI ownership/output contract |
| Stale decision | After a real acceptance, change design/model/spec | Helper rejects stale input; affected work pauses |
| Failed reviewer | Cancel one design-review session | Record stays incomplete; no synthetic pass |
| Same-family review | Configure author/reviewer with same family | Coordinator rejects effective settings; helper rejects matching recorded families |
| Missing environment | Remove required model tooling/profile | Record limitation/incomplete gate; do not claim success |
| Material implementation change | Worker proposes a remote price service | Return to design/human decision before affected work continues |
| Routine internal change | Worker renames a private local variable | Normal code review; no new architecture decision |
| Final reconciliation | Compare accepted design with final integrated source | Record observed state and any superseded decision; tests/reviews remain tied to source SHA |

Final reconciliation can change overview text and hence its fingerprint. Preserve the pre-implementation acceptance record and its source revision as history; do not overwrite it as though it approved later text. If further work is dispatched, record acceptance/targeted review of the updated design first. Pure status documentation at delivery can be reviewed in the final PR without reopening an unchanged product decision.

Use [ARCHITECTURE-VALIDATION.md](ARCHITECTURE-VALIDATION.md) to record actual results. Separate package tests, model validation and live model/Paseo behavior. A green package test suite does not prove independent agents caught the deliberate omission.

### Language exercise: understandable and still precise

Use the [shared plain-language policy](../skills/engineering/_shared/PLAIN-LANGUAGE.md) in the existing planning and comprehension-review sessions. This adds no separate review stage or automated gate.

1. Give the planner this deliberately unclear question: “Should the catalog adapter own error serialization at the process boundary?” Ask it to rewrite the question so a shop operator can understand the decision, with distinct options and their consequences. It must explain that the lab's spec already assigns output behavior; it must not ask the human to approve the same decision again or silently change it.
2. Give it this sentence: “The CLI must emit diagnostics on stderr, suppress stdout, and terminate with status 1 on user/data errors.” Ask for a plain-language rewrite. Check that it retains **all three** outcomes and the condition under which they apply. Keep exact stream names and the exit code, explaining them if necessary.
3. Ask the existing comprehension reviewer to explain the proposed responsibilities and one failure path without the author's conversation. Have it identify any wording that required guessing and any meaning lost during simplification.
4. For `to-questionnaire`, request an asynchronous questionnaire from the same context. Check that known answers are reused, each question asks one thing and conditional questions are marked. The document can contain more than three questions; the short-round limit applies to live chat.
5. Read the result yourself. Can you explain what will be built, why the main choices were made and what still needs your decision? Record unclear passages as feedback in the existing review report.

Do this before freezing the final design inputs. Later wording changes still follow the existing fingerprint-refresh rules. A clear-sounding sentence is not proof that it preserves the requirement. Record this exercise as NOT RUN until you actually perform it; offline package tests cannot establish reader comprehension.


## 7. Evaluate the framework

Use the [workflow report](VALIDATION-REPORT.md) and, for the combined framework, the [architecture report](ARCHITECTURE-VALIDATION.md). Complete the copies in your run's tracker directory, not the package templates. An agent can help assemble evidence; you own the assessment. Keep these outcomes distinct:

- **PASS:** required behavior was observed with evidence.
- **FAIL:** observed behavior violated the contract.
- **NOT RUN:** the check was not performed.
- **BLOCKED:** a prerequisite prevented it, such as missing tools, credentials or environment.

Do not convert NOT RUN into PASS because the agent says it would work.

| Acceptance area | Required evidence |
| --- | --- |
| Exact version | Skills commit, lab baseline and installed tool/model versions |
| Installation | Package provenance; expected skills available without shadowing |
| Planning | Optional rehearsal results, explicitly labeled if omitted |
| Delegation | Actual run IDs, effective providers/models, explicit role briefs |
| Parallelism | A/B overlap and distinct worktrees; no competing writers |
| Dependencies | C starts only after verified A+B integration |
| Test policy | Correct ticket-specific suites and full final acceptance |
| Review | Separate axes, independent families, exact base/head and dispositions |
| Integration | Serial updates; refreshed evidence for combined revisions |
| Failure handling | Dirty work, failed tests and cancelled axes do not pass |
| Recovery | No duplicate worker on coordinator resumption |
| Limits | Model/permissions/resource gaps recorded rather than hidden |

For initial approval of the orchestration PR, treat live installation, A/B→C execution, independent review, failure gating and restart reconciliation as required. A planning rehearsal is optional for that narrow acceptance, but required if you want to claim the whole SWE-cycle walkthrough has been validated. Real shared-service leasing remains outside this local-filesystem exercise.

A successful local lab supports accepting the workflow on the tested host/configuration. It is not a universal compatibility claim for all models, Windows-native paths or remote hosts.

To share results with the PR, copy a concise report into a PR comment or a committed report file after checking logs for credentials/private paths. This guide does not automatically publish your logs. Cite the skills SHA and attach/link the relevant evidence; a screenshot of a green final chat alone is insufficient.

### Report a problem before finishing the run

You can provide useful feedback at any stage. For each finding record skills SHA, host/tool versions, section/prompt, expected behavior, actual behavior, minimal reproduction, run/ticket IDs, relevant candidate SHA, evidence location and impact. Include confusing instructions as findings even if execution eventually succeeds. Retain failures instead of replacing them with successful retries. Remove secrets before sharing.

### Make the decision explicit

| Decision | Meaning | Record |
| --- | --- | --- |
| Lab design acceptance | You authorize the exact reviewed proposal and A/B/C plan | Actual decision reference and input identities in the readiness record |
| Framework recommendation | You assess observed behavior on this configuration | Both live reports, failures, limitations and proposed PR action |
| Repository merge authorization | Maintainer follows ordinary PR review/CI/authorization | PR decision; a lab report alone does not grant it |

A recommendation can say:

```text
Validated skills SHA: <actual SHA>
Host / tools / effective models: <record or report link>
Scope exercised: <orchestration / architecture / whole SWE cycle>
Observed results and evidence: <report and artifact locations>
Blocking defects: <list, or none observed within the tested scope>
NOT RUN / BLOCKED checks and limitations: <list>
Recommendation: <keep draft / request fixes / ready for maintainer decision>
Assessed by: <human and date>
```

For combined-framework acceptance, include both design-readiness and execution/recovery results. For whole-cycle claims, also complete the research/grilling rehearsal and applicable questionnaire/language checks. A partial run can support feedback or a narrower recommendation, but cannot certify unperformed gates. Preserve artifacts before allowing cleanup; final archival policy improvements remain tracked in [Issue #3](https://github.com/netname/pi-adapted-mp-skills/issues/3).

