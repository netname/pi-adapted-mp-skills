# First quotation lab: Windows and an Ubuntu host

Follow this page in order for your first run. You will use Paseo on Windows to direct Claude Code and Pi on Ubuntu. The example host is `sen03`, the Ubuntu user is `netname`, and all project files live on Ubuntu. Substitute your own SSH destination and home directory if different. Commands labelled **Windows** are PowerShell; commands labelled **Ubuntu** run after SSH connects. Text labelled **Paseo chat** goes into the selected agent conversation, never into a terminal.

The goal is a tiny quotation program: a catalog lists a PEN priced at 1250 cents; asking for three prints a quote totaling 3750 cents. You will first inspect the proposed design, then watch two independent tasks run before a third combines them. Model calls use your existing subscriptions or API accounts and may incur charges.

This page covers one successful supervised run. The [full validation reference](PR-VALIDATION.md) contains additional failure/recovery exercises; complete those afterward before claiming full framework validation. Your first run is not evidence for checks you have not performed.

## Keep these four things separate

| Name | Meaning in this walkthrough |
| --- | --- |
| Host | `sen03`, the Ubuntu computer running Paseo and the agents |
| Skills checkout | `/home/netname/code/pi-skills-validation-01`, instructions and helpers used by agents |
| Lab project | `/home/netname/code/quote-workflow-lab-01`, the separate application they will build |
| Profile | Saved provider/model/settings, used to create a fresh agent session |

Claude Code and Pi are agent tools that call models. Paseo starts and displays their sessions. A saved profile is not a running session. The human accepts the design; the coordinator session manages tickets and workers. A/B/C are task names, not model names. Git commits identify exact saved versions; the long identifier is called a SHA.

If someone already prepared the host or lab, verify that work in steps 1–4 and continue at the first incomplete checkpoint. Do not clone over an existing checkout or regenerate an existing lab. Keep a short note of your current step, paths and session IDs under the lab's ignored `.scratch/quote-demo/` directory after it exists.

| Steps | You should finish with |
| --- | --- |
| 1–4: host and lab | Working SSH/tools, recorded package revision and a registered lab |
| 5–7: profiles and sessions | Four saved profiles, real diagnostic runs and committed lab configuration |
| 8–9: design | Understandable preview/sequence views, independent reports and your actual decision |
| 10–11: implementation | Verified integrated code, reviews and a manual demonstration |
| 12: assessment | Evidence retained; performed and unperformed checks distinguished |

Some failures are intentional only at a particular stage:

| Observation | Before implementation | At final delivery |
| --- | --- | --- |
| Missing `src/` modules / failing application acceptance tests | Expected scaffold state; record stage rather than repairing by changing tests | Failure; implementation/checks need repair |
| Draft readiness check fails | Expected until real review and acceptance are recorded | Must have passed before affected worker dispatch |
| Package tests, provider sign-in or required rendering fail | Setup/review blocker | Still a blocker; never assume a pass |

## 1. Connect to Ubuntu and check the tools

**Where / who:** Windows PowerShell, you.

```powershell
ssh sen03
```

**Expected:** an Ubuntu shell for your development user. Run:

```bash
hostname
whoami
pwd
export PATH="$HOME/.local/bin:$HOME/.pi/agent/bin:$PATH"
git --version
node --version
npm --version
pi --version
claude --version
paseo --version
```

**Expected:** the correct host/user and a version for each tool. Node 24 LTS is the walkthrough's baseline. The PATH line affects this shell and supports both common Pi installation locations; it does not change an already running Paseo service.

**If different:** a timeout means fix SSH/network access first. `command not found` means locate/install that tool before continuing. A machine starting from zero must complete the manual's [host installation instructions](MANUAL.md#prepare-the-execution-host), then return here. Already installed tools need no reinstallation. Keep this SSH terminal open for the Ubuntu commands below. A new terminal needs the PATH and variable assignments again.

## 2. Check Paseo and both providers

**Where / who:** Ubuntu terminal, you.

```bash
paseo status --json
paseo provider ls --json
```

**Expected:** Paseo reports `running` and `reachable`; both `claude` and `pi` become `available`. A brief `loading` status can occur while discovery finishes: rerun the provider command. `available` establishes discovery, not successful model authentication; step 6 checks actual sessions.

**If different:** for a stopped daemon run `paseo daemon start --timeout 30`, using its saved settings, then repeat the checks. If it reports a live but unready process, inspect the reported log/status instead of launching another one. If a provider is missing:

```bash
paseo provider diagnostic claude
paseo provider diagnostic pi
```

Compare the resolved paths with `command -v claude` and `command -v pi`. If they differ, use the official [provider-path repair instructions](https://paseo.sh/docs/troubleshooting#paseo-cant-find-my-provider); do not reinstall tools merely because the daemon has a different PATH. Run `claude` or `pi` directly on Ubuntu when sign-in is required, follow that tool's login flow, then return. Keep secrets out of chats and evidence files. Stop here until both providers work.

## 3. Obtain and verify the skills checkout

**Where / who:** Ubuntu terminal, you.

```bash
export MP_SKILLS="$HOME/code/pi-skills-validation-01"
export MP_LAB="$HOME/code/quote-workflow-lab-01"
printf 'Skills: %s\nLab: %s\n' "$MP_SKILLS" "$MP_LAB"
```

If the skills directory does not exist, run this block once:

```bash
mkdir -p "$HOME/code" &&
git clone --branch improve/architecture-design-review --single-branch \
  https://github.com/netname/pi-adapted-mp-skills.git "$MP_SKILLS"
```

For either a new or existing checkout, run:

```bash
git -C "$MP_SKILLS" branch --show-current
git -C "$MP_SKILLS" status --short
git -C "$MP_SKILLS" rev-parse HEAD
cd "$MP_SKILLS" && npm ci && npm test
```

**Expected:** branch `improve/architecture-design-review`, no uncommitted package changes, and all package tests pass. Record the actual skills SHA and tool versions in your run notes. The number of tests can change. These tests check the skills package; the quotation application has not been built yet.

**If different:** stop on a wrong branch, dirty package checkout or failing tests. Preserve local edits and get help reconciling the checkout; do not reset it. If you deliberately update the package, finish that before recording the run's SHA. Keep that revision fixed for this run. These instructions evaluate an unmerged branch, not the default branch or an npm release.

## 4. Create or reuse the lab

**Where / who:** Ubuntu terminal, you.

For a **new** lab directory only:

```bash
node "$MP_SKILLS/examples/validation-lab/create.mjs" "$MP_LAB" &&
git -C "$MP_LAB" init -b main &&
cd "$MP_LAB" && pi install -l "$MP_SKILLS"
```

For an **existing** lab, skip that block. Verify its package registration instead:

```bash
cd "$MP_LAB" && pi list --approve
cat "$MP_LAB/AGENTS.md"
cat "$MP_LAB/docs/agents/architecture.md"
```

**Expected:** Pi lists the intended skills checkout under project packages. `AGENTS.md` identifies this lab and one canonical tracker path, normally `$MP_LAB/.scratch/quote-demo`. The spec, design, model and tests exist. The new scaffold has no `src/` application implementation; this is intentional. If an older lab already contains implementation or evidence, retain it and resume its recorded stage. A fresh run of a changed fixture uses a new numbered lab, with matching path assignments throughout this page.

Register the project with Paseo (registration does not launch an agent):

```bash
paseo project create "$MP_LAB"
```

If it is already registered, select the existing project rather than creating a second workspace. In a fresh lab copy these report templates once, before recording results:

```bash
cp -n "$MP_SKILLS/docs/VALIDATION-REPORT.md" \
  "$MP_LAB/.scratch/quote-demo/validation-report.md"
cp -n "$MP_SKILLS/docs/ARCHITECTURE-VALIDATION.md" \
  "$MP_LAB/.scratch/quote-demo/architecture-validation.md"
```

**If different:** `destination exists` from the generator is protection, not a failed lab to delete. Inspect what was created and resume the missing step. If a package was already registered, verify its path and avoid a duplicate. Do not overwrite completed report copies; `.scratch` is ignored by Git and needs separate retention. Other report filenames in an existing run are fine: keep their existing locations and references.

## 5. Connect Paseo Desktop and save four profiles

**Where / who:** Paseo Desktop on Windows, you. Host preparation is complete; profile configuration is part of this lab setup.

Open **Settings → Add host → Remote SSH** if `sen03` is not already saved. Enter `ssh://netname@sen03`, using the SSH alias/user that worked in step 1. Select that remote host and open the registered `quote-workflow-lab-01` project. The path must be `/home/netname/code/quote-workflow-lab-01`, not a Windows folder. SSH connects to the existing daemon; it does not start it. [Paseo SSH instructions](https://paseo.sh/docs/connectivity#ssh).

Open **Settings → sen03 → Agents → Agent profiles**. Select **New profile**, enter each name below, select its provider/model/settings, paste its notes into **When to use**, and **Save**. Create profiles in the host settings, not in a Claude chat.

| Name | Provider / model family | Starting mode and thinking | When to use |
| --- | --- | --- | --- |
| `mp-plan` | Claude Code / Claude | Always Ask; High thinking if offered, otherwise provider default | Plan and coordinate this lab. Preserve decisions; delegate implementation; own tracker and integration. |
| `mp-build` | Pi / DeepSeek | Default; High thinking if offered, otherwise provider default | Implement one assigned ticket in its worktree and return committed source/check evidence. No further delegation. |
| `mp-design-review` | Pi / DeepSeek | Default; High thinking if offered, otherwise provider default | Independently explain or challenge a Claude-authored design. Read inputs; no edits or tests. |
| `mp-code-review` | Claude Code / Claude | Plan Mode; High thinking if offered, otherwise provider default | Review a DeepSeek implementation on one assigned axis. Read-only inspection; no edits or tests. |

For a concrete starting selection, `sen03` discovery during preparation offered Claude `claude-sonnet-5-5` and Pi `deepseek/deepseek-flash`. Choose those only if your current picker offers them and your account can run them; otherwise choose an available model in the same family and record its exact ID. These are example settings, not promises of access or benchmark superiority. Read the supported mode description before saving; Always Ask can produce permission requests during coordination. Approve only actions you understand and that fit the task. A profile's notes do not enforce filesystem permissions.

Now open **Settings → sen03 → Agents**, enable **Paseo tools**, and use newly created sessions so they receive the tools. If that control is absent in your version, record the gap; the CLI route is available to an agent with shell access, but its discovery/launch check in step 6 must still pass. [Profile instructions](https://paseo.sh/docs/agent-profiles).

**Expected:** four saved profiles on `sen03`, with models actually available in its picker. Claude planning has independent DeepSeek design review; DeepSeek implementation has independent Claude code review. Each review axis will use a separate fresh session even when settings are reused.

**If different:** a model appearing in Pi but missing in Paseo needs provider diagnostics/refresh, not an invented ID. If the app cannot connect, repeat step 2 and verify the SSH destination. If a control differs, use installed help/official docs and record the actual version/settings. Stop before a real review if independence cannot be verified.

## 6. Prove each provider and one delegated child work

**Where / who:** Paseo Desktop, you create diagnostic sessions; agents only perform the checks requested here.

In the lab project choose the action to create a new agent, open its model picker, and select **Profiles → mp-plan**. Before sending anything, check host `sen03`, the lab directory, provider and exact model in the session settings. Paste:

```text
This is a setup check. Report your working directory, read AGENTS.md and
docs/architecture/overview.md, and summarize the proposed quotation app.
Do not edit files, run tests, create commits or launch other agents.
Report missing files honestly. Do not treat supplied drafts as accepted.
```

Create another **new** session with `mp-build` and send the same prompt. The exact creation button position can differ by Paseo version; selecting a profile in the model picker applies its saved settings. A running terminal opened with `claude` is not a Paseo-managed session.

**Expected:** both respond about the quotation lab. Inspect their effective provider/model and directory in Paseo's settings/status, not just their self-description. Record session IDs and actual settings in the report. A model listed by discovery can still fail due to sign-in, quota or endpoint errors; resolve those before continuing.

In the diagnostic Claude session paste:

```text
Inspect available Paseo tools or CLI help. Verify this host/workspace,
providers/models and saved profiles mp-plan, mp-build, mp-design-review and
mp-code-review. Report missing capabilities. Do not launch an agent yet.
```

Once discovery succeeds, send:

```text
Launch exactly one fresh Pi child with the verified mp-build settings in
this lab. Ask it only to read AGENTS.md and docs/architecture/overview.md
and summarize the proposed app. No edits, tests, commits or further agents.
Observe its completion, collect its actual output, and report its run ID,
effective model and workspace. Do not replace a child whose state is unknown.
```

**Expected:** you see the child, and the parent collects its real response. Archive the diagnostic sessions after completion; use a new planning session in step 7. **If different:** record a failed/incomplete preflight and inspect diagnostics. Never replace an unknown running child or proceed on assumed success.

## 7. Let a planning session finish the lab configuration

**Where / who:** new Paseo chat with `mp-plan`, agent prepares changes; you inspect them. The paths in this prompt match the example directories. Replace them if your actual paths differ.

```text
Read /home/netname/code/pi-skills-validation-01/skills/engineering/setup-matt-pocock-skills/SKILL.md
and apply it to /home/netname/code/quote-workflow-lab-01. Resolve references
from the skill directory. Treat Pi checks as checks of the worker environment.
Reuse the verified host/providers and saved profiles; inspect actual settings.
Record exact profiles, models, families, modes and thinking in
docs/agents/delegation.md. Do not invent settings or silently substitute models.
Preserve the supplied spec/tests/scope and canonical tracker in AGENTS.md.
Record preflight session evidence and missing capabilities in the lab reports.
No implementation, worker dispatch or human design acceptance yet.
Explain changes and remaining questions in plain language for my inspection.
```

**Expected:** the agent fills actual settings and explains remaining issues. The delegation document records profiles; it does not create them. You should understand who plans, who builds and who reviews. The Research row can use a separately verified source-capable profile; if research is not part of this first run, record it as unavailable/not exercised and do not dispatch it. Required implementation/review rows must be complete.

**Where / who:** Ubuntu terminal, you inspect and save setup:

```bash
cd "$MP_LAB" && git status --short && git diff
cat docs/agents/delegation.md
cat docs/agents/testing.md
cat docs/agents/architecture.md
```

Open any new file listed as `??` separately; `git diff` omits untracked contents. Once intended setup is correct, commit it and record the SHA as the **initial lab baseline**:

```bash
git add AGENTS.md CODING_STANDARDS.md GLOSSARY.md .gitignore .pi/settings.json docs package.json test &&
git commit -m "Configure quotation lab validation" && git rev-parse HEAD
```

If setup was already committed and there are no intended changes, record `git rev-parse HEAD` instead. Never make an empty commit to satisfy a step. `.scratch` evidence is not included: retain it separately. **If different:** get unclear changes explained before committing. No application source should be created during this step.

## 8. Inspect the design and the rendered sequence diagrams

**Where / who:** same planning chat, agent prepares an explanation; you review it.

```text
Read /home/netname/code/pi-skills-validation-01/skills/engineering/design-solution/SKILL.md
and follow it for /home/netname/code/quote-workflow-lab-01.
Explain the supplied spec and proposed changes C1-C3, expected code areas,
ownership, output examples and alternatives in plain language. Preserve R1-R4,
tests and exclusions. Keep current/proposed/unknown claims distinct.
Prepare readable component and success/failure sequence views from the shared
model. Point me to rendered views I can actually open. Identify unresolved
choices; do not implement or accept the design for me.
```

For an Ubuntu terminal preview, run:

```bash
cd "$MP_LAB/docs/architecture/model" &&
npx --yes --package=likec4@1.60.0 likec4 validate &&
npx --yes --package=likec4@1.60.0 likec4 start
```

**Expected:** validation succeeds and a preview URL is printed. That URL's `localhost` is Ubuntu. To view it from Windows, open another PowerShell terminal and forward the printed port, for example `ssh -N -L 5173:127.0.0.1:5173 sen03` if the preview uses 5173. Then open `http://localhost:5173` in your Windows browser. Use the actual port; if occupied choose another local port and match the browser URL. Keep the forwarding terminal open while viewing; Ctrl+C ends it. The preview also keeps its Ubuntu terminal busy; use another SSH terminal for commands. Stop the preview with Ctrl+C when finished.

Inspect `components`, `quoteSuccess` and `quoteFailure` alongside the design's C1-C3 table. Can you explain which component reads, which calculates, which prints, and why malformed JSON produces no quote? The agent records view IDs, source snapshot, commands and presentation evidence. If your browser cannot reach the preview, fix the tunnel/port before recording presentation as complete. A parsing pass alone does not establish visual review.

## 9. Obtain independent review, then make your decision

**Where / who:** planning chat, coordinator arranges review; you decide whether to accept.

```text
Read /home/netname/code/pi-skills-validation-01/skills/engineering/review-design/SKILL.md
and apply it to /home/netname/code/quote-workflow-lab-01.
Freeze the current spec/design/model/ADR/coverage and quote-plan.md inputs.
Launch separate fresh comprehension and challenge sessions using verified
mp-design-review settings, independent of every design author. Collect real
reports with run/model/input identities. Resolve blockers and preserve findings.
Check supplied tickets A/B/C and their coverage; do not create duplicate tickets.
Present what changes, success/failure behavior, alternatives, remaining decisions
and rendered views. Prepare readiness records from actual evidence, leaving
human acceptance pending. Do not start implementation.
```

**Expected:** two real reports, visible findings and resolutions, coverage of R1–R4, and an understandable proposal. The coordinator prepares fingerprints and JSON records for you; you do not need to calculate or hand-edit them. Ask questions or request changes if behavior is unclear. Review affected changes again before acceptance.

Only if it reflects your decision, say in that chat:

```text
I accept the current reviewed quotation design and A/B/C plan for this
disposable lab, preserving R1-R4 and the supplied exclusions. Record a durable
reference to this actual decision against the exact inputs I reviewed.
```

Then send:

```text
Complete the readiness record using the actual reports and my decision.
Run the design-check helper; report the actual outcome. If it passes, commit
the intended planning records and give me the approved execution baseline SHA,
canonical tracker root and evidence locations. Do not implement yet.
```

**Expected:** `ready: true` and a committed **execution baseline SHA**. This may differ from the initial scaffold baseline. An agent-written `accepted` word is insufficient. **If different:** a draft readiness check is expected to fail before real reviews/acceptance; afterward it must pass before dispatch. Missing reports, stale input hashes or unresolved blockers need resolution, not fabricated records. The helper checks record integrity, not consent or design quality.

## 10. Start one coordinator and inspect its two workers

**Where / who:** a **new** Paseo chat with `mp-plan`, you supply the accepted execution baseline. Replace `EXECUTION_SHA` below with the actual SHA from step 9 before sending.

```text
Read /home/netname/code/pi-skills-validation-01/skills/engineering/implement-spec/SKILL.md
and follow it for /home/netname/code/quote-workflow-lab-01.
Use the actual accepted design/plan/readiness and project contracts. Use the
original canonical tracker root from AGENTS.md; verify evidence before dispatch.
Create a dedicated integration worktree from EXECUTION_SHA. You are the single
coordinator and tracker/integration writer. Maximum two implementation workers.
Use verified mp-build settings and independent mp-code-review settings with
explicit role briefs. Do not implement the application yourself.
Launch A and B in separate worktrees, paused before editing so I can inspect
their run IDs, effective models, paths and starting revisions. Do not launch C
until both prerequisites are integrated and verified. After my release, run the
graph automatically through verification, independent review and serial integration.
Use local delivery only. No remote repository, push, merge main or evidence cleanup.
Pause for genuine blockers, required decisions, exhausted retry budget or final inspection.
```

**Expected:** the coordinator checks readiness and shows A and B as distinct sessions. Each has its own worktree, a separate checkout directory that prevents workers writing over one another. In Ubuntu:

```bash
git -C "$MP_LAB" worktree list --porcelain
```

Compare paths, actual models and starting revisions with the coordinator's report. C must remain unstarted. Record the inspection. If correct, send:

```text
The observation checkpoint is complete. Release A and B and continue within
the configured limits through C and final verification. Preserve evidence.
```

**If different:** keep affected workers paused and ask the coordinator to explain/fix the discrepancy. A/B can finish in either order. The coordinator should launch C without repeated human requests once both prerequisite integrations pass. Final checks may take several tool/model turns; inspect session status and logs rather than launching a duplicate coordinator. A permission request from Always Ask is distinct from a new product decision.

## 11. Inspect the completed result

**Where / who:** coordinator chat, agent supplies evidence; you assess the result.

```text
Give me the final integration worktree path and SHA, original execution baseline,
ticket states, actual review reports and all-suite verification manifest. Compare
planned versus actual changes C1-C3, including sequence behavior and deviations.
Explain remaining gaps. Preserve proposal history and evidence. Do not merge or clean up.
```

Set the actual candidate path in Ubuntu; do not assume the original lab checkout contains the implementation:

```bash
export MP_CANDIDATE="/paste/the/actual/integration/worktree/path"
node "$MP_SKILLS/examples/validation-lab/verify.mjs" \
  "$MP_CANDIDATE" all "$MP_LAB/.scratch/quote-demo/evidence"
git -C "$MP_CANDIDATE" status --short
```

**Expected:** verification reports `passed: true`, the candidate is clean, and reviews target its exact revision. You should see evidence of A/B overlap and C waiting for verified A+B. For a manual demonstration:

```bash
cat > "$MP_LAB/.scratch/quote-demo/catalog.json" <<'JSON'
[{"sku":"PEN","name":"Bolígrafo","unitPriceCents":1250}]
JSON
node "$MP_CANDIDATE/src/cli.mjs" "$MP_LAB/.scratch/quote-demo/catalog.json" PEN 3
```

Expected output, followed by a newline, exit 0 and no error text:

```json
{"sku":"PEN","name":"Bolígrafo","quantity":3,"totalCents":3750}
```

**If different:** before implementation, missing modules and failing application tests were expected; after final delivery they are failures requiring repair. Keep actual logs and run IDs. A final reassuring chat message does not replace executable evidence or the independent reviews.

## 12. Record this run and decide what to validate next

**Where / who:** you, with the coordinator helping assemble the lab report copies. Record actual skills/initial/execution/final SHAs, tool versions, models, run IDs, observed results and limitations. Keep `.scratch` evidence separately from Git history. If interrupted, save your step and session IDs; ask the coordinator to reconcile existing sessions/claims before resuming rather than creating replacements.

A successful first run establishes only what you observed. Leave discovery rehearsal, deliberate failures, cancellation/restart recovery and any untested provider/OS combinations **NOT RUN**. Continue with the full reference's [failure exercises](PR-VALIDATION.md#6-exercise-failure-paths), [existing-code sequence exercise](../examples/validation-lab/design-change-exercise/README.md) and [assessment](PR-VALIDATION.md#7-evaluate-the-framework) when ready. A recommendation about the framework is separate from accepting this lab's design or authorizing a repository merge.
