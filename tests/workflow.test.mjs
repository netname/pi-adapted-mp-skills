import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { captureReview } from '../scripts/review-target.mjs';
import { frontier } from '../scripts/frontier.mjs';

function fixture(t) {
  const repo = mkdtempSync(join(tmpdir(), 'mp-test-'));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.invalid');
  const commit = text => { writeFileSync(join(repo, 'file.txt'), text); git('add', '.'); git('commit', '-m', text); return git('rev-parse', 'HEAD'); };
  const base = commit('before'); const head = commit('after');
  return { repo, git, commit, base, head };
}
test('captures exact committed target and all commits, outside worktree', t => {
  const f = fixture(t); f.head = f.commit('final');
  const m = captureReview(f); t.after(() => rmSync(m.directory, { recursive: true, force: true }));
  assert.equal(m.base, f.base); assert.equal(m.head, f.head);
  assert.match(readFileSync(m.diff, 'utf8'), /-before/); assert.match(readFileSync(m.diff, 'utf8'), /\+final/);
  assert.equal(readFileSync(m.commits, 'utf8').trim().split('\n').length, 2);
  assert.equal(f.git('status', '--porcelain'), '');
});
for (const kind of ['unstaged', 'staged', 'untracked']) test(`rejects omitted ${kind} work`, t => {
  const f = fixture(t);
  writeFileSync(join(f.repo, kind === 'untracked' ? 'new.txt' : 'file.txt'), 'not reviewed');
  if (kind === 'staged') f.git('add', '.');
  assert.throws(() => captureReview(f), /dirty worktree/);
});
test('rejects wrong checkout, invalid ref and empty target', t => {
  const f = fixture(t);
  assert.throws(() => captureReview({ ...f, head: f.base }), /checked-out/);
  assert.throws(() => captureReview({ ...f, base: '--help' }));
  assert.throws(() => captureReview({ ...f, base: f.head }), /empty diff/);
});
test('uses merge-base when the target branch advanced independently', t => {
  const f = fixture(t); f.git('checkout', '--detach', f.base);
  writeFileSync(join(f.repo, 'unrelated.txt'), 'other branch'); f.git('add', '.'); f.git('commit', '-m', 'other');
  const advancedBase = f.git('rev-parse', 'HEAD'); f.git('checkout', '--detach', f.head);
  const m = captureReview({ ...f, base: advancedBase }); t.after(() => rmSync(m.directory, { recursive: true, force: true }));
  assert.equal(m.mergeBase, f.base); assert.doesNotMatch(readFileSync(m.diff, 'utf8'), /unrelated/);
});
const ticket = (id, blockedBy = [], extra = {}) => ({ id, blockedBy, status: 'ready', ...extra });
test('only verified integration unblocks dependents; claims prevent relaunch', () => {
  const a = ticket('a', [], { status: 'review' });
  const graph = { tickets: [a, ticket('b', ['a']), ticket('c'), ticket('d', [], { claim: 'run-1' })] };
  assert.deepEqual(frontier(graph), ['c']);
  Object.assign(a, { status: 'integrated', verified: true, integratedSha: 'a'.repeat(40) });
  assert.deepEqual(frontier(graph), ['b', 'c']);
});
test('rejects cycles, dangling blockers, duplicate IDs and false completion', () => {
  for (const tickets of [[ticket('a', ['b']), ticket('b', ['a'])], [ticket('a', ['missing'])], [ticket('a'), ticket('a')], [ticket('a', [], { status: 'integrated' })]]) assert.throws(() => frontier({ tickets }));
});
