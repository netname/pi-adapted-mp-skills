#!/usr/bin/env node
/**
 * check.mjs — offline assertions for the M6 smoke tests.
 *
 * Test helper only; not package content and not shipped. It runs on bare Node
 * (built-ins only) against JSON produced by `scripts/probes/inspect.ts` and by
 * `pi --mode json`, so the same facts can be asserted on the pinned install, the
 * floating install, and the collision fixture without re-running Pi.
 *
 * Subcommands:
 *   discovery <snapshot.json>      D3 visibility, D11 provenance, tool availability
 *   collision <snapshot.json>      duplicate names across disk + Pi provenance (D11)
 *   collision-synthetic            the same scan on a fabricated shadowed input, to
 *                                  prove the "unattributed" branch is reachable
 *   stream <events.jsonl>          assertions over a `pi --mode json` event stream
 *
 * `M6_PKG_ROOT` (absolute, forward-slashed) points at the installed package copy
 * the snapshot was taken from. Exits 0 when every assertion passes.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SHIPPED_DISPOSITIONS = new Set(["port", "adapt", "rename"]);

const failures = [];
const passes = [];

function ok(message) {
  passes.push(message);
}

function fail(message) {
  failures.push(message);
}

function check(condition, message) {
  if (condition) ok(message);
  else fail(message);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function toPosix(p) {
  return String(p).split("\\").join("/");
}

function loadInventory(root) {
  const path = join(root, "docs", "skill-inventory.json");
  if (!existsSync(path)) {
    fail(`inventory not found under M6_PKG_ROOT (${toPosix(path)}); cannot derive the shipped set`);
    return null;
  }
  const inventory = readJson(path);
  const shipped = (inventory.skills ?? []).filter((r) => SHIPPED_DISPOSITIONS.has(r.disposition) && r.piPath && r.upstreamPath);
  return { inventory, shipped };
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next;
        i += 1;
      } else {
        flags[key] = true;
      }
    } else positional.push(argv[i]);
  }
  return { positional, flags };
}

// ---------------------------------------------------------------------------
// discovery — D3 visibility, D11 provenance, tool availability
// ---------------------------------------------------------------------------

function cmdDiscovery(snapshotPath) {
  const snapshot = readJson(snapshotPath);
  const pkgRoot = toPosix(process.env.M6_PKG_ROOT ?? REPO_ROOT);
  const loaded = loadInventory(process.env.M6_PKG_ROOT ?? REPO_ROOT);
  if (!loaded) return;
  const { shipped } = loaded;

  const expectedCount = Number(process.env.M6_EXPECT_SKILLS ?? 26);
  check(shipped.length === expectedCount, `inventory ships ${shipped.length} skills (expected ${expectedCount})`);

  const missingFiles = shipped.filter((row) => !existsSync(join(process.env.M6_PKG_ROOT ?? REPO_ROOT, row.piPath)));
  check(missingFiles.length === 0, `every shipped piPath exists in the installed copy (missing: ${missingFiles.map((r) => r.piPath).join(", ") || "none"})`);

  const skillCommands = (snapshot.commands ?? []).filter((c) => c.source === "skill" && String(c.name).startsWith("skill:"));
  const byName = new Map(skillCommands.map((c) => [String(c.name).slice("skill:".length), c]));

  const unresolved = [];
  const wrongProvenance = [];
  for (const row of shipped) {
    const name = row.disposition === "rename" && row.renameTarget ? row.renameTarget : row.upstreamName;
    const found = byName.get(name);
    if (!found) unresolved.push(name);
    else if (found.origin !== "package" || !toPosix(found.path ?? "").startsWith(pkgRoot)) {
      wrongProvenance.push(`${name} -> origin=${found.origin} path=${found.path}`);
    }
  }
  check(unresolved.length === 0, `all ${shipped.length} shipped skills resolve as /skill:<name> (unresolved: ${unresolved.join(", ") || "none"})`);
  check(wrongProvenance.length === 0, `every package skill resolves to a path inside the installed copy (${wrongProvenance.join("; ") || "all inside " + pkgRoot})`);

  const options = new Set(snapshot.skillOptions ?? []);
  const missingOptions = shipped.map((r) => (r.disposition === "rename" && r.renameTarget ? r.renameTarget : r.upstreamName)).filter((n) => !options.has(n));
  check(missingOptions.length === 0, `all shipped skills are registered (missing from systemPromptOptions.skills: ${missingOptions.join(", ") || "none"})`);

  const visible = new Set(snapshot.visibleSkills ?? []);
  const userInvoked = shipped.filter((r) => r.disableModelInvocation === true);
  const modelInvoked = shipped.filter((r) => r.disableModelInvocation !== true);
  const nameOf = (r) => (r.disposition === "rename" && r.renameTarget ? r.renameTarget : r.upstreamName);

  const userLeaked = userInvoked.map(nameOf).filter((n) => visible.has(n));
  const modelHidden = modelInvoked.map(nameOf).filter((n) => !visible.has(n));
  check(userLeaked.length === 0, `no user-invoked skill appears in the rendered <available_skills> block (leaked: ${userLeaked.join(", ") || "none"})`);
  check(modelHidden.length === 0, `every model-invoked skill appears in the rendered <available_skills> block (hidden: ${modelHidden.join(", ") || "none"})`);
  ok(`visibility split: ${userInvoked.length} user-invoked hidden, ${modelInvoked.length} model-invoked visible`);

  const toolNames = new Set((snapshot.tools ?? []).map((t) => t.name));
  const required = ["read", "bash", "edit", "write", "subagent", "bg_wait", "web_search", "source_check", "fetch_content", "get_search_content"];
  const missingTools = required.filter((t) => !toolNames.has(t));
  check(missingTools.length === 0, `parent has every tool the ported skills use (missing: ${missingTools.join(", ") || "none"})`);

  const webTools = (snapshot.tools ?? []).filter((t) => ["web_search", "source_check", "fetch_content", "get_search_content"].includes(t.name));
  const webOutside = webTools.filter((t) => !toPosix(t.path ?? "").includes("pi-web-access"));
  check(webTools.length === 4 && webOutside.length === 0, `the four web tools are registered from pi-web-access (${webTools.map((t) => `${t.name}@${t.path}`).join(", ") || "none registered"})`);
}

// ---------------------------------------------------------------------------
// collision — D11 duplicate names with Pi provenance
// ---------------------------------------------------------------------------

/**
 * Pure scan: given `commands` (from `pi.getCommands()`) and `definitions`
 * (from the on-disk scan), report every duplicated skill name with its sources.
 * `pi.getCommands()` shows only the winner of a collision (the M2 finding), so
 * the on-disk scan is what makes the shadowed copies visible; when the winner's
 * path cannot be matched to a scanned definition the winner is reported as
 * unattributed rather than assumed.
 */
function scanCollisions({ commands, definitions }) {
  const byName = new Map();
  for (const definition of definitions) {
    if (!byName.has(definition.name)) byName.set(definition.name, []);
    byName.get(definition.name).push(definition);
  }
  const collisions = [];
  for (const [name, defs] of [...byName.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (defs.length < 2) continue;
    const command = commands.find((c) => c.source === "skill" && String(c.name) === `skill:${name}`);
    const winnerPath = command ? toPosix(command.path ?? "") : null;
    const winnerMatch = winnerPath ? defs.find((d) => toPosix(d.path) === winnerPath) : undefined;
    collisions.push({
      name,
      definitions: defs.map((d) => ({ path: toPosix(d.path), root: d.root })),
      winner: winnerPath,
      winnerSource: winnerMatch ? winnerMatch.root : null,
      shadowed: winnerMatch ? defs.filter((d) => d !== winnerMatch).map((d) => toPosix(d.path)) : defs.map((d) => toPosix(d.path)),
      attribution: winnerMatch ? "attributed" : "unattributed",
    });
  }
  return collisions;
}

function cmdCollision(snapshotPath, flags) {
  const snapshot = readJson(snapshotPath);
  const collisions = scanCollisions({ commands: snapshot.commands ?? [], definitions: snapshot.diskSkills ?? [] });
  console.log(JSON.stringify({ collisions, unresolvedSources: snapshot.unresolvedSources ?? [] }, null, 2));

  const expectName = flags["expect-name"];
  if (expectName) {
    const found = collisions.find((c) => c.name === expectName);
    check(Boolean(found), `collision for \`${expectName}\` is reported`);
    if (found) {
      check(found.definitions.length >= 2, `\`${expectName}\` reports every on-disk definition (${found.definitions.length})`);
      check(found.attribution === "attributed", `\`${expectName}\` winner is attributed to a scanned source (${found.winner ?? "no winner command"})`);
      const decoy = flags["expect-shadowed"];
      if (decoy) check(found.shadowed.some((p) => p.includes(decoy)), `\`${expectName}\` reports the shadowed copy at ${decoy}`);
      const pkg = flags["expect-winner"];
      if (pkg) check(String(found.winner ?? "").includes(pkg), `\`${expectName}\` winner is the decoy at ${pkg} (was ${found.winner})`);
    }
  }
}

function cmdCollisionSynthetic() {
  // Fabricated input: two definitions on disk, but Pi's command list names a
  // managed path that the scan never saw. The scan must say `unattributed`
  // rather than claim either on-disk copy won.
  const collisions = scanCollisions({
    commands: [{ name: "skill:research", source: "skill", path: "<managed>/pi-adapted-mp-skills/skills/engineering/research/SKILL.md" }],
    definitions: [
      { name: "research", path: "/fixture/.pi/skills/research/SKILL.md", root: ".pi/skills" },
      { name: "research", path: "/fixture/pkg/skills/engineering/research/SKILL.md", root: "project:npm:pkg" },
    ],
  });
  console.log(JSON.stringify({ collisions }, null, 2));
  const found = collisions.find((c) => c.name === "research");
  check(Boolean(found), "synthetic: duplicate `research` is detected");
  check(found?.attribution === "unattributed", `synthetic: unmatched winner is reported unattributed (got ${found?.attribution})`);
  check((found?.shadowed.length ?? 0) === 2, `synthetic: both on-disk copies are reported as shadowed (got ${found?.shadowed.length})`);
}

// ---------------------------------------------------------------------------
// stream — assertions over `pi --mode json` events
// ---------------------------------------------------------------------------

function parseStream(path) {
  const lines = readFileSync(path, "utf8").split(/\r?\n/).filter((l) => l.trim() !== "");
  const events = [];
  for (const line of lines) {
    try {
      events.push(JSON.parse(line));
    } catch {
      // Session files can contain non-event lines; ignore them.
    }
  }
  return events;
}

function summarizeStream(events) {
  const toolCalls = events.filter((e) => e.type === "tool_execution_start");
  const toolEnds = events.filter((e) => e.type === "tool_execution_end");
  const subagents = toolCalls.filter((e) => e.toolName === "subagent");
  const subagentEnds = toolEnds.filter((e) => e.toolName === "subagent");
  const reads = toolCalls
    .filter((e) => e.toolName === "read")
    .map((e) => toPosix(e.args?.path ?? e.args?.file_path ?? ""))
    .filter(Boolean);
  return { toolCalls, toolEnds, subagents, subagentEnds, reads };
}

/**
 * pi-subagents' own call trace for a workflow, e.g.
 *   "- run node-lts: started" / "- run node-lts: completed (<id>) in 49318ms".
 * The order of these lines is the runtime's own statement about overlap: if two
 * `started` lines appear before the first `completed` line, the children were in
 * flight at the same time.
 */
function parseCallTrace(summary) {
  const started = [];
  const completed = [];
  for (const end of summary.subagentEnds) {
    const text = (end.result?.content ?? []).map((c) => c?.text ?? "").join("\n");
    for (const match of text.matchAll(/^- run ([^:]+): started$/gm)) started.push({ index: match.index ?? 0, key: match[1].trim() });
    for (const match of text.matchAll(/^- run ([^:]+): (completed|failed|timed out|stopped)[^\n]*?(?:in (\d+)ms)?$/gm)) {
      completed.push({ index: match.index ?? 0, key: match[1].trim(), state: match[2], durationMs: match[3] ? Number(match[3]) : null });
    }
  }
  return { started, completed };
}

function cmdStream(path, flags) {
  const summary = summarizeStream(parseStream(path));
  const scripts = summary.subagents.map((e) => String(e.args?.workflowScript ?? e.args?.task ?? ""));
  const joined = scripts.join("\n---\n");

  console.log(
    JSON.stringify(
      {
        subagentCalls: summary.subagents.length,
        subagentErrors: summary.subagentEnds.filter((e) => e.isError).length,
        callTrace: parseCallTrace(summary),
        reads: summary.reads,
        args: summary.subagents.map((e) => e.args),
      },
      null,
      2,
    ),
  );

  if (flags["expect-subagent-calls"]) {
    const want = Number(flags["expect-subagent-calls"]);
    check(summary.subagents.length >= want, `observed ${summary.subagents.length} subagent call(s) (expected >= ${want})`);
  }
  if (flags["expect-runs-all"]) {
    const want = Number(flags["expect-runs-all"]);
    const count = (joined.match(/runs\.all\s*\(/g) ?? []).length;
    check(count >= want, `observed ${count} runs.all(...) fan-out(s) (expected >= ${want})`);
  }
  if (flags["expect-fresh-context"]) {
    const fresh = /context:\s*["']fresh["']/.test(joined);
    check(fresh, "the dispatch names an explicit fresh context");
  }
  if (flags["expect-keys"]) {
    const want = Number(flags["expect-keys"]);
    const keys = [...joined.matchAll(/key:\s*["']([^"']+)["']/g)].map((m) => m[1]);
    const unique = new Set(keys);
    check(unique.size >= want, `observed ${unique.size} distinct workflow keys (expected >= ${want}): ${[...unique].join(", ")}`);
  }
  if (flags["expect-unique-outputs"]) {
    const outputs = [...joined.matchAll(/output:\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]);
    check(outputs.length >= 2 && new Set(outputs).size === outputs.length, `output paths are present and unique (${outputs.join(", ") || "none"})`);
  }
  if (flags["expect-read-suffix"]) {
    const suffix = toPosix(flags["expect-read-suffix"]);
    check(summary.reads.some((p) => p.endsWith(suffix)), `a read call loaded ${suffix} (reads: ${summary.reads.join(", ") || "none"})`);
  }
  if (flags["expect-no-read-suffix"]) {
    const suffix = toPosix(flags["expect-no-read-suffix"]);
    check(!summary.reads.some((p) => p.endsWith(suffix)), `no read call loaded ${suffix} (reads: ${summary.reads.join(", ") || "none"})`);
  }
  if (flags["expect-failed-child"]) {
    const failed = summary.subagentEnds.filter((e) => e.isError).length;
    check(failed >= 1, `a child failure is visible in the stream (${failed} error event(s))`);
  }
  if (flags["expect-unresolved-child"]) {
    const trace = parseCallTrace(summary);
    const unresolved = trace.completed.filter((c) => c.state !== "completed");
    check(unresolved.length >= 1, `a child is reported unresolved in the call trace (${unresolved.map((c) => `${c.key}:${c.state}`).join(", ") || "none"})`);
  }
  if (flags["expect-overlap"]) {
    const want = Number(flags["expect-overlap"]);
    const trace = parseCallTrace(summary);
    const firstCompleted = trace.completed.length > 0 ? Math.min(...trace.completed.map((c) => c.index)) : Number.POSITIVE_INFINITY;
    const inFlight = trace.started.filter((s) => s.index < firstCompleted).length;
    const durations = trace.completed.map((c) => c.durationMs).filter((d) => typeof d === "number");
    const sum = durations.reduce((a, b) => a + b, 0);
    check(inFlight >= want, `pi-subagents' call trace shows ${inFlight} child(ren) started before the first completion (expected >= ${want}); durations ${durations.join("ms + ")}ms = ${sum}ms`);
  }
}

// ---------------------------------------------------------------------------

function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const [command, target] = positional;

  if (command === "discovery") cmdDiscovery(target);
  else if (command === "collision") cmdCollision(target, flags);
  else if (command === "collision-synthetic") cmdCollisionSynthetic();
  else if (command === "stream") cmdStream(target, flags);
  else {
    console.error("usage: check.mjs <discovery|collision|collision-synthetic|stream> <file> [flags]");
    process.exit(2);
  }

  if (process.env.M6_CHECK_QUIET !== "1") for (const line of passes) console.log(`  ok: ${line}`);
  if (failures.length > 0) {
    for (const line of failures) console.error(`  FAIL: ${line}`);
    console.error(`\n${failures.length} assertion(s) failed.`);
    process.exit(1);
  }
  console.log(`  ok: all assertions passed (${passes.length}).`);
}

main();
