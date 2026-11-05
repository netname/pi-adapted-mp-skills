---
name: ask-matt
description: Ask which skill or flow fits your situation. A router over the skills in this repo.
disable-model-invocation: true
license: MIT
metadata:
  upstream: mattpocock/skills
  upstream-commit: c55ee46073ed923f86ce59a5eb3b6d895095d1b7
  upstream-path: skills/engineering/ask-matt
  invocation: user
  adapted-for: pi
---

# Ask Matt

You don't remember every skill, so ask.

A **flow** is a path through the skills. Most paths run along one **main flow**, and two **on-ramps** merge onto it. Everything else is standalone, or a vocabulary layer that runs underneath.

## The main flow: idea → ship

The route most work travels. You have an idea and want it built.

1. **`/skill:grill-with-docs`** sharpens the idea by interview. Start here whenever you are **working in a working directory**: it's stateful, retaining what it learns in `GLOSSARY.md` and ADRs. (No working directory? Use `/skill:grill-me` instead, covered under Standalone. Both run the same `/skill:grilling` primitive; `grill-with-docs` is the one that leaves a paper trail, which makes it the better of the two whenever a repo is there to leave it in.)
2. **Branch: can you settle every question in conversation?** If a question needs a runnable answer (state, business logic, a UI you have to see), detour through a prototype, bridged by **`/skill:handoff`** in both directions (a prototype lives in its own directory, which is exactly what `/skill:handoff` is for; see Phase boundaries):
   - **`/skill:handoff`** out, then open a fresh session against that file,
   - **`/skill:prototype`** to answer the question with throwaway code,
   - **`/skill:handoff`** back what you learned, and reference it from the original idea thread.
3. **`/skill:to-spec`** records agreed behavior. Then use **`/skill:design-solution`** to explain components, workflows and tradeoffs, and **`/skill:review-design`** for fresh comprehension/challenge reviews. Use a lightweight note for small changes; full modeling is optional according to the project architecture contract.
4. **`/skill:to-tickets`** breaks larger work into tracer-bullet tickets. Check requirement coverage, dependencies and current design/plan acceptance before launch. A ready label does not bypass these gates.
5. **`/skill:implement-spec`** coordinates a graph automatically: fresh workers in separate worktrees, committed candidates, tests, independent review and serial verified integration. Use **`/skill:implement`** standalone for one scoped ticket with the same readiness requirements.

Implementation uses **`/skill:tdd`** where appropriate. Candidates are committed before **`/skill:code-review`** captures them. The coordinator owns review in coordinated mode; workers do not dispatch duplicates. Preserve explicit artifacts at phase boundaries so fresh sessions can resume without the entire conversation. Design reviewers must not inherit the drafting conversation.

## On-ramps

A starting situation that generates work, then merges onto the main flow.

- **Bugs and requests piling up** → **`/skill:triage`**. It moves issues through triage roles and produces agent-ready issues, which **`/skill:implement`** later picks up.

  Triage is only for issues **you didn't create**: bug reports, incoming feature requests, anything that arrives raw. Tickets that `/skill:to-tickets` produced already have an agreed scope; avoid redundant triage, but check design/plan readiness before dispatch.

- **Something's broken** → **`/skill:diagnosing-bugs`**. For the hard ones: the bug that resists a first glance, the intermittent flake, the regression that crept in between two known-good states. It refuses to theorise until it has a **tight feedback loop** (one command that already goes red on *this* bug), then fixes with a regression test. Its post-mortem hands off to **`/skill:improve-codebase-architecture`** when the real finding is that there's no good seam to lock the bug down.

- **A huge, foggy effort: a greenfield project or a huge feature build, too big for one session** → **`/skill:wayfinder`**, the most cognitively demanding flow here. When the way from here to the destination isn't visible yet, it charts a **shared map** of **decision tickets** on the issue tracker and resolves them one at a time, producing **decisions, not deliverables**, until the fog is pushed back and the way is clear. Where **`/skill:grill-with-docs`** sharpens an idea you can hold in one session, wayfinder is for the idea you can't, and it's slower and denser, so save it for exactly that, never a well-scoped feature.

  When the map clears, **it hands off, it doesn't build**: merge onto the main flow at **`/skill:to-spec`**, which collapses the map's linked decisions into a buildable plan, then design/review, `/skill:to-tickets` and `/skill:implement-spec` as above. Looping the map straight into `/skill:implement` skips that collapse and throws the linked detail away, so go straight to `/skill:implement` only when the effort turned out genuinely small.

## Codebase health

Not feature work, just upkeep.

- **`/skill:improve-codebase-architecture`** runs whenever you have a spare moment to keep the codebase good for agents to operate in. It surfaces **deepening opportunities**; picking one _generates an idea_ you can take into the main flow at `/skill:grill-with-docs`. It's the survey that finds the candidates; **`/skill:codebase-design`** (below) is the bench you design the chosen one on.

## Vocabulary underneath

Two model-invoked references that run *beneath* the other skills, each the single source of truth for its vocabulary. Reach for them directly when the **words**, not the process, are the problem; or let the skills above pull them in.

- **`/skill:domain-modeling`**: sharpen the project's *domain* language: challenge a fuzzy term, resolve an overloaded word ("account" doing three jobs), record a hard-to-reverse decision as an ADR. It's the active discipline `/skill:grill-with-docs` drives to keep `GLOSSARY.md` a clean glossary.
- **`/skill:codebase-design`** is the deep-module vocabulary (module, interface, depth, seam, adapter, leverage, locality) for designing a module's *shape*: a lot of behaviour behind a small interface at a clean seam. `/skill:tdd` and `/skill:improve-codebase-architecture` both speak it.

## Phase boundaries

A **phase** is a chunk of work inside a session: the grilling, the implementation, the QA. At the **boundary** between two of them you have five options, and picking between them is the fuzziest decision in this whole map:

- **Continue**: retain the planning/coordinator conversation when useful. Approved graph implementation still goes to fresh workers.
- **`/new`**: empty the window, when nothing here matters to what's next.
- **`/skill:handoff`** writes a portable markdown file. Use it for a new harness/directory, a colleague or a side task when the approved artifacts need additional portable context.
- **Subagent**: dispatch a tightly-scoped task to its own context window and get a report back.
- **`/compact`** compresses this context and seeds a fresh session with it. The **default**, at the bottom of the tree rather than the first reach.

Read [PHASE-BOUNDARIES.md](PHASE-BOUNDARIES.md) for the ordered tree: the five questions, the reasoning behind each branch, and why the primary-source cost makes **Continue** the one to rule out first. Make the decision **at** a boundary; mid-phase, continue or split the rest into subagents.

## Standalone

Off the main flow entirely.

- **`/skill:grill-me`**: the same relentless interview as `/skill:grill-with-docs`, but **stateless**: it saves nothing locally and builds no `GLOSSARY.md`. Reach for it when you are **not working in a working directory** (sharpening a plan, a design, a piece of writing, anything with no repo under it). If you are in a working directory, use `/skill:grill-with-docs` instead: it runs the same interview and leaves a paper trail, so it is strictly the better one.
- **`/skill:grilling`** is the interview primitive itself: rounds, the frontier, facts are the agent's job and decisions are yours. `/skill:grill-me` and `/skill:grill-with-docs` are the two named ways in, and `/skill:triage`, `/skill:wayfinder` and `/skill:improve-codebase-architecture` all run it internally. Reach for it directly only when you want the interview with no wrapper around it.
- **`/skill:prototype`** is a small, throwaway program that answers one design question: does this state model feel right, or what should this UI look like. Throwaway is a constraint on how the code is written, not a promise to destroy it: the accepted answer informs a scoped implementation assignment with normal verification/review, and the prototype itself is kept as a **primary source** on a `prototype/<name>` branch out of main, pointed at from the implementation issue. It's the detour in step 2 of the main flow, but reach for it any time a design question is hard to settle on paper.
- **`/skill:research`**: delegate reading legwork to a **background agent**: it investigates a question against **primary sources**, then leaves a cited Markdown file in the repo. Keep working while it reads. The file it produces is something to take *into* the main flow at `/skill:grill-with-docs`, since research feeds the thinking rather than replacing it.
- **`/skill:to-questionnaire`** comes in when the thing blocking you isn't in your head or the codebase but in **someone else's**, and it writes them a questionnaire to fill in. It's the inverse of `/skill:grill-me`: instead of interviewing you about the subject, it interviews you about the **send** (who it's going to, what you need back) and aims the questions at the gap. What comes back is material for `/skill:grill-with-docs` or `/skill:to-spec`.
- **`/skill:wizard`** is for the steps only a **human** can take: provisioning infrastructure, setting up credentials or CI secrets, clicking through an unfamiliar third-party dashboard, running a one-off migration or cutover. It generates an interactive bash script that opens each URL, captures each value, and writes it into `.env` and GitHub secrets, so the procedure stops being something you re-explain to an agent every time. Model-invoked, so the agent reaches for it the moment it hits a wall only you can pass. If the agent could just do it itself, it should; this is for where a human is genuinely in the loop.
- **`/skill:wait-what`** is the corrective for a message that didn't land. Use it mid-conversation, inside any other skill, and the agent re-pitches what it just said with the context you were missing, in plain English, using the `GLOSSARY.md` vocabulary. It works after the fact; `/skill:grill-with-docs` is the upfront cure, because a shared language agreed early is what stops the jargon arriving at all.
- **`/skill:teach`**: learn a concept over multiple sessions, using the current directory as a stateful workspace.
- **`/skill:writing-for-agents`** is the reference for writing documents agents consume: skills, AGENTS.md, pointed-at docs.

## Precondition

**`/skill:setup-matt-pocock-skills`**: run before your first engineering flow to configure the issue tracker, triage labels, and doc layout the other skills assume. Custom issue trackers also work.


For an approved multi-ticket build, use `/skill:implement-spec` to coordinate worktrees and the ready frontier; `/skill:implement` works one ticket. Use `/skill:pr` for PR evidence and `/skill:retro` for a retrospective.
