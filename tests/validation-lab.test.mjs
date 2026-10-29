import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const create = resolve('examples/validation-lab/create.mjs');
const verify = resolve('examples/validation-lab/verify.mjs');
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'mp-lab-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
function git(repo, ...args) { return execFileSync('git', ['-C', repo, ...args], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }).trim(); }
function init(repo) { git(repo, 'init'); git(repo, 'config', 'user.name', 'Test'); git(repo, 'config', 'user.email', 'test@example.invalid'); git(repo, 'add', '.'); git(repo, 'commit', '-m', 'fixture'); }
test('lab creation supplies a resolvable plan and refuses existing destinations', t => {
  const dir = fixture(t), repo = join(dir, 'lab');
  execFileSync(process.execPath, [create, repo]);
  assert.ok(readFileSync(join(repo, 'AGENTS.md'), 'utf8').includes(join(repo, '.scratch', 'quote-demo')));
  const graph = JSON.parse(readFileSync(join(repo, '.scratch/quote-demo/graph.json'), 'utf8'));
  assert.deepEqual(graph.tickets[2].blockedBy, ['A', 'B']);
  assert.throws(() => execFileSync(process.execPath, [create, repo], { stdio: 'pipe' }));
  init(repo);
  const evidence = join(dir, 'evidence');
  const run = spawnSync(process.execPath, [verify, repo, 'unit', evidence], { encoding: 'utf8' });
  assert.equal(run.status, 1); // The exercise deliberately has no implementation.
  const report = JSON.parse(run.stdout);
  assert.equal(report.passed, false); assert.equal(report.head, git(repo, 'rev-parse', 'HEAD'));
  assert.match(readFileSync(join(report.directory, 'stdout.log'), 'utf8') + readFileSync(join(report.directory, 'stderr.log'), 'utf8'), /ERR_MODULE_NOT_FOUND/);
});
test('verification preserves successful evidence and refuses dirty candidates', t => {
  const dir = fixture(t), repo = join(dir, 'repo'), evidence = join(dir, 'evidence');
  mkdirSync(join(repo, 'test/unit'), { recursive: true });
  writeFileSync(join(repo, 'test/unit/pricing.test.mjs'), "import { test } from 'node:test'; test('synthetic verifier check', () => {});\n");
  init(repo);
  const run = spawnSync(process.execPath, [verify, repo, 'unit', evidence], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr); assert.equal(JSON.parse(run.stdout).passed, true);
  writeFileSync(join(repo, 'untracked.txt'), 'unreviewed');
  const dirty = spawnSync(process.execPath, [verify, repo, 'unit', evidence], { encoding: 'utf8' });
  assert.equal(dirty.status, 1); assert.match(dirty.stderr, /committed and clean/);
  assert.equal(readdirSync(evidence).length, 1);
});
test('passing tests cannot certify source they changed', t => {
  const dir = fixture(t), repo = join(dir, 'repo');
  mkdirSync(join(repo, 'test/unit'), { recursive: true });
  writeFileSync(join(repo, 'tracked.txt'), 'before');
  writeFileSync(join(repo, 'test/unit/pricing.test.mjs'), "import { writeFileSync } from 'node:fs'; writeFileSync('tracked.txt', 'after');\n");
  init(repo);
  const run = spawnSync(process.execPath, [verify, repo, 'unit', join(dir, 'evidence')], { encoding: 'utf8' });
  assert.equal(run.status, 1); const report = JSON.parse(run.stdout);
  assert.equal(report.exitCode, 0); assert.equal(report.passed, false); assert.match(report.dirty, /tracked.txt/);
});
