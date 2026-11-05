# First quotation lab: Windows and an Ubuntu host

> [Versión en español](BEGINNER-VALIDATION.es.md). This English version is authoritative; update the translation when you change it.

Follow this page in order for your first run. You will use Herdr on Ubuntu, reached from Windows, to direct Claude Code and Pi on Ubuntu. The example host is `sen03`, the Ubuntu user is `netname`, and all project files live on Ubuntu. Substitute your own SSH destination and home directory if different. Commands labelled **Windows** are PowerShell; commands labelled **Ubuntu** run after SSH connects. Text labelled **coordinator chat** goes into the agent conversation in a Herdr pane, never into a shell prompt.

The goal is a tiny quotation program: a catalog lists a PEN priced at 1250 cents; asking for three prints a quote totaling 3750 cents. You will first inspect the proposed design, then watch two independent tasks run before a third combines them. Model calls use your existing subscriptions or API accounts and may incur charges.

This page covers one successful supervised run. The [full validation reference](PR-VALIDATION.md) contains additional failure/recovery exercises; complete those afterward before claiming full framework validation. Your first run is not evidence for checks you have not performed.

## Keep these four things separate

| Name | Meaning in this walkthrough |
| --- | --- |
| Host | `sen03`, the Ubuntu computer running the Herdr server and the agents |
| Skills checkout | `/home/netname/code/pi-skills-validation-01`, instructions and helpers used by agents |
| Lab project | `/home/netname/code/quote-workflow-lab-01`, the separate application they will build |
| Role row | A line in the lab's `docs/agents/delegation.md`: harness, mode, arguments, exact model and family for one kind of session |

Claude Code and Pi are agent tools that call models. Herdr runs their sessions in panes that keep running when you disconnect. A role row is not a running session. The human accepts the design; the coordinator session manages tickets and workers. A/B/C are task names, not model names. Git commits identify exact saved versions; the long identifier is called a SHA.

If someone already prepared the host or lab, verify that work in steps 1–4 and continue at the first incomplete checkpoint. Do not clone over an existing checkout or regenerate an existing lab. Keep a short note of your current step, paths and run IDs under the lab's ignored `.scratch/quote-demo/` directory after it exists.

| Steps | You should finish with |
| --- | --- |
| 1–4: host and lab | Working SSH/tools, recorded package revision and a lab |
| 5–7: Herdr and sessions | A Herdr session, real diagnostic runs and committed lab configuration with filled role rows |
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
herdr --version
```

**Expected:** the correct host/user and a version for each tool. Node 24 LTS is the walkthrough's baseline. The PATH line affects this shell and supports both common Pi installation locations; it does not change an already running Herdr server.

**If different:** a timeout means fix SSH/network access first. `command not found` means locate/install that tool before continuing. A machine starting from zero must complete the manual's [host installation instructions](MANUAL.md#prepare-the-execution-host), then return here. Already installed tools need no reinstallation. Keep this SSH terminal open for the Ubuntu commands below. A new terminal needs the PATH and variable assignments again.

## 2. Check Herdr and both harnesses

**Where / who:** Ubuntu terminal, you.

```bash
herdr integration status
pi --list-models deepseek
claude -p "Reply with OK."
```

**Expected:** the integration list includes `pi` and `claude`; Pi lists the DeepSeek model you will use; Claude prints a reply. A model in `--list-models` establishes availability, not that your account can run it; step 6 checks actual sessions.

**If different:** install the missing integrations (they let sessions report their state and resume after a Herdr server restart):

```bash
herdr integration install pi
```

```bash
herdr integration install claude
```

If Claude prints "Not logged in", run `claude` once on Ubuntu and follow its login flow; for Pi, configure the provider in `pi` and select it with `/model`. Keep secrets out of chats and evidence files. Stop here until both harnesses work.

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
git clone --branch main --single-branch \
  https://github.com/netname/pi-adapted-mp-skills.git "$MP_SKILLS"
```

For either a new or existing checkout, run:

```bash
git -C "$MP_SKILLS" branch --show-current
git -C "$MP_SKILLS" status --short
git -C "$MP_SKILLS" rev-parse HEAD
cd "$MP_SKILLS" && npm ci && npm test
```

**Expected:** branch `main` (or the PR branch you chose to validate instead), no uncommitted package changes, and all package tests pass. Record the actual skills SHA and tool versions in your run notes. The number of tests can change. These tests check the skills package; the quotation application has not been built yet.

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

The project-scope install keeps this unmerged branch out of your other projects, and serves sessions in the lab directory itself. Workers run in Herdr worktrees under `~/.herdr/worktrees/`, where that install does not resolve; the coordinator therefore gives them the skill files by absolute path, as the prompts below do.

In a fresh lab copy these report templates once, before recording results, and create the evidence directory for run records:

```bash
cp -n "$MP_SKILLS/docs/VALIDATION-REPORT.md" \
  "$MP_LAB/.scratch/quote-demo/validation-report.md"
cp -n "$MP_SKILLS/docs/ARCHITECTURE-VALIDATION.md" \
  "$MP_LAB/.scratch/quote-demo/architecture-validation.md"
mkdir -p "$MP_LAB/.scratch/quote-demo/runs"
```

**If different:** `destination exists` from the generator is protection, not a failed lab to delete. Inspect what was created and resume the missing step. If a package was already registered, verify its path and avoid a duplicate. Do not overwrite completed report copies; `.scratch` is ignored by Git and needs separate retention. Other report filenames in an existing run are fine: keep their existing locations and references.

## 5. Start the Herdr session and choose the role rows

**Where / who:** Ubuntu terminal (or Windows with `herdr --remote`), you.

Start a named Herdr session for the lab. Either run it in your SSH terminal:

```bash
herdr --session quote-lab
```

or, from **Windows**, let the Ubuntu server own the panes while your terminal only draws them (this route follows Herdr's documentation and has not been checked with this package; use the SSH route if it misbehaves):

```powershell
herdr --remote netname@sen03 --session quote-lab
```

Open a pane in the lab directory (`cd "$MP_LAB"` inside it). Detach with `Ctrl+B q` and reattach with the same command; the panes keep running. This is where the coordinator and every delegated session will live.

These are the role rows for this lab. You will have the planning session write them into `docs/agents/delegation.md` in step 7:

| Role row | Harness / model family | Mode | Arguments after `--` |
| --- | --- | --- | --- |
| Planning / coordination | Claude Code / Claude | the coordinator's own session | — |
| Implementation | Pi / DeepSeek | interactive | `--model deepseek/deepseek-flash` |
| Design comprehension, design challenge | Pi / DeepSeek | batch | `--model deepseek/deepseek-flash --tools read,grep,find,ls` |
| Spec review, Standards review | Claude Code / Claude | batch | `--model claude-sonnet-5-5 --tools Read,Grep,Glob --permission-mode dontAsk` |

The model IDs are examples that `sen03` offered during preparation. Choose them only if `pi --list-models` and your Claude account offer them; otherwise choose an available model in the same family and record its exact ID. They are not promises of access or benchmark superiority.

**Expected:** a running Herdr session with a pane in the lab, and a role table you understand. Claude planning has independent DeepSeek design review; DeepSeek implementation has independent Claude code review. Each review axis will use a separate fresh session even when a row is reused.

**If different:** if `herdr --remote` cannot connect, check that `ssh netname@sen03` works and Herdr is installed on Ubuntu. Stop before a real review if independence cannot be verified.

## 6. Prove each harness and one delegated child work

**Where / who:** the Herdr pane in the lab, you start a diagnostic coordinator; agents only perform the checks requested here.

In the lab pane run `claude` and paste:

```text
This is a setup check. Report your working directory, read AGENTS.md and
docs/architecture/overview.md, and summarize the proposed quotation app.
Do not edit files, run tests, create commits or launch other agents.
Report missing files honestly. Do not treat supplied drafts as accepted.
```

Open a second pane in the lab, run `pi --model deepseek/deepseek-flash`, and send the same prompt. A session started in an unrelated terminal outside Herdr is not a Herdr-managed session.

**Expected:** both respond about the quotation lab. Their footers or `/session` show the model, but that is not yet the evidence the workflow needs; the delegated check below is. A model listed by `--list-models` can still fail due to sign-in, quota or endpoint errors; resolve those before continuing.

In the Claude session paste:

```text
Read /home/netname/code/pi-skills-validation-01/skills/engineering/_shared/DELEGATION.md.
Launch exactly one fresh batch session with
node /home/netname/code/pi-skills-validation-01/scripts/herdr-delegate.mjs launch
--mode batch --role exploration --harness pi, the design-review arguments from
the role table, --cwd /home/netname/code/quote-workflow-lab-01, and a brief,
task, record and --output you create under .scratch/quote-demo/runs/.
Its only task: read AGENTS.md and docs/architecture/overview.md and summarize
the proposed app. Wait until the record's status is completed or failed, then
run herdr-delegate.mjs inspect <record> --expect-model deepseek/deepseek-flash.
Report the run ID, the effective model and the summary from --output.
Do not replace a run whose state is unknown.
```

Repeat the same check with the Claude Code review row (`--harness claude` and its arguments), because that row has not been checked live with this package yet.

**Expected:** each record shows `completed`, `inspect --expect-model` passes, and the coordinator reports the child's real summary. You can see the child's pane with `herdr agent list` / `herdr workspace list`. Exit the diagnostic sessions after completion; use a new planning session in step 7. **If different:** record a failed/incomplete preflight. A record without an effective model blocks the review gate. Never replace an unknown running child or proceed on assumed success.

## 7. Let a planning session finish the lab configuration

**Where / who:** a new `claude` session in the lab pane, agent prepares changes; you inspect them. The paths in this prompt match the example directories. Replace them if your actual paths differ.

```text
Read /home/netname/code/pi-skills-validation-01/skills/engineering/setup-matt-pocock-skills/SKILL.md
and apply it to /home/netname/code/quote-workflow-lab-01. Resolve references
from the skill directory. Treat Pi checks as checks of the worker environment.
Reuse the verified host, harnesses and Herdr session quote-lab.
Write the role rows I chose (harness, mode, arguments, exact model, family) into
docs/agents/delegation.md, with the helper path and the evidence directory
.scratch/quote-demo/runs. Do not invent settings or silently substitute models.
Preserve the supplied spec/tests/scope and canonical tracker in AGENTS.md.
Record preflight run evidence and missing capabilities in the lab reports.
No implementation, worker dispatch or human design acceptance yet.
Explain changes and remaining questions in plain language for my inspection.
```

**Expected:** the agent fills actual settings and explains remaining issues. You should understand who plans, who builds and who reviews. The Research row can use a separately verified source-capable harness; if research is not part of this first run, record it as unavailable/not exercised and do not dispatch it. Required implementation/review rows must be complete.

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

For an Ubuntu terminal preview, run (in another Herdr pane, so the planning chat stays free):

```bash
cd "$MP_LAB/docs/architecture/model" &&
npx --yes --package=likec4@1.60.0 likec4 validate &&
npx --yes --package=likec4@1.60.0 likec4 start
```

**Expected:** validation succeeds and a preview URL is printed. That URL's `localhost` is Ubuntu. To view it from Windows, open another PowerShell terminal and forward the printed port, for example `ssh -N -L 5173:127.0.0.1:5173 sen03` if the preview uses 5173. Then open `http://localhost:5173` in your Windows browser. Use the actual port; if occupied choose another local port and match the browser URL. Keep the forwarding terminal open while viewing; Ctrl+C ends it. Stop the preview with Ctrl+C when finished.

Inspect `components`, `quoteSuccess` and `quoteFailure` alongside the design's C1-C3 table. Can you explain which component reads, which calculates, which prints, and why malformed JSON produces no quote? The agent records view IDs, source snapshot, commands and presentation evidence. If your browser cannot reach the preview, fix the tunnel/port before recording presentation as complete. A parsing pass alone does not establish visual review.

## 9. Obtain independent review, then make your decision

**Where / who:** planning chat, coordinator arranges review; you decide whether to accept.

```text
Read /home/netname/code/pi-skills-validation-01/skills/engineering/review-design/SKILL.md
and apply it to /home/netname/code/quote-workflow-lab-01.
Freeze the current spec/design/model/ADR/coverage and quote-plan.md inputs.
Launch separate fresh comprehension and challenge batch sessions through Herdr
with the design-review role rows, independent of every design author, and
verify each run with inspect --expect-model. Collect the real reports with
run/model/input identities. Resolve blockers and preserve findings.
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

**Where / who:** a **new** `claude` session in a Herdr pane in the lab; you supply the accepted execution baseline. Replace `EXECUTION_SHA` below with the actual SHA from step 9 before sending.

```text
Read /home/netname/code/pi-skills-validation-01/skills/engineering/implement-spec/SKILL.md
and follow it for /home/netname/code/quote-workflow-lab-01.
Use the actual accepted design/plan/readiness and project contracts. Use the
original canonical tracker root from AGENTS.md; verify evidence before dispatch.
Create a dedicated integration worktree from EXECUTION_SHA. You are the single
coordinator and tracker/integration writer. Maximum two implementation workers.
Launch workers and reviewers through Herdr with the implementation and code-review
role rows and explicit role briefs; give workers the skill files by absolute
path. Verify every run with inspect --expect-model. Do not implement the
application yourself.
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
herdr --session quote-lab agent list
```

Compare paths, effective models (from the run records' `inspect` output) and starting revisions with the coordinator's report. C must remain unstarted. You can watch a worker with `herdr --session quote-lab agent attach <name>` (detach with `Ctrl+B q`). Record the inspection. If correct, send:

```text
The observation checkpoint is complete. Release A and B and continue within
the configured limits through C and final verification. Preserve evidence.
```

**If different:** keep affected workers paused and ask the coordinator to explain/fix the discrepancy. A/B can finish in either order. The coordinator should launch C without repeated human requests once both prerequisite integrations pass. Final checks may take several tool/model turns; inspect `herdr agent list` and the run records rather than launching a duplicate coordinator.

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

**Where / who:** you, with the coordinator helping assemble the lab report copies. Record actual skills/initial/execution/final SHAs, tool versions, models, run IDs, observed results and limitations. Keep `.scratch` evidence separately from Git history. If interrupted, detach from Herdr rather than closing sessions; save your step and run IDs, and ask the coordinator to reconcile existing run records and claims before resuming rather than creating replacements.

A successful first run establishes only what you observed. Leave discovery rehearsal, deliberate failures, cancellation/restart recovery and any untested provider/OS combinations **NOT RUN**. Continue with the full reference's [failure exercises](PR-VALIDATION.md#6-exercise-failure-paths), [existing-code sequence exercise](../examples/validation-lab/design-change-exercise/README.md) and [assessment](PR-VALIDATION.md#7-evaluate-the-framework) when ready. A recommendation about the framework is separate from accepting this lab's design or authorizing a repository merge.
