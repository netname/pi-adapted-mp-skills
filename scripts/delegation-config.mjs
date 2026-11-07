// Role rows as data: a project's docs/agents/delegation.json. Pure functions only; herdr-delegate.mjs
// uses them for `launch --config`, `inspect` and the `config` subcommands. The policy they encode is
// in skills/engineering/_shared/DELEGATION.md. A valid file proves the settings are consistent, not
// that the host can run them: `config probe` and `inspect` check the host and the actual run.

import { isAbsolute } from 'node:path';

/** Roles the helper can launch. */
export const LAUNCH_ROLES = ['implementation', 'research', 'spec-review', 'standards-review', 'design-comprehension', 'design-challenge', 'exploration', 'evidence-audit'];
/** Roles a config may describe: the coordinator's own session plus every launchable role. */
export const CONFIG_ROLES = ['planning', ...LAUNCH_ROLES];
/** Roles that only read their target. Their row must use the read-only tool profile. */
export const READ_ONLY_ROLES = ['spec-review', 'standards-review', 'design-comprehension', 'design-challenge', 'exploration', 'evidence-audit'];

/** Harness flags for each tool profile. The two harnesses name the same tools differently. */
export const TOOL_PROFILES = {
  pi: { 'read-only': ['--tools', 'read,grep,find,ls'], full: [] },
  claude: { 'read-only': ['--tools', 'Read,Grep,Glob', '--permission-mode', 'dontAsk'], full: [] },
};
// Derived from `model` and `tools`; a row may not also set them through extraArgs.
const DERIVED_FLAGS = ['--model', '--tools', '--permission-mode'];
// `provider/id`, the form `inspect` reports.
const MODEL = /^[a-z0-9][a-z0-9._-]*\/[A-Za-z0-9][\w.:@+-]*$/;
const LIMITS = ['implementationWorkers', 'researchWorkers', 'repairAttempts', 'batchTimeoutMs', 'interactiveWaitMs'];
const TIMEOUT = { low: 10_000, high: 24 * 60 * 60 * 1000 };
const ROW_KEYS = ['harness', 'mode', 'model', 'family', 'tools', 'extraArgs', 'timeoutMs'];
const HARNESS_NAMES = { pi: 'Pi', claude: 'Claude Code' };

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const text = v => typeof v === 'string' && v.trim().length > 0;
const positiveInt = v => Number.isInteger(v) && v > 0;
const sameFamily = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
export const available = row => isObject(row) && !('unavailable' in row);

function checkRow(role, row, errors) {
  const at = `roles.${role}`;
  if (!isObject(row)) { errors.push(`${at}: must be an object`); return false; }
  if ('unavailable' in row) {
    if (!text(row.unavailable)) errors.push(`${at}.unavailable: give the reason as text`);
    if (Object.keys(row).length > 1) errors.push(`${at}: an unavailable role has only the "unavailable" reason`);
    return false;
  }
  const before = errors.length;
  for (const k of Object.keys(row)) if (!ROW_KEYS.includes(k)) errors.push(`${at}.${k}: unknown setting`);
  if (!['pi', 'claude'].includes(row.harness)) errors.push(`${at}.harness: must be "pi" or "claude"`);
  if (role === 'planning') { if (row.mode !== 'coordinator') errors.push(`${at}.mode: must be "coordinator" (the planning session is started by hand, not launched)`); }
  else if (!['interactive', 'batch'].includes(row.mode)) errors.push(`${at}.mode: must be "interactive" or "batch"`);
  if (!(typeof row.model === 'string' && MODEL.test(row.model))) errors.push(`${at}.model: write the exact model as provider/id, the form inspect reports (got ${JSON.stringify(row.model)})`);
  else if (row.harness === 'claude' && !row.model.startsWith('anthropic/')) errors.push(`${at}.model: a Claude Code model is reported as anthropic/<id>`);
  if (!text(row.family)) errors.push(`${at}.family: name the model family (for example Claude or DeepSeek)`);
  if (row.tools !== undefined && !['read-only', 'full'].includes(row.tools)) errors.push(`${at}.tools: must be "read-only" or "full"`);
  if (READ_ONLY_ROLES.includes(role) && row.tools !== 'read-only') errors.push(`${at}.tools: ${role} only reads its target; set "read-only"`);
  if (row.extraArgs !== undefined) {
    if (!Array.isArray(row.extraArgs) || !row.extraArgs.every(a => typeof a === 'string')) errors.push(`${at}.extraArgs: must be a list of strings`);
    else for (const a of row.extraArgs) if (DERIVED_FLAGS.some(f => a === f || a.startsWith(`${f}=`))) errors.push(`${at}.extraArgs: ${a} comes from "model"/"tools"; set it there`);
  }
  if (row.timeoutMs !== undefined) {
    if (row.mode !== 'batch') errors.push(`${at}.timeoutMs: applies to batch rows only`);
    else if (!Number.isInteger(row.timeoutMs) || row.timeoutMs < TIMEOUT.low || row.timeoutMs > TIMEOUT.high) errors.push(`${at}.timeoutMs: must be an integer in [${TIMEOUT.low}, ${TIMEOUT.high}]`);
  }
  return errors.length === before;
}

/** Every problem in a parsed config, as readable messages; empty when it is valid. */
export function validateConfig(cfg) {
  const errors = [];
  if (!isObject(cfg)) return ['the config must be a JSON object'];
  for (const k of Object.keys(cfg)) if (!['schemaVersion', 'herdrSession', 'evidenceDir', 'limits', 'worktreeSetup', 'families', 'roles'].includes(k)) errors.push(`${k}: unknown setting`);
  if (cfg.families !== undefined) {
    if (!isObject(cfg.families)) errors.push('families: must map a family name to a regular expression for its provider/id models');
    else for (const [name, pattern] of Object.entries(cfg.families)) {
      if (!text(pattern)) { errors.push(`families.${name}: give a regular expression`); continue; }
      try { new RegExp(pattern); } catch (e) { errors.push(`families.${name}: not a valid regular expression: ${e.message}`); }
    }
  }
  if (cfg.schemaVersion !== 1) errors.push('schemaVersion: must be 1');
  if (cfg.herdrSession !== undefined && !text(cfg.herdrSession)) errors.push('herdrSession: must be a session name');
  if (!(text(cfg.evidenceDir) && isAbsolute(cfg.evidenceDir))) errors.push('evidenceDir: must be the absolute, Git-ignored directory for run records');
  if (cfg.worktreeSetup !== undefined && !text(cfg.worktreeSetup)) errors.push('worktreeSetup: must be a command');
  if (cfg.limits !== undefined) {
    if (!isObject(cfg.limits)) errors.push('limits: must be an object');
    else for (const [k, v] of Object.entries(cfg.limits)) {
      if (!LIMITS.includes(k)) errors.push(`limits.${k}: unknown limit`);
      else if (!positiveInt(v)) errors.push(`limits.${k}: must be a positive integer`);
    }
    if (isObject(cfg.limits) && cfg.limits.batchTimeoutMs !== undefined && positiveInt(cfg.limits.batchTimeoutMs)
      && (cfg.limits.batchTimeoutMs < TIMEOUT.low || cfg.limits.batchTimeoutMs > TIMEOUT.high)) errors.push(`limits.batchTimeoutMs: must be in [${TIMEOUT.low}, ${TIMEOUT.high}]`);
  }
  if (!isObject(cfg.roles)) { errors.push('roles: must be an object keyed by role'); return errors; }
  const valid = {};
  for (const [role, row] of Object.entries(cfg.roles)) {
    if (!CONFIG_ROLES.includes(role)) { errors.push(`roles.${role}: unknown role; use one of ${CONFIG_ROLES.join(', ')}`); continue; }
    if (checkRow(role, row, errors)) valid[role] = row;
  }
  // A family's pattern, when given, ties the self-declared family to the model it names.
  for (const [role, row] of Object.entries(valid)) {
    const pattern = familyPattern(cfg, row.family);
    if (pattern && !new RegExp(pattern).test(row.model)) errors.push(`roles.${role}.model: ${row.model} does not match the ${row.family} pattern ${pattern} in families`);
  }
  // Independence (DELEGATION.md): code review differs from implementation, design review from the design author.
  const pairs = [['implementation', ['spec-review', 'standards-review']], ['planning', ['design-comprehension', 'design-challenge']]];
  for (const [author, reviewers] of pairs) {
    if (!valid[author]) continue;
    for (const r of reviewers) if (valid[r] && sameFamily(valid[r].family, valid[author].family)) {
      errors.push(`roles.${r}.family: ${valid[r].family} is also the ${author} family; a reviewer must use a different family from the work it reviews`);
    }
  }
  return errors;
}

/** The family's model pattern from `families` (matched case-insensitively by name), or null. */
export function familyPattern(cfg, family) {
  if (!isObject(cfg.families) || !text(family)) return null;
  const entry = Object.entries(cfg.families).find(([name]) => sameFamily(name, family));
  if (!entry || !text(entry[1])) return null;
  try { new RegExp(entry[1]); return entry[1]; } catch { return null; }
}

/** Parse and validate the text of a delegation.json; throws with every problem listed. */
export function parseConfig(source, label = 'delegation.json') {
  let cfg;
  try { cfg = JSON.parse(source); } catch (e) { throw new Error(`${label}: not valid JSON: ${e.message}`); }
  const errors = validateConfig(cfg);
  if (errors.length) throw new Error(`${label} is not valid:\n- ${errors.join('\n- ')}`);
  return cfg;
}

/** The arguments passed to the harness after `--`, derived from a role row. */
export function harnessArgsFor(row) {
  const model = row.harness === 'claude' ? row.model.slice('anthropic/'.length) : row.model;
  return ['--model', model, ...TOOL_PROFILES[row.harness][row.tools ?? 'full'], ...(row.extraArgs ?? [])];
}

/** What `launch --config --role` takes from a validated config. */
export function launchDefaults(cfg, role) {
  const row = cfg.roles[role];
  if (row === undefined) throw new Error(`delegation.json has no row for role ${role}`);
  if (role === 'planning') throw new Error('the planning row is the coordinator\'s own session; it is started by hand, not launched');
  if (!available(row)) throw new Error(`role ${role} is marked unavailable in delegation.json: ${row.unavailable}`);
  return {
    harness: row.harness, mode: row.mode, harnessArgs: harnessArgsFor(row), model: row.model, family: row.family, familyPattern: familyPattern(cfg, row.family),
    timeoutMs: row.mode === 'batch' ? row.timeoutMs ?? cfg.limits?.batchTimeoutMs ?? null : null,
    setup: cfg.worktreeSetup ?? null,
  };
}

// ---- The human-readable table in delegation.md --------------------------------------------------

export const TABLE_START = '<!-- delegation-roles:start: generated from delegation.json by `herdr-delegate.mjs config render`; edit the JSON, not this table -->';
export const TABLE_END = '<!-- delegation-roles:end -->';
const cell = s => String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

/** The role table, in CONFIG_ROLES order. */
export function renderTable(cfg) {
  const rows = ['| Role | Harness | Mode | Harness arguments (after `--`) | Exact model | Family |', '| --- | --- | --- | --- | --- | --- |'];
  for (const role of CONFIG_ROLES) {
    const row = cfg.roles[role];
    if (row === undefined) continue;
    if (!available(row)) { rows.push(`| ${role} | — | — | — | unavailable: ${cell(row.unavailable)} | — |`); continue; }
    const mode = role === 'planning' ? "(coordinator's own session)" : row.mode;
    const args = role === 'planning' ? '—' : `\`${harnessArgsFor(row).join(' ')}\``;
    rows.push(`| ${role} | ${HARNESS_NAMES[row.harness]} | ${mode} | ${args} | ${cell(row.model)} | ${cell(row.family)} |`);
  }
  return rows.join('\n');
}

function split(doc) {
  const s = doc.indexOf(TABLE_START), e = doc.indexOf(TABLE_END);
  if (s === -1 || e === -1 || e < s) return null;
  return { before: doc.slice(0, s + TABLE_START.length), inner: doc.slice(s + TABLE_START.length, e), after: doc.slice(e) };
}

/** The document with its generated table replaced, or null when it has no markers. */
export function replaceTable(doc, table) {
  const p = split(doc);
  if (!p) return null;
  const eol = doc.includes('\r\n') ? '\r\n' : '\n';
  return `${p.before}${eol}${table.replace(/\n/g, eol)}${eol}${p.after}`;
}

/** 'in-sync', 'stale' or 'no-markers'. Line endings and surrounding blank lines do not count. */
export function tableStatus(doc, table) {
  const p = split(doc);
  if (!p) return 'no-markers';
  return p.inner.replace(/\r\n/g, '\n').trim() === table.trim() ? 'in-sync' : 'stale';
}
