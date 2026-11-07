#!/usr/bin/env node
// Skill-name collisions on disk (setup preflight D11). Pi keeps the first skill it finds for a name
// and silently shadows later copies, so two SKILL.md files declaring one name make a later skill
// behave like a different one. This scans the user and project skill directories plus every package
// `pi list --approve` resolves. It cannot see which copy Pi chose: pair it with the startup header.
//
//   node skill-collisions.mjs [--cwd DIR]     prints JSON; exits 1 when a name is declared twice

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SKIP = new Set(['.git', 'node_modules']);

/** Package directories from `pi list --approve` output: the indented path lines (pure). */
export function packageDirs(piListOutput) {
  return (piListOutput || '').split(/\r?\n/).map(l => /^\s{4}(\S.*)$/.exec(l)?.[1].trim()).filter(Boolean);
}

/** The skill directories one package declares: package.json `pi.skills`, else `skills/`. */
export function packageSkillDirs(dir) {
  try {
    const declared = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).pi?.skills;
    if (Array.isArray(declared) && declared.every(s => typeof s === 'string')) return declared.map(s => resolve(dir, s));
  } catch { /* no or unreadable package.json */ }
  return [join(dir, 'skills')];
}

/** Where Pi looks for skills: user scope, project scope and installed packages (pure but for package.json reads). */
export function skillRoots({ home, cwd, piListOutput }) {
  const roots = [join(home, '.pi/agent/skills'), join(home, '.agents/skills'), join(cwd, '.pi/skills'), join(cwd, '.agents/skills')];
  for (const dir of packageDirs(piListOutput)) roots.push(...packageSkillDirs(isAbsolute(dir) ? dir : resolve(cwd, dir)));
  return [...new Set(roots.map(r => resolve(r)))];
}

/** Declared name of a SKILL.md, from its frontmatter `name:` line (pure). */
export function skillName(text) {
  return /^name:\s*["']?([^"'\s]+)["']?/m.exec(text)?.[1] ?? null;
}

/**
 * Every declared skill under the roots, as name -> distinct files. A file reached through two
 * roots (the same package installed at user and project scope by path) counts once.
 */
export function findSkills(roots) {
  const found = new Map(), seen = new Set();
  const walk = dir => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(p); continue; }
      if (e.name !== 'SKILL.md') continue;
      let real; try { real = realpathSync(p); } catch { real = p; }
      if (seen.has(real)) continue;
      seen.add(real);
      const name = skillName(readFileSync(p, 'utf8'));
      if (name) (found.get(name) ?? found.set(name, []).get(name)).push(p);
    }
  };
  for (const r of roots) if (existsSync(r)) walk(r);
  return found;
}

/** Names declared by more than one file, sorted (pure). */
export function collisions(found) {
  return [...found.entries()].filter(([, paths]) => paths.length > 1).sort(([a], [b]) => a.localeCompare(b)).map(([name, paths]) => ({ name, paths }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length && !(args.length === 2 && args[0] === '--cwd')) { console.error('usage: skill-collisions.mjs [--cwd DIR]'); process.exit(1); }
  const cwd = resolve(args[1] ?? process.cwd());
  // npm installs pi as a .cmd shim on Windows, which needs a shell; the command has no arguments to escape.
  const list = process.platform === 'win32'
    ? spawnSync('pi list --approve', { cwd, encoding: 'utf8', shell: true })
    : spawnSync('pi', ['list', '--approve'], { cwd, encoding: 'utf8' });
  const piList = list.status === 0 ? list.stdout : null;
  const roots = skillRoots({ home: homedir(), cwd, piListOutput: piList ?? '' });
  const found = collisions(findSkills(roots));
  console.log(JSON.stringify({
    cwd, piList: piList === null ? `unavailable: ${(list.error?.message || list.stderr || '').trim().split(/\r?\n/)[0]}` : 'read',
    roots: roots.filter(existsSync), collisions: found,
    note: found.length ? 'Ask the user to remove, rename or reorder one installation; never change them yourself.' : 'no skill-name collisions detected on disk',
  }, null, 2));
  if (found.length) process.exitCode = 1;
}
