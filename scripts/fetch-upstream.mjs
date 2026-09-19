#!/usr/bin/env node
/**
 * fetch-upstream.mjs — pinned-commit drift reporter (D9).
 *
 * Fetches the upstream commit recorded in `docs/skill-inventory.json` into a
 * disposable cache **outside this repository** (never vendored) and, for every
 * shipped row, reports whether the live upstream file now differs from the
 * ported file — and if so, where.
 *
 * This is a review aid, not a gate and not a rewriter:
 *   - it never edits, writes, or deletes anything inside this repository;
 *   - it exits 0 on drift by default (use `--strict` to opt into exit 1);
 *   - it distinguishes EXPECTED change regions (the D2 frontmatter block and
 *     the frozen D5 token substitutions, which are the whole point of a port)
 *     from REVIEW regions (everything else), so a deliberate adaptation does
 *     not drown a real upstream change.
 *
 * Cache convention (recorded in `upstream.cachePathUsed` / `upstream.cacheNote`):
 *   ../mp-upstream-c55ee46, relative to this repo's root, disposable, not vendored.
 *
 * Re-fetch by hand with:
 *   git clone https://github.com/mattpocock/skills.git ../mp-upstream-c55ee46
 *   git -C ../mp-upstream-c55ee46 checkout c55ee46073ed923f86ce59a5eb3b6d895095d1b7
 *
 * Dependency-free: Node built-ins plus `git`.
 *
 * Usage:
 *   node scripts/fetch-upstream.mjs [--cache <dir>] [--no-fetch] [--strict]
 *                                   [--json] [--show-diff] [--quiet]
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INVENTORY_PATH = join(ROOT, "docs", "skill-inventory.json");

/** Dispositions that mean "this row shipped in v1" (mirrors validator check 7). */
const SHIPPED_DISPOSITIONS = new Set(["port", "adapt", "rename"]);

/** Sidecars every upstream skill ships whose port is a deliberate drop (D2/D5-17). */
const DROPPED_SIDECARS = new Set(["agents/openai.yaml"]);

/**
 * Literal D5 substitutions, used only to classify a changed region as EXPECTED.
 * This is a review heuristic over the frozen map in §5/D5 — it is not a second
 * copy of the map and nothing here is applied to any file.
 */
const D5_LITERAL_SUBSTITUTIONS = [
  ["/clear", "/new"],
  ["CLAUDE.md", "AGENTS.md"],
  ["agents/openai.yaml", ""],
  ["argument-hint", ""],
  ["WebSearch", "web_search"],
  ["WebFetch", "fetch_content"],
  ["Glob", "find"],
  ["TodoWrite", "todo"],
  ["AskUserQuestion", "a plain conversation question"],
  ["OS temp directory", ".scratch/"],
  ["OS temp", ".scratch/"],
  ["sub-agent", "subagent"],
  ["sub-agents", "subagents"],
  ["sub agent", "subagent"],
  ["sub agents", "subagents"],
];

function parseArgs(argv) {
  const opts = { cache: null, fetch: true, strict: false, json: false, showDiff: false, quiet: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--cache") opts.cache = argv[++i];
    else if (arg === "--no-fetch") opts.fetch = false;
    else if (arg === "--strict") opts.strict = true;
    else if (arg === "--json") opts.json = true;
    else if (arg === "--show-diff") opts.showDiff = true;
    else if (arg === "--quiet") opts.quiet = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 34).map((l) => l.replace(/^ \* ?/, "")).join("\n"));
      process.exit(0);
    } else {
      console.error(`unknown argument: ${arg} (try --help)`);
      process.exit(2);
    }
  }
  return opts;
}

function git(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function toPosix(p) {
  return p.split("\\").join("/");
}

/** Split into lines, dropping a trailing empty line so `diff` sees no phantom newline. */
function toLines(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

/**
 * Ensure the disposable cache exists at the pinned commit. Returns
 * `{ dir, commit, fetched }`. Clones or checks out only when needed.
 */
function ensureCache(cacheDir, commit, allowFetch) {
  const refetch = [
    `git clone https://github.com/mattpocock/skills.git ${toPosix(cacheDir)}`,
    `git -C ${toPosix(cacheDir)} checkout ${commit}`,
  ].join(" && ");

  if (!existsSync(cacheDir)) {
    if (!allowFetch) {
      throw new Error(`cache ${toPosix(cacheDir)} does not exist and --no-fetch was given. Re-fetch with:\n  ${refetch}`);
    }
    execFileSync("git", ["clone", "https://github.com/mattpocock/skills.git", cacheDir], { stdio: ["ignore", "pipe", "pipe"] });
  } else if (!existsSync(join(cacheDir, ".git"))) {
    throw new Error(`cache ${toPosix(cacheDir)} exists but is not a git checkout; remove it and re-fetch:\n  ${refetch}`);
  }

  let head = "";
  try {
    head = git(["rev-parse", "HEAD"], cacheDir);
  } catch {
    head = "";
  }
  if (head === commit) return { dir: cacheDir, commit, fetched: false, refetch };

  if (!allowFetch) {
    throw new Error(`cache ${toPosix(cacheDir)} is at ${head || "<unknown>"}, not the pinned ${commit}, and --no-fetch was given. Re-fetch with:\n  ${refetch}`);
  }

  // The pinned commit may already be present locally; only fetch when it is not.
  try {
    git(["cat-file", "-e", `${commit}^{commit}`], cacheDir);
  } catch {
    git(["fetch", "--all", "--tags", "--quiet"], cacheDir);
  }
  git(["checkout", "--quiet", "--force", commit], cacheDir);
  head = git(["rev-parse", "HEAD"], cacheDir);
  if (head !== commit) {
    throw new Error(`could not check out ${commit} in ${toPosix(cacheDir)} (now at ${head}). Re-fetch with:\n  ${refetch}`);
  }
  return { dir: cacheDir, commit, fetched: true, refetch };
}

/**
 * Line diff via LCS. Returns `[{ type: "same" | "del" | "add", a, b, text }]`.
 * Bounded: above `MAX_CELLS` the pair is reported as wholly different rather
 * than allocating a huge table (no shipped file is anywhere near this size).
 */
const MAX_CELLS = 8_000_000;

function diffLines(aLines, bLines) {
  const n = aLines.length;
  const m = bLines.length;
  if (n * m > MAX_CELLS) return null;

  // lcs[i][j] = LCS length of a[i..] and b[j..], flattened for speed.
  const width = m + 1;
  const lcs = new Uint32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      lcs[i * width + j] =
        aLines[i] === bLines[j]
          ? lcs[(i + 1) * width + (j + 1)] + 1
          : Math.max(lcs[(i + 1) * width + j], lcs[i * width + (j + 1)]);
    }
  }

  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (aLines[i] === bLines[j]) {
      ops.push({ type: "same", a: i + 1, b: j + 1, text: aLines[i] });
      i += 1;
      j += 1;
    } else if (lcs[(i + 1) * width + j] >= lcs[i * width + (j + 1)]) {
      ops.push({ type: "del", a: i + 1, b: null, text: aLines[i] });
      i += 1;
    } else {
      ops.push({ type: "add", a: null, b: j + 1, text: bLines[j] });
      j += 1;
    }
  }
  while (i < n) {
    ops.push({ type: "del", a: i + 1, b: null, text: aLines[i] });
    i += 1;
  }
  while (j < m) {
    ops.push({ type: "add", a: null, b: j + 1, text: bLines[j] });
    j += 1;
  }
  return ops;
}

/** Group changed ops into contiguous hunks with up to `context` same-lines around them. */
function toHunks(ops, context = 2) {
  const hunks = [];
  let current = null;
  let trailingSame = 0;
  for (const op of ops) {
    if (op.type === "same") {
      if (current) {
        current.ops.push(op);
        trailingSame += 1;
        if (trailingSame > context * 2) {
          current.ops = current.ops.slice(0, current.ops.length - (trailingSame - context));
          hunks.push(current);
          current = null;
          trailingSame = 0;
        }
      }
      continue;
    }
    if (!current) {
      current = { ops: [] };
      trailingSame = 0;
    }
    current.ops.push(op);
  }
  if (current) hunks.push(current);
  return hunks.filter((h) => h.ops.some((o) => o.type !== "same"));
}

/** Frontmatter region as `[startLine, endLine]`, inclusive, or null. */
function frontmatterRange(lines) {
  if ((lines[0] ?? "").trim() !== "---") return null;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") return [1, i + 1];
  }
  return [1, lines.length];
}

function applyD5(text) {
  let out = text;
  for (const [from, to] of D5_LITERAL_SUBSTITUTIONS) {
    out = out.split(from).join(to);
  }
  // Bare `/skill-name` slash labels → `/skill:<name>` (D5-16). Idempotent: an
  // already-suffixed `/skill:<name>` is left alone so both sides of a D5-16
  // rewrite normalize to the same text.
  out = out.replace(/(^|[^/\w.-])\/(?!skill:)([a-z][a-z0-9]*(?:-[a-z0-9]+)*)\b/g, "$1/skill:$2");
  // `Skill tool` load instructions have no fixed replacement text (D4).
  out = out.replace(/\bSkill tool\b/g, "");
  return out;
}

function normalizeForCompare(text) {
  return applyD5(text).replace(/\s+/g, " ").trim();
}

/**
 * Classify a hunk. EXPECTED when the change is fully explained by the port's
 * mandated edits: the frontmatter block, or a D5/structural substitution.
 */
function classifyHunk(hunk, aFmRange, bFmRange) {
  const changed = hunk.ops.filter((o) => o.type !== "same");
  const aLines = changed.filter((o) => o.type === "del").map((o) => o.a);
  const bLines = changed.filter((o) => o.type === "add").map((o) => o.b);

  const inFm = (line, range) => range !== null && line !== null && line >= range[0] && line <= range[1];
  if (aLines.length > 0 && bLines.length > 0) {
    if (aLines.every((l) => inFm(l, aFmRange)) && bLines.every((l) => inFm(l, bFmRange))) {
      return { verdict: "EXPECTED", reason: "D2 frontmatter/metadata block" };
    }
  }
  // A frontmatter-only edit on one side (e.g. dropped field).
  if (aLines.every((l) => inFm(l, aFmRange)) && bLines.every((l) => inFm(l, bFmRange))) {
    return { verdict: "EXPECTED", reason: "D2 frontmatter/metadata block" };
  }

  const delText = changed.filter((o) => o.type === "del").map((o) => o.text).join("\n");
  const addText = changed.filter((o) => o.type === "add").map((o) => o.text).join("\n");

  if (normalizeForCompare(delText) === normalizeForCompare(addText)) {
    return { verdict: "EXPECTED", reason: "D5 token substitution" };
  }

  const delSet = changed.filter((o) => o.type === "del").map((o) => normalizeForCompare(o.text)).filter(Boolean).sort();
  const addSet = changed.filter((o) => o.type === "add").map((o) => normalizeForCompare(o.text)).filter(Boolean).sort();
  if (delSet.length > 0 && JSON.stringify(delSet) === JSON.stringify(addSet)) {
    return { verdict: "EXPECTED", reason: "D5 token substitution (line-set)" };
  }

  // A `Skill tool` load rewritten to a D4 relative load (the replacement text is
  // instruction-specific, so it is recognised structurally rather than literally).
  if (/\bSkill tool\b/.test(delText) && /SKILL\.md/.test(addText)) {
    return { verdict: "EXPECTED", reason: "D5-03/D4 cross-skill load rewrite" };
  }

  return { verdict: "REVIEW", reason: "not explained by the D2/D5 map" };
}

/** Compare one upstream/ported file pair. */
function comparePair(label, upstreamAbs, portedAbs) {
  const upstreamExists = existsSync(upstreamAbs) && statSync(upstreamAbs).isFile();
  const portedExists = existsSync(portedAbs) && statSync(portedAbs).isFile();

  if (!upstreamExists) {
    return { label, status: "MISSING-UPSTREAM", upstream: toPosix(relative(ROOT, upstreamAbs)), ported: toPosix(relative(ROOT, portedAbs)), hunks: [] };
  }
  if (!portedExists) {
    return { label, status: "MISSING-PORT", upstream: toPosix(relative(ROOT, upstreamAbs)), ported: toPosix(relative(ROOT, portedAbs)), hunks: [] };
  }

  const aText = readText(upstreamAbs);
  const bText = readText(portedAbs);
  if (aText === bText) {
    return { label, status: "VERBATIM", upstream: toPosix(relative(ROOT, upstreamAbs)), ported: toPosix(relative(ROOT, portedAbs)), hunks: [] };
  }

  const aLines = toLines(aText);
  const bLines = toLines(bText);
  const ops = diffLines(aLines, bLines);
  if (!ops) {
    return { label, status: "PATCHED", upstream: toPosix(relative(ROOT, upstreamAbs)), ported: toPosix(relative(ROOT, portedAbs)), hunks: [{ verdict: "REVIEW", reason: "file too large for the inline diff", ops: [] }] };
  }

  const aFm = frontmatterRange(aLines);
  const bFm = frontmatterRange(bLines);
  const hunks = toHunks(ops).map((hunk) => ({ ...classifyHunk(hunk, aFm, bFm), ops: hunk.ops }));
  return { label, status: "PATCHED", upstream: toPosix(relative(ROOT, upstreamAbs)), ported: toPosix(relative(ROOT, portedAbs)), hunks };
}

function hunkLines(hunk) {
  const dels = hunk.ops.filter((o) => o.type === "del").map((o) => o.a);
  const adds = hunk.ops.filter((o) => o.type === "add").map((o) => o.b);
  const aPart = dels.length ? `upstream ${dels[0]}${dels.length > 1 ? `-${dels[dels.length - 1]}` : ""}` : "";
  const bPart = adds.length ? `ported ${adds[0]}${adds.length > 1 ? `-${adds[adds.length - 1]}` : ""}` : "";
  return [aPart, bPart].filter(Boolean).join(" -> ");
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const inventory = JSON.parse(readText(INVENTORY_PATH));
  const pinned = inventory.upstream.commit;
  const recorded = inventory.upstream.cachePathUsed ?? "../mp-upstream-c55ee46";
  // Resolve the default cache against this script's root (the source checkout) and
  // fall back to the caller's cwd, so running from an installed copy still finds a
  // developer's cache. `--cache` always wins.
  const candidates = [resolve(ROOT, recorded), resolve(process.cwd(), recorded)];
  const cacheDir = opts.cache ? resolve(process.cwd(), opts.cache) : candidates.find((dir) => existsSync(dir)) ?? candidates[0];

  const cache = ensureCache(cacheDir, pinned, opts.fetch);

  const rows = (inventory.skills ?? []).filter((row) => SHIPPED_DISPOSITIONS.has(row.disposition) && row.piPath && row.upstreamPath);

  const pairs = [];
  for (const row of rows) {
    const upstreamDir = join(cache.dir, row.upstreamPath);
    const portedDir = dirname(join(ROOT, row.piPath));
    pairs.push({ label: `${row.upstreamName}/SKILL.md`, upstreamAbs: join(upstreamDir, "SKILL.md"), portedAbs: join(ROOT, row.piPath) });
    for (const sidecar of row.sidecars ?? []) {
      if (sidecar === "SKILL.md" || DROPPED_SIDECARS.has(sidecar)) continue;
      pairs.push({ label: `${row.upstreamName}/${sidecar}`, upstreamAbs: join(upstreamDir, sidecar), portedAbs: join(portedDir, sidecar) });
    }
  }

  const results = pairs.map((p) => comparePair(p.label, p.upstreamAbs, p.portedAbs));

  // Files that deliberately have no upstream counterpart, so drift reporting
  // cannot cover them: D16 contract-encoded agents and the D5-20 extension.
  const packageOnly = [];
  for (const [dir, note] of [
    ["agents", "D16 contract-encoded agent; no upstream counterpart"],
    ["extensions", "D5-20 substitution; new code, no upstream counterpart"],
  ]) {
    const abs = join(ROOT, dir);
    if (!existsSync(abs)) continue;
    for (const name of readdirSync(abs)) {
      if (name.startsWith(".")) continue;
      packageOnly.push({ path: `${dir}/${name}`, note });
    }
  }

  const drift = results.filter((r) => r.status !== "VERBATIM");
  const review = results.filter((r) => r.hunks.some((h) => h.verdict === "REVIEW"));
  const missingPort = results.filter((r) => r.status === "MISSING-PORT");
  const missingUpstream = results.filter((r) => r.status === "MISSING-UPSTREAM");

  if (opts.json) {
    console.log(JSON.stringify({
      pinned,
      cache: toPosix(relative(ROOT, cache.dir)),
      cacheFetched: cache.fetched,
      refetch: cache.refetch,
      rows: rows.length,
      pairs: results.length,
      verbatim: results.length - drift.length,
      patched: results.filter((r) => r.status === "PATCHED").length,
      missingPort: missingPort.length,
      missingUpstream: missingUpstream.length,
      reviewFiles: review.length,
      packageOnly,
      results: results.map((r) => ({ label: r.label, status: r.status, upstream: r.upstream, ported: r.ported, hunks: r.hunks.map((h) => ({ verdict: h.verdict, reason: h.reason, where: hunkLines(h) })) })),
    }, null, 2));
  } else if (!opts.quiet) {
    console.log(`pinned commit : ${pinned}`);
    console.log(`cache         : ${toPosix(relative(ROOT, cache.dir))}${cache.fetched ? " (fetched/reconciled)" : " (already at the pinned commit)"}`);
    console.log(`re-fetch with : ${cache.refetch.replace(/\n/g, "\n                ")}`);
    console.log(`shipped rows  : ${rows.length}  file pairs: ${results.length}`);
    console.log(`verbatim      : ${results.length - drift.length}   patched: ${results.filter((r) => r.status === "PATCHED").length}   missing port: ${missingPort.length}   missing upstream: ${missingUpstream.length}`);
    console.log(`files with a REVIEW region: ${review.length}`);
    console.log(`no upstream counterpart (not drift-checkable): ${packageOnly.map((p) => p.path).join(", ") || "none"}`);
    console.log("");
    for (const result of drift) {
      const expected = result.hunks.filter((h) => h.verdict === "EXPECTED").length;
      const reviewHunks = result.hunks.filter((h) => h.verdict === "REVIEW");
      const tag = result.status === "PATCHED" ? `PATCHED (${expected} expected region(s), ${reviewHunks.length} review region(s))` : result.status;
      console.log(`  ${result.ported}  <-  ${result.upstream}`);
      console.log(`    ${tag}`);
      for (const hunk of reviewHunks) {
        console.log(`      REVIEW ${hunkLines(hunk)}  (${hunk.reason})`);
        if (opts.showDiff) {
          for (const op of hunk.ops) {
            const marker = op.type === "del" ? "-" : op.type === "add" ? "+" : " ";
            console.log(`        ${marker} ${op.text}`);
          }
        }
      }
    }
    if (drift.length === 0) console.log("  (no drift)");
    console.log("");
    console.log("EXPECTED regions are the D2 frontmatter block and the frozen D5 substitutions;");
    console.log("REVIEW regions are changes not explained by the map and are what a human reads.");
  }

  const problems = missingPort.length + missingUpstream.length;
  if (opts.strict && (problems > 0 || review.length > 0)) process.exit(1);
  process.exit(0);
}

main();
