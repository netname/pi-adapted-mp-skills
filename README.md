# pi-adapted-mp-skills

Matt Pocock's development workflow adapted for Pi, with Paseo coordinating fresh research, implementation and independent review sessions.

**0.2.0, unreleased.** This is a selective upgrade to [upstream v1.3.1](https://github.com/mattpocock/skills/tree/v1.3.1), not a wholesale rebase. Source pins remain in each skill. See [migration](docs/MIGRATION-0.2.md), [workflow](docs/WORKFLOW.md) and [changelog](CHANGELOG.md).

## Documentation map

There are two things to understand: **this repository's development workflow** and **the independent quotation CLI built to validate it**. The workflow coordinates planning, implementation and review; the quotation application only reads local JSON and returns a quote. **Start here if you are new:** read the manual's [nine stages](docs/MANUAL.md#why-each-stage-exists), [project folders and artifact walk-through](docs/MANUAL.md#where-the-projects-and-artifacts-live), and [skills/scripts explanation](docs/MANUAL.md#written-procedures-and-executable-checks-how-they-work-together). Then follow its [first-time validation route](docs/MANUAL.md#validate-the-framework-for-the-first-time) in order.

### What each document is for

| Document | Purpose | Use it when you need to… |
| --- | --- | --- |
| **README** (this page) | Entry point and documentation map | Choose where to start and find the document that answers your question |
| [WORKFLOW](docs/WORKFLOW.md) | Explain the overall process, responsibilities, handoffs, gates and their reasons | Understand **why** planning becomes verified software and what each owner does |
| [ARCHITECTURE-GUIDE](docs/ARCHITECTURE-GUIDE.md) | Explain how to prepare, inspect, review and accept design artifacts | Carry out **Stages 3–5** and hand an accepted plan into implementation |
| [MANUAL](docs/MANUAL.md) | Beginner's reference for stages, folders, artifacts and tools; installation and step-by-step validation | Learn the vocabulary, then **run** the complete worked example and assess the framework |
| [Skills](skills/) and [shared policies](skills/engineering/_shared/) | Give agents precise role procedures and cross-cutting rules | Inspect the instructions that planners, coordinator, workers and reviewers must follow |

After the manual's beginner reference, read the [workflow overview](docs/WORKFLOW.md#solution-overview) and [planning/execution explanation](docs/WORKFLOW.md#planning-and-execution) for the reasons behind each handoff. Follow the manual's numbered route for actions and use the architecture guide for its design exercise. Skill procedures complement these human-facing explanations.

**Shared lifecycle names:** 1 Discover and clarify → 2 Specify → 3 Design and review → 4 Plan and authorize → 5 Check readiness → 6 Implement → 7 Review and integrate (repeat 6–7 as needed) → 8 Verify complete change → 9 Evaluate and decide. The [manual's numbered diagram and artifact/action table](docs/MANUAL.md#the-process-has-two-connected-loops) and [workflow's owner/gate table](docs/WORKFLOW.md#stages-owners-and-completion-conditions) use these same names. The manual's ten validation steps and numbered sections are **instructions for the example**, not another lifecycle. Setup and report preparation come before the lifecycle exercise.

**To run the worked example and review the framework, start at [First-time validation route](docs/MANUAL.md#validate-the-framework-for-the-first-time).** It takes you through setup, design review, execution and failure drills, and tells you when to fill the two reports. The manual is the procedure; the reports record your observations.

### Find an answer or operation

| Your question / task | Read here | Continue with |
| --- | --- | --- |
| What are we building, why, and how do the workflow components cooperate? | [Workflow solution overview](docs/WORKFLOW.md#solution-overview) | [Manual process overview](docs/MANUAL.md#overview-from-a-need-to-a-change-you-can-accept) |
| How does planning become verified software, and why are the gates needed? | [Planning and execution](docs/WORKFLOW.md#planning-and-execution) | [Stage inputs, owners and completion conditions](docs/WORKFLOW.md#stages-owners-and-completion-conditions), then the linked operating instructions |
| What are `.scratch/quote-demo`, the map, decision tickets and research notes? | [Effort directories](docs/MANUAL.md#what-to-call-a-folder-under-scratch) | [Artifact walk-through](docs/MANUAL.md#how-the-artifacts-answer-different-questions) and [Wayfinder's map](skills/engineering/wayfinder/SKILL.md#the-map) |
| Why do `docs/agents/architecture.md`, `docs/architecture/overview.md` and `docs/designs/quote.md` differ? | [Project folder table](docs/MANUAL.md#where-the-projects-and-artifacts-live) | [Architecture artifact map](docs/ARCHITECTURE-GUIDE.md#4-artifacts-and-their-relationships) |
| Which skills and `.mjs` scripts run at each stage? | [Script input/output and timing](docs/MANUAL.md#who-creates-and-handles-the-mjs-files) | [Skill-to-stage map](docs/MANUAL.md#match-each-skill-to-its-purpose) |
| What is the quotation application, and what are its components responsible for? | [Application overview template](examples/validation-lab/template/docs/architecture/overview.md) | [Authoritative quote spec](examples/validation-lab/template/docs/specs/quote.md) and [worked design exercise](docs/ARCHITECTURE-GUIDE.md#6-worked-example-understand-the-quotation-tool) |
| Who decides, drafts, reviews, records evidence and launches work? | [Owners and handoffs](docs/ARCHITECTURE-GUIDE.md#2-who-does-what) | Project `docs/agents/` contracts, configured during setup |
| What design work is required, who performs it, and where do the results go? | [Required design work and artifacts](docs/ARCHITECTURE-GUIDE.md#3-choose-an-appropriate-amount-of-design) | [Path and artifact map](docs/ARCHITECTURE-GUIDE.md#4-artifacts-and-their-relationships) |
| How do I install and configure the host/package? | [Manual host setup](docs/MANUAL.md#4-prepare-the-execution-host) | [Combined-framework checkout](docs/MANUAL.md#5-check-out-the-exact-pr-not-the-default-branch), then [project setup](docs/MANUAL.md#7-configure-each-software-project) |
| In what order do I perform design review and start workers? | [Operational route and completion checks](docs/ARCHITECTURE-GUIDE.md#operational-route-and-completion-checks) | Its linked commands/prompts, then [coordinator execution](docs/MANUAL.md#12-execute-the-graph-and-observe-it) |
| How do I validate, inspect failures and decide whether to accept the PRs? | [Lab introduction](examples/validation-lab/README.md), [final inspection](docs/MANUAL.md#13-inspect-the-final-result) and [failure drills](docs/MANUAL.md#14-negative-exercises-prove-failures-remain-failures) | [Workflow report](docs/VALIDATION-REPORT.md) and [architecture report](docs/ARCHITECTURE-VALIDATION.md) |
| What changed from the previous package? | [Migration](docs/MIGRATION-0.2.md) and [changelog](CHANGELOG.md) | Historical documents only for provenance, not current operating instructions |

The [lab generator](examples/validation-lab/README.md) creates a separate repository beside the skills checkout. Application paths in the guide refer to that generated repository; the links above open the source templates in this package. The lab requires no application runtime service or npm dependency. Its generated architecture is a proposal, and its readiness record starts as draft; creating files does not establish review or acceptance.

## Start

Install the complete package from a checked-out version you intend to use:

```bash
pi install /absolute/path/to/pi-adapted-mp-skills
```

After this change is merged, the repository install picks it up:

```bash
pi install git:github.com/netname/pi-adapted-mp-skills
```

There is no claim that 0.2.0 is published to npm. Do not also install duplicate skill copies. The package includes role briefs, scripts and sidecars; copying SKILL.md alone is insufficient.

Run `/skill:setup-matt-pocock-skills` in the target project. It configures the tracker, domain docs, delegation profiles and testing contract. `/skill:ask-matt` routes uncertain work.

| Need | Skill |
| --- | --- |
| Resolve a large set of planning decisions | `wayfinder`; loop ready research, pause for human decisions |
| Clarify a change | `grill-with-docs` |
| Publish requirements | `to-spec` |
| Explain and independently review the design | `design-solution`, `review-design` |
| Approve the dependency graph and requirement coverage | `to-tickets`, then final design/plan readiness check |
| Execute the graph without launching tickets manually | `implement-spec` |
| Implement one ticket | `implement` |
| Independently review a committed candidate | `code-review` |
| Write delivery evidence / improve the workflow | `pr` / `retro` |

The remaining diagnosis, architecture, productivity and guardrail skills remain available under `skills/`. There are 30 skills; the obsolete conflict-resolution skill is retired.

## Roles and prerequisites

Use Paseo profiles to choose actual providers/models on your host. A useful starting point is Claude Code for planning and both review axes, with Pi/DeepSeek for implementation. The reviewer family must differ from **all** implementation families in its candidate. The harness name alone does not establish independence. No model subscriptions or global packages are changed by this package.

Paseo delegation and primary-source access are required only by work that uses them. Planning works without those capabilities. `pi-subagents` and `pi-web-access` are no longer mandatory. The files in `agents/` are portable task briefs passed explicitly by the coordinator; they are not registered Pi subagents or automatically discovered Paseo profiles.

Enable Paseo tools on the host or use its CLI. See [Paseo orchestration](https://paseo.sh/docs/orchestration) and [agent profiles](https://paseo.sh/docs/agent-profiles). This package remains Pi-native: it does not automatically install skills into Claude Code. Supply relevant project instructions and role briefs explicitly to delegated sessions.

## Tests and helpers

The execution helpers support Node.js 20+ and Git. Use Node 24 LTS for the full validation walkthrough and check the installed agent CLIs' requirements. Execution helpers remain dependency-free; package validation uses a pinned development-only YAML parser.

```bash
npm ci
npm test
npm run smoke
node scripts/frontier.mjs /path/to/graph.json
node scripts/review-target.mjs --repo /absolute/worktree --base BASE --head HEAD
```

The frontier helper validates dependencies and prints ready IDs. The review helper rejects staged, unstaged and untracked work, pins commits, and writes a manifest/diff outside the worktree. Neither is a standalone background scheduler. `implement-spec` drives the loop through Paseo, with durable state in the tracker.

`npm run drift` compares against the v1.3.1 baseline, including deliberate adaptations and skills still sourced from the original pin. It is a review aid, not proof that everything was upgraded. After `npm ci`, `npm test` is offline; live Paseo acceptance is documented separately.

MIT. Original methodology © Matt Pocock; attribution and source pins in [NOTICE](NOTICE). Historical v0.1 docs remain for provenance and are explicitly superseded by the current workflow.
