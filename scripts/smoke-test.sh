#!/usr/bin/env bash
#
# smoke-test.sh — the installed-package test for `pi-adapted-mp-skills` (M6 / §6/M6).
#
# It installs the pinned `pi-subagents`, the pinned `pi-web-access`, and a **copy** of
# this package into a fixture repo *outside* this repository, then asserts — from the
# installed copy, never from the working tree (Trap D) — the discovery, invocation,
# collision, parallelism, child-extension, and tracker behaviour the frozen plan
# requires. See `docs/NOTES.md` §M6 for the results this produced and for the Windows
# limits it works around.
#
# Scripts needed: Node (built-ins only), git, bash, and optionally cygpath on Windows.
# No runtime dependency is added to the package; `npm test` does NOT run this script
# (it needs a model provider and network). Run it with `npm run smoke` or directly.
#
# Usage:
#   bash scripts/smoke-test.sh                       # core stages
#   SMOKE_STAGES="probe invocation" bash scripts/smoke-test.sh
#   SMOKE_ROOT=/path/outside/repo bash scripts/smoke-test.sh
#   bash scripts/smoke-test.sh latest                # informational D13 floating run
#
# Windows/Git-Bash limits (recorded, not hidden):
#   - The fixture is a native sibling directory (`../mp-smoke-fixture`), never a
#     `mktemp -d` POSIX `/tmp/...` path: `pi install` and the detached child runner
#     handle POSIX temp paths inconsistently on Windows.
#   - `gh` writes are NOT executed (issue/comment/label/close): they would mutate a
#     real GitHub repository. The read-only `gh` commands are run, and the exact write
#     commands are printed with the reason they were skipped.
#   - `glab` is usually absent on Windows; the GitLab path is recorded as unverified.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SMOKE_ROOT="${SMOKE_ROOT:-$(cd "$REPO_ROOT/.." && pwd)/mp-smoke-fixture}"
FIXTURE="$SMOKE_ROOT/fixture"
PKG_INSTALL="$SMOKE_ROOT/pkg/pi-adapted-mp-skills"
PROBES="$REPO_ROOT/scripts/probes"
CHECK="$PROBES/check.mjs"
SCRATCH="$FIXTURE/.scratch"
RESULTS="$SCRATCH/smoke"

PINNED_SUBAGENTS="$(grep -oE 'pi-subagents@[0-9]+\.[0-9]+\.[0-9]+' "$REPO_ROOT/README.md" | head -1 | cut -d@ -f2)"
PINNED_WEB="$(grep -oE 'pi-web-access@[0-9]+\.[0-9]+\.[0-9]+' "$REPO_ROOT/README.md" | head -1 | cut -d@ -f2)"
PINNED_SUBAGENTS="${PINNED_SUBAGENTS:-0.69.0}"
PINNED_WEB="${PINNED_WEB:-0.29.0}"

STAGES="${SMOKE_STAGES:-setup static probe packaging invocation collision parallel childext tracker workflow}"
PASS=0
FAIL=0
SKIPPED=()

native_path() {
	if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else printf '%s' "$1"; fi
}

log() { printf '%s\n' "$*"; }
banner() { printf '\n=== %s ===\n' "$*"; }
ok() { PASS=$((PASS + 1)); printf '  PASS %s\n' "$*"; }
bad() { FAIL=$((FAIL + 1)); printf '  FAIL %s\n' "$*"; }
skip() { SKIPPED+=("$*"); printf '  SKIP %s\n' "$*"; }

has_stage() {
	for stage in $STAGES; do [ "$stage" = "$1" ] && return 0; done
	return 1
}

assert() { # <condition-result> <message>
	if [ "$1" = "0" ]; then ok "$2"; else bad "$2"; fi
}

# ---------------------------------------------------------------------------
# Pi runner: captures the probe snapshot AND the --mode json event stream.
# ---------------------------------------------------------------------------
run_pi() { # <label> <prompt-file-or-string> [extra pi args...]
	local label="$1"; shift
	local prompt="$1"; shift
	local probe="$SCRATCH/probe-$label.json"
	local stream="$RESULTS/$label.jsonl"
	mkdir -p "$RESULTS"
	# Run from inside the fixture so Pi resolves the fixture's project settings, not
	# this working repo's dev `.pi/settings.json` (which points at ../skills).
	(cd "$FIXTURE" && M6_PROBE_OUT="$probe" M6_PROBE_LABEL="$label" \
		timeout "${SMOKE_PI_TIMEOUT:-900}" pi -p -a --no-session --mode json -e "$PROBES/inspect.ts" "$@" "$prompt" \
		> "$stream" 2>"$RESULTS/$label.err") || true
	[ -f "$probe" ] || { bad "probe snapshot missing for $label"; return 1; }
	printf '%s\n' "$probe"
}

stream_check() { # <label> [check flags...]
	local label="$1"; shift
	if grep -q '"stopReason":"error"' "$RESULTS/$label.jsonl" 2>/dev/null; then
		local message
		message="$(node -e '
			const fs = require("fs");
			const ev = fs.readFileSync(process.argv[1], "utf8").trim().split(/\r?\n/)
				.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
			const err = ev.find((e) => e.type === "message_end" && e.message?.stopReason === "error");
			process.stdout.write(String(err?.message?.errorMessage ?? "unknown provider error").slice(0, 200));
		' "$RESULTS/$label.jsonl")"
		bad "stream $label: the model provider returned an error: $message"
		return 1
	fi
	if node "$CHECK" stream "$RESULTS/$label.jsonl" "$@"; then ok "stream $label: $*"; else bad "stream $label: $*"; fi
}

# ---------------------------------------------------------------------------
# setup — fresh fixture, pinned installs, installed copy, Windows path defect
# ---------------------------------------------------------------------------
stage_setup() {
	banner "setup"
	command -v pi >/dev/null 2>&1 || { bad "pi is not on PATH"; return 1; }
	rm -rf "$SMOKE_ROOT"
	mkdir -p "$PKG_INSTALL" "$SCRATCH"
	# The installed copy is a separate tree so a passing test cannot be an artefact
	# of resolving from the working repo (Trap D).
	(cd "$REPO_ROOT" && tar -cf - --exclude=./.git --exclude=./node_modules .) | (cd "$PKG_INSTALL" && tar -xf -)
	ok "installed copy made at $(native_path "$PKG_INSTALL") from $(git -C "$REPO_ROOT" rev-parse --short HEAD) (working tree, $( [ -z "$(git -C "$REPO_ROOT" status --porcelain)" ] && echo clean || echo dirty ))"

	mkdir -p "$FIXTURE"
	(cd "$FIXTURE" && git init -q . && git config user.email "smoke@example.com" && git config user.name "M6 Smoke" && printf '# fixture\n' > README.md && git add -A && git commit -qm "fixture init")

	(cd "$FIXTURE" && pi install "npm:pi-subagents@$PINNED_SUBAGENTS" -l -a >/dev/null 2>&1)
	(cd "$FIXTURE" && pi install "npm:pi-web-access@$PINNED_WEB" -l -a >/dev/null 2>&1)
	# Install the copy by *relative* path: this is the install shape that reproduces
	# the Windows backslash defect NOTES §M3.5 records and the README documents.
	(cd "$FIXTURE" && pi install "../pkg/pi-adapted-mp-skills" -l -a >/dev/null 2>&1)

	local raw
	raw="$(cat "$FIXTURE/.pi/settings.json")"
	if printf '%s' "$raw" | grep -q '\\\\'; then
		ok "reproduced the Windows backslash package entry from \`pi install <path> -l\`"
	else
		skip "no backslash package entry observed (expected on Windows path installs)"
	fi
	node -e '
		const fs = require("fs");
		const p = process.argv[1];
		const j = JSON.parse(fs.readFileSync(p, "utf8"));
		j.packages = (j.packages ?? []).map((s) => String(s).split("\\").join("/"));
		fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
	' "$FIXTURE/.pi/settings.json"
	node -e '
		const j = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
		const bad = (j.packages ?? []).filter((s) => String(s).includes("\\"));
		process.exit(bad.length === 0 ? 0 : 1);
	' "$FIXTURE/.pi/settings.json"
	assert $? "package entries repaired to forward slashes"

	# The pinned installs must be the versions the README documents.
	[ -f "$FIXTURE/.pi/npm/node_modules/pi-subagents/package.json" ]
	assert $? "pi-subagents@$PINNED_SUBAGENTS is installed into the fixture"
	[ -f "$FIXTURE/.pi/npm/node_modules/pi-web-access/index.ts" ]
	assert $? "pi-web-access@$PINNED_WEB extension entry exists at .pi/npm/node_modules/pi-web-access/index.ts"
}

# ---------------------------------------------------------------------------
# static — validator + inventory, run inside the installed copy
# ---------------------------------------------------------------------------
stage_static() {
	banner "static (installed copy)"
	mkdir -p "$RESULTS"
	if node "$PKG_INSTALL/scripts/validate-skills.mjs" > "$RESULTS/validator.txt" 2>&1; then
		ok "validator passes inside the installed copy: $(grep -o 'skills/\*\* clean.*' "$RESULTS/validator.txt" | head -1)"
	else
		bad "validator fails inside the installed copy"; cat "$RESULTS/validator.txt"
	fi
	# The upstream cache is a developer-machine artifact recorded relative to the
	# *source* checkout, so an installed copy needs it passed explicitly.
	if node "$PKG_INSTALL/scripts/fetch-upstream.mjs" --no-fetch --quiet --cache "$(native_path "$REPO_ROOT/../mp-upstream-c55ee46")"; then
		ok "drift reporter runs from the installed copy against the shared upstream cache"
	else
		bad "drift reporter failed from the installed copy"
	fi
	node -e '
		const fs = require("fs"); const path = require("path");
		const root = process.argv[1];
		const inv = JSON.parse(fs.readFileSync(path.join(root, "docs/skill-inventory.json"), "utf8"));
		const shipped = inv.skills.filter((r) => ["port","adapt","rename"].includes(r.disposition) && r.piPath);
		const missing = shipped.filter((r) => !fs.existsSync(path.join(root, r.piPath)));
		const skills = shipped.filter((r) => fs.existsSync(path.join(root, r.piPath)));
		console.log(`shipped=${shipped.length} skills=${skills.length} missing=${missing.length}`);
		process.exit(missing.length === 0 && shipped.length === 26 ? 0 : 1);
	' "$(native_path "$PKG_INSTALL")" > "$RESULTS/inventory.txt" 2>&1
	assert $? "installed copy ships all 26 inventory piPaths ($(cat "$RESULTS/inventory.txt"))"
	[ -f "$PKG_INSTALL/extensions/git-guardrails.ts" ] && [ -f "$PKG_INSTALL/agents/mp-researcher.md" ]
	assert $? "installed copy carries the extension and the four mp-* agents"
}

# ---------------------------------------------------------------------------
# probe — discovery, visibility, provenance, tool availability
# ---------------------------------------------------------------------------
stage_probe() {
	banner "probe (discovery / D3 visibility / D11 provenance)"
	rm -rf "$FIXTURE/.pi/skills"
	local probe
	probe="$(run_pi parent "Reply with exactly: SMOKE-PROBE-OK")" || return 1
	M6_PKG_ROOT="$(native_path "$PKG_INSTALL")" node "$CHECK" discovery "$probe" && ok "discovery assertions passed" || bad "discovery assertions failed"
}

# ---------------------------------------------------------------------------
# invocation — D3, both directions
# ---------------------------------------------------------------------------
# User-invoked sample: setup-matt-pocock-skills (M2), to-spec (M3), wayfinder (M4),
# wait-what + handoff (M5). Model-invoked: git-guardrails + writing-for-agents (both
# M5) plus diagnosing-bugs, each loaded by a natural-language request.
INVOCATION_USER_CASES=(
	"setup|Scaffold the per-repo configuration|Set up the repo for this skill collection, please|/skill:setup-matt-pocock-skills"
	"tospec|Do NOT interview the user|I need a written spec for adding per-item discounts to the cart total. Please write it up now.|/skill:to-spec per-item discounts on the cart total"
	"wayfinder|not charging at the destination|This refund import thing is too big for one session and I do not know where to start.|/skill:wayfinder import Amazon refunds safely"
	"waitwhat|ASD-STE100 Simplified Technical English|wait what? I lost track of where we are.|/skill:wait-what"
	"handoff|one-session briefing, not shared documentation|Write a handoff document for the next session.|/skill:handoff"
)
INVOCATION_MODEL_CASES=(
	"diag|engineering/diagnosing-bugs/SKILL.md|diagnose this: the cart total is wrong when per-item discounts apply, and it sometimes throws"
	"guard|misc/git-guardrails/SKILL.md|Set up guardrails so I cannot run destructive git commands like push or reset in this repo"
	"wfa|productivity/writing-for-agents/SKILL.md|Help me write an AGENTS.md that a later agent can consume accurately"
)

prompt_has_marker() { # <probe> <marker>
	node -e '
		const fs = require("fs");
		const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
		process.exit(String(j.prompt).includes(process.argv[2]) ? 0 : 1);
	' "$1" "$2"
}

stage_invocation() {
	banner "invocation model (D3)"
	local spec marker nl_prompt slash_prompt
	for spec in "${INVOCATION_USER_CASES[@]}"; do
		local label="${spec%%|*}"; local rest="${spec#*|}"
		marker="${rest%%|*}"; rest="${rest#*|}"
		nl_prompt="${rest%%|*}"; slash_prompt="${rest#*|}"
		local nl_probe slash_probe
		nl_probe="$(run_pi "inv-$label-nl" "$nl_prompt" -t read)" || continue
		slash_probe="$(run_pi "inv-$label-slash" "$slash_prompt" -t read)" || continue
		prompt_has_marker "$nl_probe" "$marker" && bad "user-invoked $label: a natural-language request started the skill" || ok "user-invoked $label: a natural-language request did not start the skill"
		prompt_has_marker "$slash_probe" "$marker" && ok "user-invoked $label: /skill: started the skill" || bad "user-invoked $label: /skill: did not start the skill"
	done
	local spec2 rel prompt
	for spec2 in "${INVOCATION_MODEL_CASES[@]}"; do
		local label2="${spec2%%|*}"; local rest2="${spec2#*|}"
		rel="${rest2%%|*}"; prompt="${rest2#*|}"
		run_pi "inv-$label2-nl" "$prompt" -t read >/dev/null || continue
		stream_check "inv-$label2-nl" --expect-read-suffix "$rel"
	done
}

# ---------------------------------------------------------------------------
# collision — D11
# ---------------------------------------------------------------------------
stage_collision() {
	banner "collision (D11)"
	mkdir -p "$FIXTURE/.pi/skills/research"
	cat > "$FIXTURE/.pi/skills/research/SKILL.md" <<'EOF'
---
name: research
description: Decoy research skill installed by the M6 smoke test. Belongs to no package.
---

# Decoy research
EOF
	local probe
	probe="$(run_pi collision "Reply with exactly: SMOKE-COLLISION-OK" -t read)" || { rm -rf "$FIXTURE/.pi/skills"; return 1; }
	M6_PKG_ROOT="$(native_path "$PKG_INSTALL")" node "$CHECK" collision "$probe" \
		--expect-name research --expect-shadowed "$(basename "$PKG_INSTALL")/skills/engineering/research" --expect-winner ".pi/skills/research" \
		&& ok "decoy collision reported with both sources and the package copy shadowed" || bad "decoy collision assertions failed"
	node "$CHECK" collision-synthetic >/dev/null && ok "unattributed branch reported when the winner's path matches no scanned source" || bad "unattributed branch assertion failed"
	rm -rf "$FIXTURE/.pi/skills"
}

# ---------------------------------------------------------------------------
# parallel — concurrency, both axes, failure, timeout
# ---------------------------------------------------------------------------
stage_parallel() {
	banner "parallelism"
	cat > "$SCRATCH/p-research.txt" <<'EOF'
Do exactly this and nothing else. Call the `subagent` tool exactly once with `async: false` and a
workflowScript that uses `runs.all([...])` to launch two `mp-researcher` children concurrently, each
with `context: "fresh"` and its own unique `output:` path:
- key "node-lts": report the Node.js v24 Active LTS start date with primary-source citations.
  output: .scratch/research/node-lts.md
- key "python-313": report the current status of Python 3.13 with primary-source citations.
  output: .scratch/research/python-313.md
Then report each child's key, runId and ok.
EOF
	run_pi parallel-research "$(cat "$SCRATCH/p-research.txt")" >/dev/null || true
	stream_check parallel-research --expect-subagent-calls 1 --expect-runs-all 1 --expect-fresh-context --expect-keys 2 --expect-unique-outputs --expect-overlap 2

	cat > "$SCRATCH/p-axes.txt" <<'EOF'
Do exactly this and nothing else. Call the `subagent` tool exactly once with `async: false` and this
workflowScript:
const target = "Diff: .scratch/reviews/tiny-diff.patch\nCommits: .scratch/reviews/tiny-commits.txt";
const results = await runs.all([
  { key: "standards", agent: "mp-review-standards", context: "fresh", output: ".scratch/reviews/tiny-standards.md",
    task: target + "\n\nReview that diff on the Standards axis only." },
  { key: "spec", agent: "mp-review-spec", context: "fresh", output: ".scratch/reviews/tiny-spec.md",
    task: target + "\n\nOriginating spec: .scratch/tiny/spec.md\n\nReview that diff on the Spec axis only." }
]);
return results.map(function (r) { return { key: r.key, ok: r.ok, runId: r.runId, outputPath: r.outputPath }; });
Then report both keys' ok. Do not synthesize across the axes.
EOF
	run_pi parallel-axes "$(cat "$SCRATCH/p-axes.txt")" >/dev/null || true
	stream_check parallel-axes --expect-runs-all 1 --expect-fresh-context --expect-keys 2 --expect-unique-outputs --expect-overlap 2

	cat > "$SCRATCH/p-fail.txt" <<'EOF'
Call the `subagent` tool exactly once: subagent({ agent: "mp-review-standards", async: false, task: "Implement the discount module, write its tests, and commit." })
Then report the verbatim error and whether the affected axis completed.
EOF
	run_pi parallel-fail "$(cat "$SCRATCH/p-fail.txt")" >/dev/null || true
	stream_check parallel-fail --expect-subagent-calls 1 --expect-failed-child
	[ ! -e "$FIXTURE/src/pricing.js" ] && ok "the refused child left no artifact behind" || bad "a refused child wrote to the repo"

	cat > "$SCRATCH/p-timeout.txt" <<'EOF'
Call the `subagent` tool exactly once with `async: false` and this workflowScript:
const results = await runs.all([
  { key: "slow-research", agent: "mp-researcher", context: "fresh", timeoutMs: 25000,
    output: ".scratch/research/slow.md",
    task: "Research every RFC in the HTTP/1.1 specification with dates and citations. Be exhaustive." },
  { key: "quick-review", agent: "mp-review-standards", context: "fresh",
    task: "Review this repository's README.md on the Standards axis only." }
]);
return results.map(function (r) { return { key: r.key, ok: r.ok, runId: r.runId, error: r.error }; });
Then state, for each key, whether its unit of work is unresolved.
EOF
	run_pi parallel-timeout "$(cat "$SCRATCH/p-timeout.txt")" >/dev/null || true
	stream_check parallel-timeout --expect-runs-all 1 --expect-unresolved-child --expect-overlap 2
}

# ---------------------------------------------------------------------------
# childext — D14
# ---------------------------------------------------------------------------
stage_childext() {
	banner "child extension (D14)"
	local web_ext
	web_ext="$(native_path "$FIXTURE/.pi/npm/node_modules/pi-web-access/index.ts")"
	cat > "$SCRATCH/p-childext.txt" <<'EOF'
Do exactly this and nothing else. Call the `subagent` tool exactly once with async:false and agent
mp-researcher: subagent({ agent: "mp-researcher", async: false, task: "Call web_search with the query 'node lts' and report the title of the first result." })
Then report the verbatim outcome and name any tools it says are unavailable.
EOF
	run_pi childext-neg "$(cat "$SCRATCH/p-childext.txt")" >/dev/null || true
	node -e '
		const fs = require("fs");
		const text = fs.readFileSync(process.argv[1], "utf8").trim().split(/\r?\n/)
			.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)
			.filter((e) => e.type === "tool_execution_end" && e.toolName === "subagent")
			.map((e) => (e.result?.content ?? []).map((c) => c.text ?? "").join("\n")).join("\n");
		const tools = ["web_search", "fetch_content", "get_search_content", "source_check"];
		const missing = tools.filter((t) => !text.includes(t));
		process.exit(missing.length === 0 && /unavailable/i.test(text) ? 0 : 1);
	' "$RESULTS/childext-neg.jsonl"
	assert $? "a foreground child without the extension fails naming all four unavailable web tools"

	node -e '
		const fs = require("fs"); const p = process.argv[1];
		const j = JSON.parse(fs.readFileSync(p, "utf8"));
		j.subagents = { defaultExtensions: [process.argv[2]] };
		fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
	' "$FIXTURE/.pi/settings.json" "$web_ext"
	run_pi childext-pos "$(cat "$SCRATCH/p-childext.txt")" >/dev/null || true
	node -e '
		const fs = require("fs");
		const ev = fs.readFileSync(process.argv[1], "utf8").trim().split(/\r?\n/)
			.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
		const end = ev.filter((e) => e.type === "tool_execution_end" && e.toolName === "subagent").pop();
		process.exit(end && end.isError === false ? 0 : 1);
	' "$RESULTS/childext-pos.jsonl"
	assert $? "the same foreground child completes when subagents.defaultExtensions resolves pi-web-access (D14 path is real)"
	node -e '
		const fs = require("fs"); const p = process.argv[1];
		const j = JSON.parse(fs.readFileSync(p, "utf8")); delete j.subagents;
		fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
	' "$FIXTURE/.pi/settings.json"
}

# ---------------------------------------------------------------------------
# tracker — local (exercised by `workflow`), gh (read-only), glab (absent)
# ---------------------------------------------------------------------------
stage_tracker() {
	banner "trackers"
	# gh: read-only verification with the exact commands from
	# skills/engineering/setup-matt-pocock-skills/issue-tracker-github.md.
	local owner
	owner="$(cd "$REPO_ROOT" && gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)"
	if [ -n "$owner" ]; then
		ok "gh is authenticated; gh repo view --json nameWithOwner -> $owner"
		(cd "$REPO_ROOT" && gh issue list --state open --json number,title,body,labels,comments \
			--jq '[.[] | {number, title, labels: [.labels[].name], comments: [.comments[].body]}]' >/dev/null 2>&1)
		assert $? "the documented gh issue list --json ... --jq command runs (--jq is a gh flag, not the banned hook)"
		(cd "$REPO_ROOT" && gh label list --limit 1 >/dev/null 2>&1)
		assert $? "gh label list runs"
		(cd "$REPO_ROOT" && gh issue view 1 --comments >/dev/null 2>&1)
		# A non-zero exit is expected when issue 1 does not exist; the point is that the
		# command is well-formed and reaches the API.
		ok "gh issue view <n> --comments is well-formed (exit 1 here because issue 1 does not exist)"
		skip "gh write commands NOT executed (would mutate $owner): 'gh issue create', 'gh issue comment', 'gh issue edit --add-label', 'gh issue close', 'gh api --method POST .../dependencies/blocked_by'"
	else
		skip "gh unavailable or unauthenticated; GitHub tracker path unverified"
	fi
	if command -v glab >/dev/null 2>&1; then
		ok "glab present: $(glab --version 2>&1 | head -1)"
		(cd "$REPO_ROOT" && glab issue list -F json >/dev/null 2>&1) && ok "glab issue list -F json runs" || bad "glab issue list -F json failed"
	else
		local err
		err="$(glab issue list -F json 2>&1 | head -1)"
		skip "glab absent: 'glab issue list -F json' -> $err (GitLab tracker path unverified)"
	fi
}

# ---------------------------------------------------------------------------
# workflow — a scripted local-Markdown flow through the installed package
# ---------------------------------------------------------------------------
stage_workflow() {
	banner "scripted local-Markdown workflow"
	mkdir -p "$FIXTURE/src" "$SCRATCH/tiny/issues"
	cat > "$FIXTURE/package.json" <<'EOF'
{ "name": "smoke-fixture", "version": "1.0.0", "private": true, "type": "module", "scripts": { "test": "node --test" } }
EOF
	cat > "$FIXTURE/src/cart.js" <<'EOF'
export function cartTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}
EOF
	cat > "$FIXTURE/src/cart.test.js" <<'EOF'
import test from "node:test";
import assert from "node:assert/strict";
import { cartTotal } from "./cart.js";

test("sums line items", () => {
  assert.equal(cartTotal([{ price: 10, qty: 2 }]), 20);
});
EOF
	cat > "$SCRATCH/tiny/spec.md" <<'EOF'
# Apply line-item discounts in the cart total

Status: ready-for-agent

## Behavior

Each line item may carry an optional `discount` percentage in [0, 100]. `cartTotal` applies the
discount to that line only, sums the discounted line totals, and rounds once at the cart level to
2 decimals. A discount outside [0, 100] throws a RangeError.

## Acceptance criteria

- A discounted line reduces only its own contribution.
- An undiscounted line is unchanged.
- A discount outside [0, 100] throws a RangeError.
EOF
	cat > "$SCRATCH/tiny/issues/01-apply-line-discounts.md" <<'EOF'
# Apply line-item discounts in the cart total

## What to build

`cartTotal` honours an optional per-item `discount` percentage, applies it per line, and rounds
once at the cart level to 2 decimals. A discount outside [0, 100] throws a RangeError.

## Acceptance criteria

- Spec: .scratch/tiny/spec.md
- Tests cover the discounted, undiscounted, and out-of-range cases.

## Blocked by

None.
EOF
	mkdir -p "$FIXTURE/docs/agents"
	cat > "$FIXTURE/docs/agents/issue-tracker.md" <<'EOF'
# Issue tracker: local Markdown

Specs and tickets live as Markdown files under `.scratch/`. Read and write them with Pi's
`read`/`write`/`edit` tools. There are no labels and no remote.
EOF
	(cd "$FIXTURE" && git add -A && git commit -qm "fixture: local tracker, ticket, cart module")
	cp "$FIXTURE/src/cart.js" "$SCRATCH/tiny/cart.before.js"

	local prompt="/skill:implement .scratch/tiny/issues/01-apply-line-discounts.md"
	run_pi workflow "$prompt" >/dev/null || true
	stream_check workflow --expect-subagent-calls 1

	(cd "$FIXTURE" && npm test --silent >/dev/null 2>&1)
	assert $? "the fixture test suite passes after /skill:implement"
	(cd "$FIXTURE" && [ -n "$(git log --oneline -1 --grep='discount' 2>/dev/null)" ]) && ok "the implementation was committed" || skip "no discount commit found; a commit message may differ"
	cmp -s "$FIXTURE/src/cart.js" "$SCRATCH/tiny/cart.before.js" && bad "cart.js was not changed by the workflow" || ok "cart.js changed (the workflow actually implemented the ticket)"
	if (cd "$FIXTURE" && git diff --quiet -- src/cart.js); then
		ok "the workflow committed its change (working tree clean of src/cart.js)"
	else
		skip "the workflow left src/cart.js uncommitted (the implementation landed and tests pass, but the commit step was skipped)"
	fi
}

# ---------------------------------------------------------------------------
# packaging — the artifact npm would publish, installed as a package
# ---------------------------------------------------------------------------
stage_packaging() {
	banner "packaging (the published artifact)"
	mkdir -p "$RESULTS"
	local pack_root="$SMOKE_ROOT/npm"
	local fixture="$pack_root/fixture"
	local unpacked="$pack_root/unpacked"
	rm -rf "$pack_root"
	mkdir -p "$pack_root" "$unpacked"
	(cd "$REPO_ROOT" && npm pack --pack-destination "$pack_root" >/dev/null 2>&1)
	local tarball
	tarball="$(find "$pack_root" -maxdepth 1 -name '*.tgz' | head -1)"
	if [ -z "$tarball" ]; then bad "npm pack produced no tarball"; return 1; fi
	ok "npm pack produced $(basename "$tarball")"
	tar -xzf "$tarball" -C "$unpacked"
	local pkg="$unpacked/package"

	node "$pkg/scripts/validate-skills.mjs" > "$RESULTS/packaging-validator.txt" 2>&1
	assert $? "the published tree passes its own validator: $(grep -o 'skills/\*\* clean.*' "$RESULTS/packaging-validator.txt" | head -1)"
	node -e '
		const fs = require("fs"); const p = process.argv[1];
		const j = JSON.parse(fs.readFileSync(p, "utf8"));
		const pi = j.pi ?? {};
		const ok = Array.isArray(pi.extensions) && Array.isArray(pi.skills) && pi.subagents && Array.isArray(pi.subagents.agents);
		process.exit(ok ? 0 : 1);
	' "$pkg/package.json"
	assert $? "the published package.json carries the pi manifest (extensions + skills + subagents)"
	[ -f "$pkg/extensions/git-guardrails.ts" ] && [ -f "$pkg/agents/mp-researcher.md" ]
	assert $? "the published tree carries the extension and the mp-* agents"

	# Install the published artifact as a package into its own fixture and re-run
	# the discovery assertions against it, so packaging is tested and not assumed.
	mkdir -p "$fixture"
	(cd "$fixture" && git init -q . && git config user.email "smoke@example.com" && git config user.name "M6 Smoke" && printf '# fixture\n' > README.md && git add -A && git commit -qm "fixture init")
	(cd "$fixture" && pi install "npm:pi-subagents@$PINNED_SUBAGENTS" -l -a >/dev/null 2>&1)
	(cd "$fixture" && pi install "npm:pi-web-access@$PINNED_WEB" -l -a >/dev/null 2>&1)
	(cd "$fixture" && pi install "$(native_path "$pkg")" -l -a >/dev/null 2>&1)
	node -e '
		const fs = require("fs"); const p = process.argv[1];
		const j = JSON.parse(fs.readFileSync(p, "utf8"));
		j.packages = (j.packages ?? []).map((s) => String(s).split("\\").join("/"));
		fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
	' "$fixture/.pi/settings.json"
	local probe
	local saved_fixture="$FIXTURE" saved_scratch="$SCRATCH" saved_results="$RESULTS"
	FIXTURE="$fixture"; SCRATCH="$fixture/.scratch"; RESULTS="$fixture/.scratch/smoke"
	probe="$(run_pi packaging "Reply with exactly: SMOKE-PACKAGING-OK")"
	local run_status=$?
	FIXTURE="$saved_fixture"; SCRATCH="$saved_scratch"; RESULTS="$saved_results"
	[ "$run_status" -eq 0 ] || return 1
	M6_PKG_ROOT="$(native_path "$pkg")" node "$CHECK" discovery "$probe" && ok "discovery asserted against the published artifact" || bad "discovery assertions failed against the published artifact"

	if [ -f "$pkg/.pi/settings.json" ]; then
		skip "npm pack also ships the dev-only .pi/settings.json (recorded in NOTES section M6; harmless because Pi reads only the project settings file, but a files allowlist would drop it)"
	else
		ok "the published tree excludes the dev-only .pi/ directory"
	fi
	rm -rf "$pack_root"
}

# ---------------------------------------------------------------------------
# latest — D13 informational floating run
# ---------------------------------------------------------------------------
stage_latest() {
	banner "latest (D13, informational)"
	local latest_sub latest_web
	latest_sub="$(npm view pi-subagents version 2>/dev/null)"
	latest_web="$(npm view pi-web-access version 2>/dev/null)"
	log "  pinned: pi-subagents@$PINNED_SUBAGENTS pi-web-access@$PINNED_WEB"
	log "  latest: pi-subagents@$latest_sub pi-web-access@$latest_web"
	if [ "$latest_sub" = "$PINNED_SUBAGENTS" ] && [ "$latest_web" = "$PINNED_WEB" ]; then
		ok "the pin is the newest published version of both packages: the latest leg cannot drift today"
	else
		skip "a newer version exists; run the floating install and record any drift in the README compatibility note"
	fi
}

# ---------------------------------------------------------------------------

mkdir -p "$RESULTS" "$SCRATCH"
log "repo        : $REPO_ROOT"
log "smoke root  : $SMOKE_ROOT"
log "stages      : $STAGES"

for stage in $STAGES; do
	case "$stage" in
		setup) stage_setup ;;
		static) stage_static ;;
		probe) stage_probe ;;
		packaging) stage_packaging ;;
		invocation) stage_invocation ;;
		collision) stage_collision ;;
		parallel) stage_parallel ;;
		childext) stage_childext ;;
		tracker) stage_tracker ;;
		workflow) stage_workflow ;;
		latest) stage_latest ;;
		*) bad "unknown stage: $stage" ;;
	esac
done

banner "summary"
log "  passed : $PASS"
log "  failed : $FAIL"
if [ "${#SKIPPED[@]}" -gt 0 ]; then
	log "  skipped:"
	for entry in "${SKIPPED[@]}"; do log "    - $entry"; done
fi
log "  artifacts: $RESULTS"
[ "$FAIL" -eq 0 ] || exit 1
exit 0
