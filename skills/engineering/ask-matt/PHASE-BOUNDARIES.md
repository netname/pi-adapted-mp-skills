# Phase boundaries

A **phase** is a chunk of work inside a session: the grilling, the implementation, the QA. The definition is fuzzy on purpose: a phase ends when you think *"ok, we're done with that"*.

The **phase boundary** is the gap between two phases, and it is the only place this decision belongs. Mid-phase there is no decision to make: continue, or split the work that's left into subagents. Compacting mid-phase makes the agent lose the thread.

## The five options

| Option       | What it does                                                    |
| ------------ | --------------------------------------------------------------- |
| **Continue** | Stay in the session. No context switch at all.                    |
| **`/new`**   | Start a fresh session with an empty context window.               |
| **`/skill:handoff`** | Write a portable markdown file and seed a session anywhere with it. |
| **Subagent** | Send the task to its own context window and get a report back.     |
| **`/compact`** | Compress this context and seed a fresh session with the summary.  |

## The tree

Work top to bottom at the boundary. The first **yes** wins.

**1. Can planning or coordination continue in this session?** Keep the conversation when its context is useful and sufficient capacity remains for the next planning/coordinator step. For example, grilling can continue into specification and design preparation. Context capacity depends on the selected model and accumulated material; do not assume a fixed token threshold.

Continuing the coordinator is not continuing as an implementation worker. For an approved task graph, follow `../implement-spec/SKILL.md`: launch fresh workers in separate worktrees with the approved spec/design, scoped ticket, immutable base, project instructions and test contract. The planner's full conversation is not the worker's required input. Standalone `../implement/SKILL.md` still needs its readiness, verification and independent review. Design and code reviewers always use fresh independent sessions under their configured policies.

**2. Is the context irrelevant to what comes next?** Is everything in this session (the exploration, the decisions, the dead ends) disposable? If so, **`/new`**. It is the cheapest move on the board: it takes no time and hands back the whole window. `/new` also isn't terminal: the old session stays resumable.

The cost of getting this wrong is one-way. Throw away a *relevant* context and you lose the **why** behind what you built, so record accepted decisions, rationale and source links in durable artifacts before switching.

**3. Do you need to hand off?** `/skill:handoff` is narrow. You need it only when you are:

- swapping to a **new harness** (Pi to another agent harness, or the reverse),
- moving to a **new directory** or repo,
- sending the work to a **colleague**,
- or forking a side task you found **mid-phase** without derailing what you're doing.

A handoff buys portability: explicit context that travels. Worker dispatch always supplies approved artifacts; a separate handoff file is optional when those artifacts already carry the necessary scope, decisions and evidence.

**4. Can the task be done AFK?** Is it scoped tightly enough to run with you away from the keyboard, no steering? Then send it to a **subagent** and leave this session untouched. Automated review is the standard case: the agent reads the diff and reports, and you aren't needed while it does.

**5. Otherwise, `/compact`.** Relevant context, same harness, same directory, and you need to stay in the loop: this is where the tree lands, and it lands here often. Pass it an instruction (`/compact we're going to QA this area`) so the summary keeps what the next phase needs.

`/compact` is the **default, not the first reach**. It sits at the bottom because the four questions above it are all cheaper or more precise. The failure mode when people start here is a fresh session that is confidently wrong about a decision the summary flattened.

## Primary and secondary sources

Every move except **Continue** turns a **primary source** into a **secondary source**: the session as it happened, replaced by a summary of it. The trade is always the same shape:

| Source                            | Information | Noise | Room to move |
| --------------------------------- | ----------- | ----- | ------------ |
| Primary (Continue)                | Full        | Lots  | Little       |
| Secondary (`/compact`, `/skill:handoff`) | Lossy       | Less  | Lots         |

This is why question 1 comes first. You only pay the lossiness when staying costs more than it saves.

## These are judgement calls

The questions are not objective: each has taste in it, and the same boundary can go two ways on two days. The value is in asking them **in order**, at the boundary rather than in the middle of the work.

