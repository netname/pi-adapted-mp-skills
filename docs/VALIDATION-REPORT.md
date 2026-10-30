# Framework workflow validation report

Copy this file into the lab's `.scratch/quote-demo/validation-report.md`. Fill observed results; never use the expected result as evidence that a test ran. The procedure is in [MANUAL.md](MANUAL.md) in the skills repository. After copying, that relative link may no longer resolve; keep the skills checkout path below.

Use this report for orchestration behavior. For the combined framework also complete [the architecture report](ARCHITECTURE-VALIDATION.md). Follow [the first-time route](MANUAL.md#validate-the-framework-for-the-first-time) for instructions. Leave unperformed checks NOT RUN; a copied template is not evidence.

## Run identity

| Field | Recorded value |
| --- | --- |
| Run ID / date / operator | |
| Skills checkout absolute path | |
| Skills-under-test Git SHA | |
| PR URL(s) / tested scope | Record PR #1 alone or combined PR #1 + PR #2 |
| Lab original directory | |
| Initial lab baseline SHA | |
| Approved execution baseline SHA | |
| Final integration branch / worktree / SHA | |
| Canonical tracker/evidence directory | |
| OS / host | |
| Node / npm / Git versions | |
| Paseo host and client versions | |
| Pi / Claude Code versions | |
| Coordinator run ID | |
| Installation mode and package provenance | |
| Start / finish time, including timezone | |

## Actual model selection

Record exact provider/model IDs from the host's effective session configuration, not from an agent's self-description. Do not include API keys, tokens or account credentials.

| Role / run ID | Profile | Actual harness/provider | Actual model | Family | Inspection evidence |
| --- | --- | --- | --- | --- | --- |
| Coordinator | | | | | |
| A implementation | | | | | |
| B implementation | | | | | |
| C implementation | | | | | |
| Spec review (list each run) | | | | | |
| Standards review (list each run) | | | | | |
| Research, if exercised | | | | | |

All implementation families contributing to final candidate:

Both review axes use a different family from every implementing family: PASS / FAIL / UNVERIFIED.

Read-only controls actually configured; limitations:

## Acceptance matrix

Use PASS, FAIL, NOT RUN or BLOCKED. Link artifacts/logs and state observations. Do not delete rows you could not exercise.

| ID | Check | Status | Actual observation / evidence |
| --- | --- | --- | --- |
| I1 | Exact PR installed without skill shadowing | NOT RUN | |
| I2 | Pi and Claude work on the intended host | NOT RUN | |
| I3 | Paseo coordinator has working delegation access | NOT RUN | |
| I4 | Real profiles/model IDs populated; no placeholders | NOT RUN | |
| P1 | Ready research only; cited artifacts collected | NOT RUN | Optional planning rehearsal |
| P2 | Human decision pauses; agent does not impersonate human | NOT RUN | Optional planning rehearsal |
| P3 | Grilling/spec/tickets preserve agreed scope and seams | NOT RUN | Optional planning rehearsal |
| W1 | A and B overlap in distinct worktrees | NOT RUN | |
| W2 | One coordinator; claims recorded once | NOT RUN | |
| W3 | C waits for verified A+B integration | NOT RUN | |
| W4 | C launches without manual next-ticket dispatch | NOT RUN | |
| T1 | Ticket-specific profiles run at correct stage | NOT RUN | |
| T2 | Final candidate passes all acceptance suites | NOT RUN | |
| T3 | Logs name exact revision, command, exits and environment | NOT RUN | |
| R1 | Both axes run in fresh independent-model sessions | NOT RUN | |
| R2 | Reports use exact spec/standards and immutable target | NOT RUN | |
| R3 | Findings resolved or explicitly nonblocking | NOT RUN | |
| M1 | Integration updates are serial | NOT RUN | |
| M2 | Combined target gets refreshed checks/review | NOT RUN | |
| N1 | Dirty candidates rejected, no omissions hidden | NOT RUN | |
| N2 | Failing tests block progress; failure logs retained | NOT RUN | |
| N3 | Cancelled/missing review axis stays incomplete | NOT RUN | |
| N4 | Same-family review rejected or blocked | NOT RUN | |
| N5 | Invalid dependencies/claims handled correctly | NOT RUN | |
| N6 | Coordinator restart does not duplicate workers | NOT RUN | |
| N7 | Real conflict preserves requirements and refreshes approval | NOT RUN | |
| N8a | Unavailable required environment is not treated as passed | NOT RUN | |
| N8b | Repair budget stops automatic retries | NOT RUN | |
| D1 | Final behavior matches example output | NOT RUN | |
| D2 | Commits/evidence retained before cleanup | NOT RUN | |
| D3 | No unauthorized push, merge or deployment | NOT RUN | |

## Ticket and integration ledger

| Ticket | Claim/run | Start/end time | Base SHA | Submitted head | Integrated SHA | Verification | Review evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | | | | | | | |
| B | | | | | | | |
| C | | | | | | | |

If a candidate was repaired or merged with a newer integration tip, add another row. Do not replace the original candidate's record.

## Review ledger

| Target base/head | Axis | Run ID / model family | Result | Blocking findings | Disposition / artifact |
| --- | --- | --- | --- | --- | --- |
| | Spec | | | | |
| | Standards | | | | |

## Failures, repairs and limitations

| Time | Run/ticket | Observed failure | Evidence | Action / repair number | Remaining blocker |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

Static setup correction: `enableSkillCommands: false` no longer blocks setup. Confirm manual invocation and record the installed Pi version during live validation; the instruction change alone does not prove host compatibility.

Not covered by this lab: real database/queue lease recovery; migrations; browser E2E; production deployment; universal compatibility across hosts/providers.

## Decision

- Happy-path execution: PASS / FAIL / INCOMPLETE
- Negative/recovery exercises: PASS / FAIL / INCOMPLETE
- Whole SWE-cycle rehearsal: PASS / FAIL / NOT RUN
- Remaining blocking defects:
- NOT RUN / BLOCKED checks and limitations:
- Architecture report location / outcome (combined run):
- Nonblocking follow-ups:
- Proposed PR action: keep draft / ready for independent review / ready for maintainer decision
- Human making this assessment:

No report alone authorizes a merge. Preserve evidence and use the project's ordinary review/merge process.
