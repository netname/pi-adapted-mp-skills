import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { buildConfig, defaultMode, ignoreEntry, listsEntry, parseRoleSpec } from '../scripts/mp-setup.mjs';
import { collisions, findSkills, packageDirs, packageSkillDirs, skillName, skillRoots } from '../scripts/skill-collisions.mjs';
import { validateConfig, TABLE_START } from '../scripts/delegation-config.mjs';

const SETUP = resolve('scripts/mp-setup.mjs');
function tmp(t) {
  const dir = mkdtempSync(join(tmpdir(), 'mp-setup-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
const setup = (...args) => {
  const r = spawnSync(process.execPath, [SETUP, ...args], { encoding: 'utf8' });
  let json = null; try { json = JSON.parse(r.stdout); } catch { /* error path */ }
  return { status: r.status, json, stderr: r.stderr };
};
// The quotation lab's choices from docs/BEGINNER-VALIDATION.md, step 5.
const LAB_ROLES = [
  'planning=claude:anthropic/claude-opus-5-5:Claude',
  'implementation=pi:deepseek/deepseek-flash:DeepSeek',
  'design-comprehension=pi:deepseek/deepseek-flash:DeepSeek',
  'design-challenge=pi:deepseek/deepseek-flash:DeepSeek',
  'spec-review=claude:anthropic/claude-sonnet-5-5:Claude',
  'standards-review=claude:anthropic/claude-sonnet-5-5:Claude',
].flatMap(r => ['--role', r]);

test('role specs: mode and tools follow from the role; the model may contain colons', () => {
  assert.deepEqual(parseRoleSpec('spec-review=claude:anthropic/claude-sonnet-5-5:Claude'),
    { role: 'spec-review', row: { harness: 'claude', mode: 'batch', tools: 'read-only', model: 'anthropic/claude-sonnet-5-5', family: 'Claude' } });
  assert.deepEqual(parseRoleSpec('implementation=pi:ollama/llama3:8b:Llama').row, { harness: 'pi', mode: 'interactive', model: 'ollama/llama3:8b', family: 'Llama' });
  assert.equal(defaultMode('planning'), 'coordinator'); assert.equal(defaultMode('research'), 'interactive'); assert.equal(defaultMode('exploration'), 'batch');
  assert.throws(() => parseRoleSpec('spec-review'), /ROLE=HARNESS:MODEL:FAMILY/);
  assert.throws(() => parseRoleSpec('spec-review=claude:anthropic/x'), /ROLE=HARNESS:MODEL:FAMILY/);
  assert.throws(() => parseRoleSpec('boss=pi:deepseek/x:DeepSeek'), /unknown role/);
  assert.throws(() => parseRoleSpec('implementation=codex:openai/x:GPT'), /pi or claude/);
});

test('built config: valid, with family patterns only where the models already match', () => {
  const roles = LAB_ROLES.filter((_, i) => i % 2).map(parseRoleSpec);
  const cfg = buildConfig({ session: 'quote-lab', evidenceDir: '/p/.scratch/runs', setup: 'npm ci', roles, unavailable: ['research=not exercised'] });
  assert.deepEqual(validateConfig(cfg), []);
  assert.deepEqual(cfg.families, { Claude: '^anthropic/', DeepSeek: '^deepseek/' });
  assert.deepEqual(Object.keys(cfg.roles), ['planning', 'implementation', 'research', 'spec-review', 'standards-review', 'design-comprehension', 'design-challenge']);
  assert.deepEqual(cfg.roles.research, { unavailable: 'not exercised' });
  const routed = buildConfig({ evidenceDir: '/p/r', roles: [parseRoleSpec('implementation=pi:openrouter/deepseek-flash:DeepSeek')] });
  assert.equal(routed.families, undefined, 'no pattern that would reject a working row');

  // --from keeps roles, families, limits and setup; never the other project's session or paths.
  const other = { ...cfg, herdrSession: 'other', evidenceDir: '/other/.scratch/runs', limits: { ...cfg.limits, implementationWorkers: 4 } };
  const copied = buildConfig({ evidenceDir: '/new/.scratch/runs', from: other, roles: [parseRoleSpec('implementation=pi:deepseek/deepseek-pro:DeepSeek')] });
  assert.deepEqual([copied.herdrSession, copied.evidenceDir, copied.limits.implementationWorkers, copied.worktreeSetup], [undefined, '/new/.scratch/runs', 4, 'npm ci']);
  assert.equal(copied.roles.implementation.model, 'deepseek/deepseek-pro', 'a --role overrides the copied row');
  assert.equal(copied.roles['spec-review'].model, 'anthropic/claude-sonnet-5-5');
});

test('ignore entries: .scratch as a whole, other in-project paths as themselves', () => {
  const p = resolve('/p');
  assert.equal(ignoreEntry(p, join(p, '.scratch', 'quote-demo', 'runs')), '.scratch/');
  assert.equal(ignoreEntry(p, join(p, 'evidence', 'runs')), 'evidence/runs/');
  assert.equal(ignoreEntry(p, resolve('/elsewhere/runs')), null);
  assert.equal(listsEntry('node_modules/\n/.scratch\n', '.scratch/'), true);
  assert.equal(listsEntry('.scratch/handoffs/\n', '.scratch/'), false);
});

test('init: writes a valid lab setup once, then keeps every file', t => {
  const project = tmp(t);
  writeFileSync(join(project, '.gitignore'), 'node_modules/');
  const first = setup('init', project, '--session', 'quote-lab', '--evidence', join(project, '.scratch', 'quote-demo', 'runs'), '--setup', 'npm ci', ...LAB_ROLES, '--unavailable', 'research=not exercised');
  assert.ok(first.json, first.stderr);
  assert.equal(first.json.config.ok, true, first.json.config.errors.join('\n'));
  assert.equal(first.json.config.table, 'in-sync');
  assert.equal(first.json.ok, first.json.collisions.collisions?.length === 0, 'only a skill collision on this host could fail it');
  assert.deepEqual(first.json.files.map(f => [f.path, f.action]), [
    ['docs/agents/delegation.json', 'created'], ['docs/agents/delegation.md', 'created'],
    ['docs/agents/testing.md', 'created'], ['docs/agents/architecture.md', 'created'],
    ['.scratch/quote-demo/runs', 'created'], ['.gitignore', 'updated'],
  ]);
  assert.equal(readFileSync(join(project, '.gitignore'), 'utf8'), 'node_modules/\n.scratch/\n');
  assert.ok(existsSync(join(project, '.scratch', 'quote-demo', 'runs')));
  const md = readFileSync(join(project, 'docs/agents/delegation.md'), 'utf8');
  assert.ok(md.includes(TABLE_START) && md.includes('| spec-review | Claude Code | batch |'));

  const again = setup('init', project);
  assert.ok(again.json.files.every(f => f.action === 'kept'), JSON.stringify(again.json.files));
  assert.equal(again.json.config.ok, true);
  const refused = setup('init', project, '--role', 'implementation=pi:deepseek/deepseek-pro:DeepSeek');
  assert.equal(refused.status, 1); assert.match(refused.stderr, /already exists; edit it/);
});

test('init: without choices it copies the template and reports what is missing; a dry run writes nothing', t => {
  const project = tmp(t);
  const dry = setup('init', project, '--dry-run', ...LAB_ROLES);
  assert.equal(dry.json.config.ok, true);
  assert.ok(dry.json.files.every(f => f.action.startsWith('would')));
  assert.equal(existsSync(join(project, 'docs')), false);

  const bare = setup('init', project);
  assert.equal(bare.status, 1);
  assert.equal(bare.json.files[0].action, 'created from template');
  assert.equal(bare.json.config.ok, false); assert.equal(bare.json.config.table, 'not-checked');
  assert.match(bare.json.next.join('\n'), /complete docs\/agents\/delegation.json/);
  assert.equal(existsSync(join(project, '.gitignore')), false, 'no placeholder path is ignored or created');
});

test('init: a lab from create.mjs has the untouched template, which --role replaces', t => {
  const lab = join(tmp(t), 'lab');
  spawnSync(process.execPath, [resolve('examples/validation-lab/create.mjs'), lab], { encoding: 'utf8' });
  const before = setup('init', lab);
  assert.equal(before.json.files[0].action, 'kept'); assert.match(before.json.files[0].detail, /still the template/);
  assert.equal(before.json.config.ok, false);
  assert.match(setup('init', lab, '--session', 'quote-lab').stderr, /still the template; give the roles/);
  const r = setup('init', lab, '--session', 'quote-lab', '--evidence', join(lab, '.scratch', 'quote-demo', 'runs'), '--setup', 'npm ci', ...LAB_ROLES);
  assert.equal(r.json.files[0].action, 'replaced the template');
  assert.equal(r.json.config.ok, true, r.json.config.errors.join('\n'));
  assert.equal(r.json.config.table, 'in-sync', 'the lab copy of delegation.md has the markers');
  // The lab's own testing and architecture contracts and its .gitignore are kept; only runs/ is new.
  assert.deepEqual(r.json.files.slice(2).map(f => [f.path, f.action]), [
    ['docs/agents/testing.md', 'kept'], ['docs/agents/architecture.md', 'kept'],
    ['.scratch/quote-demo/runs', 'created'], ['.gitignore', 'kept'],
  ]);
});

test('init: --from reuses another project\'s roles', t => {
  const base = tmp(t), a = join(base, 'a'), b = join(base, 'b');
  mkdirSync(a); mkdirSync(b);
  setup('init', a, '--session', 'lab-a', ...LAB_ROLES);
  const r = setup('init', b, '--from', join(a, 'docs/agents/delegation.json'));
  assert.equal(r.json.config.ok, true, r.json.config.errors.join('\n'));
  const cfg = JSON.parse(readFileSync(join(b, 'docs/agents/delegation.json'), 'utf8'));
  assert.deepEqual([cfg.herdrSession, cfg.evidenceDir], [undefined, join(b, '.scratch', 'runs')]);
  assert.equal(cfg.roles['spec-review'].model, 'anthropic/claude-sonnet-5-5');
});

test('skill collisions: package roots, declared names and duplicates on disk', t => {
  const dir = tmp(t);
  assert.deepEqual(packageDirs('Project packages:\n  local\n    /home/u/skills\n    ../rel\nUser packages:\n'), ['/home/u/skills', '../rel']);
  assert.equal(skillName('---\nname: "triage"\ndescription: x\n---'), 'triage');
  assert.equal(skillName('no frontmatter'), null);
  const pkg = join(dir, 'pkg'), user = join(dir, 'home', '.pi/agent/skills');
  const skill = (root, name, sub = name) => { mkdirSync(join(root, sub), { recursive: true }); writeFileSync(join(root, sub, 'SKILL.md'), `---\nname: ${name}\n---\n`); };
  mkdirSync(pkg); writeFileSync(join(pkg, 'package.json'), JSON.stringify({ pi: { skills: ['./custom'] } }));
  assert.deepEqual(packageSkillDirs(pkg), [join(pkg, 'custom')]);
  assert.deepEqual(packageSkillDirs(join(dir, 'none')), [join(dir, 'none', 'skills')]);
  skill(join(pkg, 'custom'), 'triage', 'engineering/triage');
  skill(join(pkg, 'custom'), 'tdd');
  skill(user, 'triage');
  skill(join(pkg, 'custom', 'node_modules'), 'tdd');
  const roots = skillRoots({ home: join(dir, 'home'), cwd: join(dir, 'project'), piListOutput: `    ${pkg}\n    ${pkg}\n` });
  assert.ok(roots.includes(join(pkg, 'custom')));
  const found = findSkills([...roots, join(pkg, 'custom')]);
  assert.deepEqual(collisions(found).map(c => [c.name, c.paths.length]), [['triage', 2]], 'node_modules is skipped and a file reached twice counts once');
});
