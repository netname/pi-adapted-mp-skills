# Validation lab instructions

Read docs/specs/quote.md and docs/agents/{issue-tracker,delegation,testing}.md.
The skills package is at __SKILLS_ROOT__.
The one authoritative local tracker and evidence directory is __STATE_ROOT__.
All worktrees use that absolute location; do not create private tracker copies.
Use fresh workers and independent reviewers according to the package's shared policy.
The coordinator is the only tracker/integration writer; implementation workers commit on their assigned branches.
Do not change supplied acceptance tests to manufacture a pass. No ERPNext or deployment in this exercise.

Before implementation, read docs/agents/architecture.md. The supplied design is draft; dependency-ready tickets remain blocked until design/plan acceptance is recorded.
