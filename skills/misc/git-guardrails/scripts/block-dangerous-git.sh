#!/usr/bin/env bash
# Default dangerous-git patterns for the `git-guardrails` skill.
#
# This array is the single source of truth for the guardrail: the package
# extension `extensions/git-guardrails.ts` reads this file at load time and the
# standalone check below matches against the same list. Edit this array to
# change what the guardrail blocks.
#
# Standalone use — pass the command as an argument:
#
#   bash block-dangerous-git.sh "git push origin main"
#
# It prints BLOCKED to stderr and exits 1 on a match, and exits 0 otherwise.
# This is a plain checker: nothing is read from stdin, `jq` is not used, and there
# is no hook exit-code contract.

DANGEROUS_PATTERNS=(
  "git push"
  "git reset --hard"
  "git clean -fd"
  "git clean -f"
  "git branch -D"
  "git checkout \."
  "git restore \."
  "push --force"
  "reset --hard"
)

COMMAND="$*"
for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if printf '%s' "$COMMAND" | grep -qE "$pattern"; then
    echo "BLOCKED: '$COMMAND' matches dangerous pattern '$pattern'. The user has prevented you from doing this." >&2
    exit 1
  fi
done

exit 0
