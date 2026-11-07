#!/usr/bin/env node
// The deterministic part of the setup skill: template copies, Git-ignore entries, the delegation
// config and its checks. Choosing a tracker, reading an existing repository and explaining open
// questions stay with the skill. Nothing here overwrites an existing file.
//
//   node mp-setup.mjs init PROJECT
//        [--role ROLE=HARNESS:MODEL:FAMILY]... [--unavailable ROLE=REASON]... [--from OTHER/delegation.json]
//        [--session NAME] [--evidence DIR] [--setup CMD] [--probe [--live]] [--dry-run]
//
// --role picks the mode and tools from the role: planning is the coordinator, implementation and
// research are interactive, the rest are read-only batch. --from copies another project's roles,
// families, limits and setup command; its session and evidence paths are not copied.

import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CONFIG_ROLES, READ_ONLY_ROLES, parseConfig, renderTable, replaceTable, tableStatus, validateConfig } from './delegation-config.mjs';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHARED = join(PACKAGE_ROOT, 'skills/engineering/_shared');
const HARNESSES = ['pi', 'claude'];
// Patterns are added only for a family whose configured models already match, so they never
// reject a working row; they catch a later edit that names another provider's model.
const KNOWN_FAMILIES = { Claude: '^anthropic/', DeepSeek: '^deepseek/' };
const DEFAULT_LIMITS = { implementationWorkers: 2, researchWorkers: 3, repairAttempts: 2, batchTimeoutMs: 30 * 60 * 1000 };

function need(condition, message) { if (!condition) throw new Error(message); }
const inside = (child, parent) => { const r = relative(parent, child); return r === '' || (!r.startsWith(`..${sep}`) && r !== '..' && !isAbsolute(r)); };

/** The mode a role runs in (pure). */
export function defaultMode(role) {
  if (role === 'planning') return 'coordinator';
  return ['implementation', 'research'].includes(role) ? 'interactive' : 'batch';
}

/**
 * `ROLE=HARNESS:MODEL:FAMILY` (pure). The model may contain `:`, so the harness is the first field
 * and the family the last. Mode and tools follow from the role.
 */
export function parseRoleSpec(spec) {
  const eq = spec.indexOf('=');
  need(eq > 0, `--role ${spec}: use ROLE=HARNESS:MODEL:FAMILY`);
  const role = spec.slice(0, eq), rest = spec.slice(eq + 1);
  const first = rest.indexOf(':'), last = rest.lastIndexOf(':');
  need(first > 0 && last > first + 1 && last < rest.length - 1, `--role ${spec}: use ROLE=HARNESS:MODEL:FAMILY, for example spec-review=claude:anthropic/claude-sonnet-5-5:Claude`);
  need(CONFIG_ROLES.includes(role), `--role ${spec}: unknown role; use one of ${CONFIG_ROLES.join(', ')}`);
  const harness = rest.slice(0, first);
  need(HARNESSES.includes(harness), `--role ${spec}: harness must be pi or claude`);
  const row = { harness, mode: defaultMode(role), ...(READ_ONLY_ROLES.includes(role) ? { tools: 'read-only' } : {}), model: rest.slice(first + 1, last), family: rest.slice(last + 1) };
  return { role, row };
}

/** A delegation config from setup choices (pure). The result still goes through validateConfig. */
export function buildConfig({ session, evidenceDir, setup, roles = [], unavailable = [], from = null }) {
  const cfg = { schemaVersion: 1 };
  if (session) cfg.herdrSession = session;
  cfg.evidenceDir = evidenceDir;
  cfg.limits = { ...DEFAULT_LIMITS, ...(from?.limits ?? {}) };
  const worktreeSetup = setup ?? from?.worktreeSetup;
  if (worktreeSetup) cfg.worktreeSetup = worktreeSetup;
  const rows = { ...(from?.roles ?? {}) };
  for (const { role, row } of roles) rows[role] = row;
  for (const spec of unavailable) {
    const eq = spec.indexOf('=');
    need(eq > 0 && eq < spec.length - 1, `--unavailable ${spec}: use ROLE=REASON`);
    const role = spec.slice(0, eq);
    need(CONFIG_ROLES.includes(role), `--unavailable ${spec}: unknown role`);
    rows[role] = { unavailable: spec.slice(eq + 1) };
  }
  const families = { ...(from?.families ?? {}) };
  for (const row of Object.values(rows)) {
    if (!row.family || families[row.family] !== undefined) continue;
    const pattern = KNOWN_FAMILIES[row.family];
    const sameFamily = Object.values(rows).filter(r => r.family === row.family);
    if (pattern && sameFamily.every(r => new RegExp(pattern).test(r.model))) families[row.family] = pattern;
  }
  if (Object.keys(families).length) cfg.families = families;
  cfg.roles = Object.fromEntries(CONFIG_ROLES.filter(r => rows[r] !== undefined).map(r => [r, rows[r]]));
  return cfg;
}

/** The .gitignore line that keeps an in-project evidence directory out of Git (pure); null when outside. */
export function ignoreEntry(project, evidenceDir) {
  if (!inside(resolve(evidenceDir), resolve(project))) return null;
  const rel = relative(resolve(project), resolve(evidenceDir)).split(sep).join('/');
  return rel === '.scratch' || rel.startsWith('.scratch/') ? '.scratch/' : `${rel}/`;
}
/** Whether a .gitignore text already lists the entry, with or without a leading slash (pure). */
export function listsEntry(gitignore, entry) {
  const want = entry.replace(/^\/+/, '');
  return gitignore.split(/\r?\n/).map(l => l.trim().replace(/^\/+/, '')).some(l => l === want || l === want.replace(/\/$/, ''));
}

function parseInit(argv) {
  const o = { roles: [], unavailable: [], probe: false, live: false, dryRun: false };
  need(argv[0] && !argv[0].startsWith('--'), 'usage: mp-setup.mjs init PROJECT [options]');
  o.project = resolve(argv[0]);
  for (let k = 1; k < argv.length; k++) {
    const flag = argv[k];
    if (flag === '--probe') { o.probe = true; continue; }
    if (flag === '--live') { o.live = true; continue; }
    if (flag === '--dry-run') { o.dryRun = true; continue; }
    const value = argv[++k];
    need(value !== undefined, `${flag} needs a value`);
    if (flag === '--role') o.roles.push(parseRoleSpec(value));
    else if (flag === '--unavailable') o.unavailable.push(value);
    else {
      const key = { '--session': 'session', '--evidence': 'evidence', '--setup': 'setup', '--from': 'from' }[flag];
      need(key && o[key] === undefined, `bad or repeated option: ${flag}`);
      o[key] = value;
    }
  }
  need(!o.live || o.probe, '--live needs --probe');
  for (const k of ['evidence', 'from']) if (o[k]) need(isAbsolute(o[k]), `--${k} must be an absolute path`);
  return o;
}

function runJson(args, cwd) {
  const r = spawnSync(process.execPath, args, { cwd, encoding: 'utf8' });
  let json = null; try { json = JSON.parse(r.stdout); } catch { /* not JSON */ }
  return { status: r.status, json, stderr: (r.stderr || '').trim() };
}

function init(argv) {
  const o = parseInit(argv);
  need(existsSync(o.project) && statSync(o.project).isDirectory(), `project not found: ${o.project}`);
  const agents = join(o.project, 'docs/agents');
  const files = [];
  const act = (path, action, detail) => files.push({ path: relative(o.project, path).split(sep).join('/'), action, ...(detail ? { detail } : {}) });
  const write = (path, content) => { if (!o.dryRun) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content); } };
  const copy = (from, to) => { if (!o.dryRun) { mkdirSync(dirname(to), { recursive: true }); copyFileSync(from, to); } };
  const verb = o.dryRun ? 'would create' : 'created';

  // 1. The delegation config. An edited file is the user's: keep it. A file still identical to the
  // template (as create.mjs leaves it) holds no choices yet and may be generated over.
  const jsonPath = join(agents, 'delegation.json');
  const template = readFileSync(join(SHARED, 'delegation.template.json'), 'utf8');
  const chose = o.roles.length || o.unavailable.length || o.from || o.session || o.evidence || o.setup;
  const untouched = existsSync(jsonPath) && readFileSync(jsonPath, 'utf8').replace(/\r\n/g, '\n') === template.replace(/\r\n/g, '\n');
  let configText;
  if (existsSync(jsonPath) && !(untouched && (o.roles.length || o.from))) {
    need(!chose, untouched
      ? `${jsonPath} is still the template; give the roles with --role or --from to generate it`
      : `${jsonPath} already exists; edit it, or move it away to generate a new one`);
    configText = readFileSync(jsonPath, 'utf8');
    act(jsonPath, 'kept', untouched ? 'still the template: fill in the placeholders, or rerun with --role/--from' : undefined);
  } else if (!o.roles.length && !o.from) {
    configText = template;
    copy(join(SHARED, 'delegation.template.json'), jsonPath);
    act(jsonPath, `${verb} from template`, 'fill in the placeholders, or rerun with --role/--from');
  } else {
    const from = o.from ? parseConfig(readFileSync(o.from, 'utf8'), o.from) : null;
    const cfg = buildConfig({ session: o.session, evidenceDir: o.evidence ?? join(o.project, '.scratch', 'runs'), setup: o.setup, roles: o.roles, unavailable: o.unavailable, from });
    configText = JSON.stringify(cfg, null, 2) + '\n';
    write(jsonPath, configText);
    act(jsonPath, untouched ? (o.dryRun ? 'would replace the template' : 'replaced the template') : verb, o.from ? `roles from ${o.from}` : undefined);
  }
  let cfg = null, errors;
  try { cfg = JSON.parse(configText); errors = validateConfig(cfg); } catch (e) { errors = [`not valid JSON: ${e.message}`]; }

  // 2. The human-readable delegation document, and its generated table when the config is valid.
  const mdPath = join(agents, 'delegation.md');
  let md = existsSync(mdPath) ? readFileSync(mdPath, 'utf8') : null;
  if (md === null) { md = readFileSync(join(SHARED, 'delegation.template.md'), 'utf8'); copy(join(SHARED, 'delegation.template.md'), mdPath); act(mdPath, verb); }
  else act(mdPath, 'kept');
  let table = 'not-checked';
  if (!errors.length) {
    const rendered = renderTable(cfg);
    table = tableStatus(md, rendered);
    if (table === 'stale') {
      if (!o.dryRun) writeFileSync(mdPath, replaceTable(md, rendered));
      files.at(-1).detail = o.dryRun ? 'would render the role table' : 'rendered the role table';
      table = 'in-sync';
    } else if (table === 'no-markers') files.at(-1).detail = 'no generated-table markers; the table is not kept in sync';
  }

  // 3. The other shared contracts, copied only when missing.
  for (const [template, name] of [['testing.template.md', 'testing.md'], ['architecture.template.md', 'architecture.md']]) {
    const path = join(agents, name);
    if (existsSync(path)) act(path, 'kept');
    else { copy(join(SHARED, template), path); act(path, verb, 'fill in the placeholders'); }
  }

  // 4. The evidence directory exists and Git ignores it.
  if (cfg && typeof cfg.evidenceDir === 'string' && isAbsolute(cfg.evidenceDir) && !/[<>]/.test(cfg.evidenceDir)) {
    if (!existsSync(cfg.evidenceDir)) { if (!o.dryRun) mkdirSync(cfg.evidenceDir, { recursive: true }); act(cfg.evidenceDir, verb); }
    const entry = ignoreEntry(o.project, cfg.evidenceDir);
    if (entry) {
      const gi = join(o.project, '.gitignore');
      const text = existsSync(gi) ? readFileSync(gi, 'utf8') : '';
      if (listsEntry(text, entry)) act(gi, 'kept', `already ignores ${entry}`);
      else {
        if (!o.dryRun) appendFileSync(gi, `${text && !text.endsWith('\n') ? '\n' : ''}${entry}\n`);
        act(gi, o.dryRun ? 'would update' : 'updated', `added ${entry}`);
      }
    }
  }

  // 5. Checks. They read the files just written, so a dry run checks the config text only.
  const collisions = runJson([join(PACKAGE_ROOT, 'scripts/skill-collisions.mjs'), '--cwd', o.project], o.project);
  let probe = null;
  if (o.probe) {
    if (errors.length) probe = { ok: false, skipped: 'the config is not valid' };
    else if (o.dryRun) probe = { ok: null, skipped: 'dry run' };
    else {
      const r = runJson([join(PACKAGE_ROOT, 'scripts/herdr-delegate.mjs'), 'config', 'probe', jsonPath, ...(o.live ? ['--live'] : [])], o.project);
      probe = r.json ?? { ok: false, error: r.stderr };
    }
  }
  const next = [];
  if (errors.length) next.push(`complete docs/agents/delegation.json, then: node ${join(PACKAGE_ROOT, 'scripts/herdr-delegate.mjs')} config check ${jsonPath}`);
  if (collisions.json?.collisions?.length) next.push('resolve the skill-name collisions: remove, rename or reorder one installation');
  if (files.some(f => f.detail === 'fill in the placeholders')) next.push('fill in docs/agents/testing.md and docs/agents/architecture.md from the project (the setup skill does this)');
  if (!o.probe && !errors.length) next.push(`check the host: node ${join(PACKAGE_ROOT, 'scripts/herdr-delegate.mjs')} config probe ${jsonPath} [--live]`);
  const ok = !errors.length && collisions.status === 0 && (probe === null || probe.ok !== false);
  console.log(JSON.stringify({
    project: o.project, dryRun: o.dryRun, ok, files,
    config: { path: jsonPath, ok: !errors.length, errors, table },
    collisions: collisions.json ?? { error: collisions.stderr }, probe, next,
  }, null, 2));
  if (!ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [command, ...args] = process.argv.slice(2);
    if (command === 'init') init(args);
    else throw new Error('usage: mp-setup.mjs init PROJECT [--role ROLE=HARNESS:MODEL:FAMILY]... [--unavailable ROLE=REASON]... [--from FILE] [--session NAME] [--evidence DIR] [--setup CMD] [--probe [--live]] [--dry-run]');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
