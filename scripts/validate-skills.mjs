#!/usr/bin/env node
/**
 * validate-skills.mjs — dependency-free validator for this package's `skills/**`.
 *
 * Runs on a bare Node install (no `npm install`, no runtime dependencies). It is
 * the static half of §7's validation strategy and enforces the frozen §5 contract:
 *
 *   0. D5 freeze     — recompute `tokenMap.hash` from `tokenMap.rows` and fail on drift.
 *   1. Frontmatter   — Pi-read keys only; `name` regex/length; `description` length.
 *   2. Dropped keys  — any field the inventory marks `droppedFrontmatter` (D2), plus
 *                      `argument-hint`, is a hard error anywhere under `skills/**`.
 *   3. Cross-skill   — every backticked `.../SKILL.md` reference resolves from the
 *                      referencing file's directory and names the right skill (D4).
 *   4. Forbidden     — `Skill tool`, `Task tool`, `/clear`, `CLAUDE.md`,
 *                      `agents/openai.yaml` anywhere under `skills/**`, sidecars
 *                      included, with no allowlist (D5).
 *   5. Invocation    — `disable-model-invocation: true` descriptions carry no
 *                      model-facing trigger phrasing (D2/D3).
 *   6. Duplicates    — no two skills under `skills/` declare the same `name` (D11).
 *   7. Inventory     — every ported `SKILL.md` maps to an inventory row with a
 *                      port/adapt/rename disposition and the expected `piPath`.
 *                      The expected name is `row.upstreamName`, except for the one
 *                      frozen D3 rename, where a `rename` row's expected name is its
 *                      recorded `renameTarget` — and only that name.
 *
 * The `ask-matt` carve-out is structural: its `/skill:<name>` router labels are not
 * backticked `.../SKILL.md` references, so check 3 never demands those targets
 * exist. Its raw `/clear` is still caught by check 4, like every other file.
 *
 * Usage: node scripts/validate-skills.mjs
 * Exits 0 when clean; exits 1 with `path:line: message` lines otherwise.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(ROOT, "skills");
const INVENTORY_PATH = join(ROOT, "docs", "skill-inventory.json");

/** Frontmatter keys Pi actually reads (docs/skills.md §Frontmatter). */
const PI_READ_KEYS = new Set([
  "name",
  "description",
  "license",
  "compatibility",
  "metadata",
  "allowed-tools",
  "disable-model-invocation",
]);

/**
 * D5 replacement table. Substitution is total: any occurrence under `skills/**`
 * is a porting error and there is no allowlist. `Task tool` is matched literally,
 * so Wayfinder's `**Task**` ticket type is never a false positive.
 */
const FORBIDDEN_TOKENS = [
  { token: "Skill tool", rule: "D5-03" },
  { token: "Task tool", rule: "D5-03 (literal `Task tool` only; a bare `Task` is not this token)" },
  { token: "/clear", rule: "D5-01 (use /new)", word: true },
  { token: "CLAUDE.md", rule: "D5-15 (use AGENTS.md)" },
  { token: "agents/openai.yaml", rule: "D5-17 (dropped by D2)" },
];

/**
 * Model-facing trigger phrasing. A user-invoked skill is hidden from the system
 * prompt (D3), so a description written to trigger the model describes a skill
 * the model can never choose. Kept deliberately narrow to avoid false positives
 * in ordinary one-line summaries.
 */
const MODEL_FACING_TRIGGERS = [
  /\buse (this|it) (when|whenever|for|if)\b/i,
  /\buse (when|whenever|for|if)\b/i,
  /\bwhen to use\b/i,
  /\buse this skill\b/i,
  /\btrigger(s|ed)? (when|on|for)\b/i,
];

const D4_SAME_BUCKET = /^\.\.\/([a-z0-9]+(?:-[a-z0-9]+)*)\/SKILL\.md$/;
const D4_CROSS_BUCKET = /^\.\.\/\.\.\/([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*)\/SKILL\.md$/;

const errors = [];
const notes = [];

/** Record a failure as `path:line: message` (path is repo-relative, forward-slashed). */
function fail(absPath, line, message) {
  const rel = toPosix(relative(ROOT, absPath));
  errors.push(`${rel}:${line}: ${message}`);
}

function toPosix(p) {
  return p.split("\\").join("/");
}

function readText(absPath) {
  return readFileSync(absPath, "utf8");
}

/** Recursively list every regular file under `dir` (sorted, stable output). */
function listFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(abs));
    else if (entry.isFile()) out.push(abs);
  }
  return out;
}

/**
 * Minimal YAML frontmatter reader covering the shapes this repo writes:
 * top-level scalars, quoted scalars, block scalars (`|` / `>`), and nested
 * mappings/lists (whose indented lines are skipped). Returns `null` when the
 * file does not open with a `---` fence.
 */
function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if ((lines[0] ?? "").trim() !== "---") return null;
  let end = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      end = i;
      break;
    }
  }
  if (end === -1) return { error: "unterminated frontmatter fence", keys: [], data: {}, bodyStartLine: 2 };

  const fm = lines.slice(1, end);
  const keys = [];
  const data = {};

  for (let i = 0; i < fm.length; i += 1) {
    const match = /^([A-Za-z0-9_.-]+):(.*)$/.exec(fm[i]);
    if (!match) continue; // indented continuation / nested line
    const key = match[1];
    const rest = match[2];
    let value;
    if (/^\s*[|>][-+]?\s*$/.test(rest)) {
      const buf = [];
      let j = i + 1;
      while (j < fm.length && (fm[j].trim() === "" || /^\s+/.test(fm[j]))) {
        buf.push(fm[j].replace(/^\s+/, ""));
        j += 1;
      }
      value = buf.join("\n").trim();
      i = j - 1;
    } else {
      value = rest.trim().replace(/^["']/, "").replace(/["']$/, "");
    }
    keys.push({ key, line: i + 2 });
    data[key] = value;
    // Skip any nested mapping/list body belonging to this key.
    let j = i + 1;
    while (j < fm.length && /^\s+\S/.test(fm[j])) j += 1;
    i = j - 1;
  }
  return { keys, data, bodyStartLine: end + 2, text };
}

function frontmatterName(absPath) {
  const fm = parseFrontmatter(readText(absPath));
  return fm?.data?.name ?? null;
}

function lineOfKey(fm, key, fallback) {
  const found = (fm?.keys ?? []).find((k) => k.key === key);
  return found ? found.line : fallback;
}

// ---------------------------------------------------------------------------
// Check 0 — D5 freeze
// ---------------------------------------------------------------------------

function checkD5Freeze() {
  if (!existsSync(INVENTORY_PATH)) {
    fail(INVENTORY_PATH, 0, "inventory missing; cannot verify the D5 freeze");
    return null;
  }
  let inventory;
  try {
    inventory = JSON.parse(readText(INVENTORY_PATH));
  } catch (error) {
    fail(INVENTORY_PATH, 0, `inventory is not valid JSON: ${error.message}`);
    return null;
  }
  const map = inventory.tokenMap;
  if (!map || !Array.isArray(map.rows)) {
    fail(INVENTORY_PATH, 0, "tokenMap.rows missing; cannot verify the D5 freeze");
    return inventory;
  }
  const canonical = JSON.stringify(map.rows.map((r) => [r.rowId, r.upstream, r.pi]));
  const actual = createHash("sha256").update(canonical).digest("hex");
  if (actual !== map.hash) {
    fail(
      INVENTORY_PATH,
      0,
      `D5 tokenMap hash drift: tokenMap.hash is ${map.hash} but the rows hash to ${actual}. ` +
        "D1-D16 are frozen; do not edit the D5 table outside the sanctioned append path.",
    );
  } else {
    notes.push(`D5 tokenMap v${map.version ?? "?"} frozen hash matches (${actual}).`);
  }
  return inventory;
}

// ---------------------------------------------------------------------------
// Checks 1 + 2 — frontmatter and dropped fields
// ---------------------------------------------------------------------------

function checkFrontmatter(absPath, fm, droppedSet, isSkillFile) {
  if (!fm) {
    fail(absPath, 1, "missing YAML frontmatter (`---` fence is required).");
    return null;
  }
  if (fm.error) {
    fail(absPath, 1, fm.error);
    return null;
  }

  // D2: never carry an upstream-only field, wherever it appears in a SKILL.md.
  if (isSkillFile) {
    for (const { key, line } of fm.keys) {
      if (key === "argument-hint" || droppedSet.has(key)) {
        fail(absPath, line, `dropped frontmatter field \`${key}\` (D2): Pi does not read it and ignores it silently.`);
      } else if (!PI_READ_KEYS.has(key)) {
        fail(absPath, line, `unknown frontmatter key \`${key}\`: Pi reads only ${[...PI_READ_KEYS].join(", ")}.`);
      }
    }

    const name = fm.data.name;
    const nameLine = lineOfKey(fm, "name", 2);
    if (!name) {
      fail(absPath, nameLine, "frontmatter `name` is required.");
    } else {
      if (name.length > 64) fail(absPath, nameLine, `name is ${name.length} chars; the limit is 64.`);
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
        fail(absPath, nameLine, `name \`${name}\` must match ^[a-z0-9]+(-[a-z0-9]+)*$ (lowercase, single hyphens, no edge hyphens).`);
      }
    }

    const description = fm.data.description;
    const descriptionLine = lineOfKey(fm, "description", 2);
    if (!description) {
      fail(absPath, descriptionLine, "frontmatter `description` is required.");
    } else if (description.length > 1024) {
      fail(absPath, descriptionLine, `description is ${description.length} chars; the limit is 1024.`);
    } else if (String(fm.data["disable-model-invocation"]).toLowerCase() === "true") {
      // Check 5 — invocation/description consistency (D2/D3).
      for (const pattern of MODEL_FACING_TRIGGERS) {
        if (pattern.test(description)) {
          fail(
            absPath,
            descriptionLine,
            `user-invoked skill has model-facing trigger phrasing in its description (${pattern}); ` +
              "user-invoked descriptions are one-line summaries (D2/D3).",
          );
          break;
        }
      }
    }
  }
  return fm.data.name ?? null;
}

// ---------------------------------------------------------------------------
// Check 3 — cross-skill `.../SKILL.md` references (D4)
// ---------------------------------------------------------------------------

function bucketOfSkillFile(absPath) {
  const rel = toPosix(relative(SKILLS_DIR, absPath));
  const parts = rel.split("/");
  // <bucket>/<name>/SKILL.md
  return parts.length >= 3 ? parts[0] : null;
}

function checkCrossSkillReferences(absPath, text) {
  const bucket = bucketOfSkillFile(absPath);
  const re = /`([^`\n]+)`/g;
  let match;
  let count = 0;
  while ((match = re.exec(text)) !== null) {
    const ref = match[1].trim();
    if (!ref.endsWith("/SKILL.md") || !ref.startsWith("../")) continue;
    count += 1;
    const line = text.slice(0, match.index).split("\n").length;

    const same = D4_SAME_BUCKET.exec(ref);
    const cross = D4_CROSS_BUCKET.exec(ref);
    if (!same && !cross) {
      fail(absPath, line, `unrecognised cross-skill reference \`${ref}\`; use ../<name>/SKILL.md or ../../<bucket>/<name>/SKILL.md (D4).`);
      continue;
    }
    const expectedName = same ? same[1] : cross[2];
    const expectedBucket = same ? bucket : cross[1];
    if (same && expectedBucket !== null && expectedBucket !== bucket) {
      fail(absPath, line, `\`${ref}\` uses the same-bucket form for a cross-bucket target; write ../../${expectedBucket}/${expectedName}/SKILL.md (D4).`);
    }
    if (cross && expectedBucket === bucket) {
      fail(absPath, line, `\`${ref}\` uses the cross-bucket form for a same-bucket target; write ../${expectedName}/SKILL.md (D4).`);
    }

    const target = resolve(dirname(absPath), ref);
    if (!existsSync(target)) {
      fail(absPath, line, `dangling cross-skill reference \`${ref}\` (resolves to ${toPosix(relative(ROOT, target))}).`);
      continue;
    }
    const targetName = frontmatterName(target);
    if (!targetName) {
      fail(absPath, line, `cross-skill target \`${ref}\` has no readable frontmatter name.`);
    } else if (targetName !== expectedName) {
      fail(absPath, line, `cross-skill reference \`${ref}\` names \`${expectedName}\` but the target declares name \`${targetName}\` (D4).`);
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Check 4 — forbidden tokens, no allowlist (D5)
// ---------------------------------------------------------------------------

function checkForbiddenTokens(absPath, text) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    for (const { token, rule, word } of FORBIDDEN_TOKENS) {
      const hit = word ? new RegExp(`${escapeRegExp(token)}(?![\\w-])`).test(line) : line.includes(token);
      if (hit) {
        fail(absPath, i + 1, `forbidden token \`${token}\` (${rule}); substitution is total and has no allowlist.`);
      }
    }
  }
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// Check 6 — duplicate names (D11)
// ---------------------------------------------------------------------------

function checkDuplicateNames(skillFiles) {
  const seen = new Map();
  for (const file of skillFiles) {
    const name = frontmatterName(file);
    if (!name) continue;
    if (seen.has(name)) {
      fail(file, lineOfKey(parseFrontmatter(readText(file)) ?? { keys: [] }, "name", 2), `duplicate skill name \`${name}\`; also declared by ${toPosix(relative(ROOT, seen.get(name)))} (D11).`);
    } else {
      seen.set(name, file);
    }
  }
}

// ---------------------------------------------------------------------------
// Check 7 — inventory consistency
// ---------------------------------------------------------------------------

const PORTED_DISPOSITIONS = new Set(["port", "adapt", "rename"]);

function checkInventoryConsistency(inventory, skillFiles) {
  if (!inventory) return;
  const rows = Array.isArray(inventory.skills) ? inventory.skills : [];
  for (const file of skillFiles) {
    const rel = toPosix(relative(ROOT, file));
    const row = rows.find((r) => r.piPath === rel);
    if (!row) {
      fail(file, 1, `no inventory row with piPath \`${rel}\`; add one before porting (docs/skill-inventory.json).`);
      continue;
    }
    if (!PORTED_DISPOSITIONS.has(row.disposition)) {
      fail(file, 1, `inventory row \`${row.upstreamName}\` has disposition \`${row.disposition}\`; only port/adapt/rename may be shipped.`);
    }
    const name = frontmatterName(file);
    // D11 keeps names verbatim, with the single exception D3 and D11 both authorise:
    // a `rename` row's expected name is its recorded `renameTarget`, never the
    // upstream name. Checked before the comparison so a malformed rename row is
    // reported rather than silently falling back to the verbatim rule.
    if (row.disposition === "rename" && !row.renameTarget) {
      fail(file, 1, `inventory row \`${row.upstreamName}\` has disposition \`rename\` but records no \`renameTarget\`.`);
    }
    const expectedName = row.disposition === "rename" && row.renameTarget ? row.renameTarget : row.upstreamName;
    if (name && expectedName && name !== expectedName) {
      const rule =
        row.disposition === "rename"
          ? `D3 renames \`${row.upstreamName}\` to \`${row.renameTarget}\`, so the upstream name is not accepted here`
          : `D11 keeps names verbatim (inventory upstreamName \`${row.upstreamName}\`)`;
      fail(file, 1, `frontmatter name \`${name}\` differs from the expected name \`${expectedName}\`: ${rule}.`);
    }
    const bucket = rel.split("/")[1];
    if (row.bucket && bucket !== row.bucket) {
      fail(file, 1, `file lives under \`skills/${bucket}/\` but the inventory bucket is \`${row.bucket}\`.`);
    }
    for (const load of row.crossSkillLoads ?? []) {
      if (!load.d4Path) continue; // user-handoff / router labels are not load instructions (M2 constraint).
      if (!readText(file).includes(`\`${load.d4Path}\``)) {
        fail(file, 1, `inventory records d4Path \`${load.d4Path}\` for target \`${load.target}\` but the file does not use it (D4).`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const inventory = checkD5Freeze();
  const droppedSet = new Set(["argument-hint"]);
  for (const row of inventory?.skills ?? []) {
    for (const field of row.droppedFrontmatter ?? []) droppedSet.add(field);
  }

  const allFiles = listFiles(SKILLS_DIR);
  const skillFiles = allFiles.filter((f) => f.endsWith(`${"/"}SKILL.md`) || f.endsWith("\\SKILL.md"));

  for (const file of allFiles) {
    const text = readText(file);
    if (file.endsWith("SKILL.md")) {
      const fm = parseFrontmatter(text);
      checkFrontmatter(file, fm, droppedSet, true);
    }
    checkCrossSkillReferences(file, text);
    checkForbiddenTokens(file, text);
  }

  checkDuplicateNames(skillFiles);
  checkInventoryConsistency(inventory, skillFiles);

  for (const note of notes) console.log(`info: ${note}`);
  if (errors.length > 0) {
    for (const line of errors) console.error(line);
    console.error(`\n${errors.length} error(s) across ${allFiles.length} file(s) under skills/.`);
    process.exit(1);
  }
  console.log(`ok: skills/** clean (${allFiles.length} file(s) scanned, ${skillFiles.length} SKILL.md).`);
}

main();
