#!/usr/bin/env node
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const skills = resolve(here, '../..');
if (process.argv.length !== 3) { console.error('usage: node create.mjs /new/lab-directory'); process.exit(1); }
const target = resolve(process.argv[2]);
// No recursive mkdir: a pre-existing destination fails instead of overwriting work.
mkdirSync(target);
cpSync(join(here, 'template'), target, { recursive: true, force: false });
const state = join(target, '.scratch', 'quote-demo');
function substitute(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) substitute(path);
    else if (entry.name.endsWith('.md')) writeFileSync(path, readFileSync(path, 'utf8').replaceAll('__SKILLS_ROOT__', skills).replaceAll('__STATE_ROOT__', state));
  }
}
substitute(target);
mkdirSync(state, { recursive: true });
cpSync(join(here, 'tickets'), join(state, 'issues'), { recursive: true });
const ticketFiles = readdirSync(join(here, 'tickets')).filter(name => name.endsWith('.md')).sort();
writeFileSync(join(target, 'docs/designs/quote-plan.md'), '# Supplied ticket scope snapshot\n\nPlanning proposal; live claims/status belong in the tracker.\n\n' + ticketFiles.map(name => readFileSync(join(here, 'tickets', name), 'utf8')).join('\n\n'));
writeFileSync(join(target, '.gitignore'), '.scratch/\nnode_modules/\n');
writeFileSync(join(state, 'graph.json'), JSON.stringify({ tickets: [
  { id: 'A', status: 'ready', blockedBy: [] },
  { id: 'B', status: 'ready', blockedBy: [] },
  { id: 'C', status: 'ready', blockedBy: ['A', 'B'] }
]}, null, 2) + '\n');
cpSync(join(skills, 'skills/engineering/_shared/delegation.template.md'), join(target, 'docs/agents/delegation.md'));
writeFileSync(join(state, 'events.md'), '# Events\n\nLab created; no implementation, verification or review has passed.\n');
console.log(JSON.stringify({ target, skills, state, next: 'Configure delegation.md, initialize Git, then follow docs/MANUAL.md in the skills repository.' }, null, 2));
