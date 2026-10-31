# Architecture extension validation

This report separates checks run while preparing the PR from exercises requiring your execution host and live agents. It does not grant design approval to the quotation fixture.

## Historical preparation checks (reference only), 2026-10-27

| Check | Result | Scope |
| --- | --- | --- |
| `npm test` | PASS: 23 tests; 30 skills validate | YAML validation, guardrail opt-in/options, lab acceptance mutations, existing helpers plus readiness acceptance, stale inputs/reports, incomplete review, same-family review, duplicate runs and unsafe paths |
| LikeC4 1.60.0 `validate` in fixture model directory | PASS: 1 source file | Parses component/success/failure views; no semantic architecture approval |
| Fixture creation | PASS in package tests | Draft readiness, ticket scope snapshot, substituted paths, existing-destination protection |
| Application acceptance tests on scaffold | Expected failure tested | Implementation deliberately absent |
| Live Paseo / actual model-family inspection | NOT RUN | Requires your configured host |
| Human acceptance of lab design | NOT GIVEN | Must come from the actual review exercise |
| Windows execution | NOT RUN | Linux checks do not certify Windows |
| Other applications and shared-service environments | NOT RUN | Outside the self-contained quotation fixture |

These historical results belong to PR preparation, not your execution host or current run. Do not transfer PASS values into your live results. Record any repeated offline checks with the exact current package SHA and output.

The tests contain explicitly synthetic approval/reviewer records for helper validation. These are never copied into the generated lab. A passing test of record structure does not establish genuine consent or reviewer independence.

## Live validation report: fill for your run

Procedure: [PR validation route](PR-VALIDATION.md), with the [quotation design exercise](PR-VALIDATION.md#3-review-the-quotation-design). After copying this template into the lab, use your recorded skills path if relative links no longer resolve.

Run ID/date/operator: ______. Skills checkout path: ______.
Package commit: ______. Host/OS/Node: ______. Paseo version: ______.
Initial lab baseline / approved execution baseline / final integration SHAs: ______.
Design author families: ______. Workflow report location: ______.

| Observation | Result (PASS / FAIL / NOT RUN / BLOCKED) | Evidence |
| --- | --- | --- |
| Human can explain components, ownership and success/failure paths | NOT RUN | |
| Language exercise: clear questions, reused decisions, preserved error conditions/outputs | NOT RUN | |
| Asynchronous questionnaire loads the same policy and retains necessary conditional questions | NOT RUN | |
| Actual independent comprehension model/run inspected | NOT RUN | |
| Actual independent challenge model/run inspected | NOT RUN | |
| Missing R4 and contradictory catalog ownership detected | NOT RUN | |
| Complete coverage checked after ticket decomposition | NOT RUN | |
| Actual human decision targets recorded input hashes | NOT RUN | |
| Draft/stale/failed-review gates prevent affected dispatch | NOT RUN | |
| Material deviation returns for decision | NOT RUN | |
| Final docs compared with integrated implementation | NOT RUN | |

Preserve reports and findings, including failed/cancelled runs. Record exactly what was observed; leave unperformed checks NOT RUN. Complete the separate workflow validation report for concurrency, worktrees, testing and serial integration. Passing this report alone does not validate those behaviors.

## Live assessment

- Design/readiness observations: PASS / FAIL / INCOMPLETE
- Blocking findings and evidence:
- NOT RUN / BLOCKED checks and limitations:
- Final documentation compared with implementation at SHA:
- Human assessing this run:
- Proposed PR action: keep draft / request fixes / ready for maintainer decision

Design acceptance is recorded separately against exact inputs. This report assesses the framework's observed behavior and does not authorize a merge.
