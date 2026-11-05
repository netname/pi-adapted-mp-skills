import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { piSessionModel, piStreamResult, claudeResult, claudeSessionModels, parseLaunch, checkPaths, gitIgnored, batchOutcome, portCandidates, resourceEnv, batchStale, runLimited, DEFAULTS } from '../scripts/herdr-delegate.mjs';

const lines = (...objs) => objs.map(o => JSON.stringify(o)).join('\n');

test('pi session file: the last model change is the effective model', () => {
  const text = lines(
    { type: 'session', id: 's' },
    { type: 'model_change', provider: 'deepseek', modelId: 'deepseek-flash' },
    { type: 'message', message: { role: 'user' } },
    { type: 'model_change', provider: 'anthropic', modelId: 'claude-haiku-5-5' });
  assert.deepEqual(piSessionModel(text), { provider: 'anthropic', model: 'claude-haiku-5-5' });
  assert.equal(piSessionModel(lines({ type: 'session' })), null);
  assert.equal(piSessionModel('not json\n'), null);
});

test('pi print stream: models, final text, aborted and error', () => {
  const reply = (text, extra = {}) => ({ type: 'message_end', message: { role: 'assistant', provider: 'deepseek', model: 'deepseek-flash', content: [{ type: 'thinking', thinking: 'x' }, { type: 'text', text }], ...extra } });
  const ok = piStreamResult(lines({ type: 'agent_start' }, reply('first'), reply('REPORT: done'), { type: 'agent_settled', aborted: false }));
  assert.deepEqual(ok, { models: ['deepseek/deepseek-flash'], finalText: 'REPORT: done', aborted: false, error: false });
  assert.equal(piStreamResult(lines(reply('x'))).aborted, true, 'no agent_settled means not finished');
  assert.equal(piStreamResult(lines(reply('x'), { type: 'agent_settled', aborted: true })).aborted, true);
  assert.equal(piStreamResult(lines(reply('x', { stopReason: 'error' }), { type: 'agent_settled', aborted: false })).error, true);
  assert.equal(piStreamResult('').finalText, '');
});

test('claude print result: models from modelUsage; is_error is a failure', () => {
  const ok = claudeResult(JSON.stringify({ type: 'result', is_error: false, result: ' REPORT ', modelUsage: { 'claude-haiku-5-5': {} } }));
  assert.deepEqual(ok, { models: ['anthropic/claude-haiku-5-5'], finalText: 'REPORT', aborted: false, error: false });
  // Shape observed live from an unauthenticated CLI: success subtype, but is_error true and no usage.
  const denied = claudeResult(JSON.stringify({ type: 'result', subtype: 'success', is_error: true, result: 'Not logged in · Please run /login' }));
  assert.equal(denied.error, true); assert.deepEqual(denied.models, []);
  assert.throws(() => claudeResult('garbage'));
});

test('claude session file: models named on assistant messages', () => {
  const text = lines({ type: 'user', message: {} }, { type: 'assistant', message: { model: 'claude-opus-5-5' } }, { type: 'assistant', message: { model: 'claude-opus-5-5' } });
  assert.deepEqual(claudeSessionModels(text), ['anthropic/claude-opus-5-5']);
});

function files(t) {
  const dir = mkdtempSync(join(tmpdir(), 'mp-herdr-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, 'brief.md'), 'b'); writeFileSync(join(dir, 'task.md'), 't');
  return dir;
}
const base = dir => ['--record', join(dir, 'r.json'), '--role', 'spec-review', '--name', 'rev1', '--harness', 'pi', '--mode', 'batch',
  '--brief', join(dir, 'brief.md'), '--task', join(dir, 'task.md'), '--output', join(dir, 'out.md'), '--cwd', dir];

test('launch options: valid batch and worktree forms, harness args after --', t => {
  const dir = files(t);
  const o = parseLaunch([...base(dir), '--', '--tools', 'read,grep']);
  assert.deepEqual(o.harnessArgs, ['--tools', 'read,grep']);
  const w = parseLaunch(['--record', join(dir, 'r.json'), '--role', 'implementation', '--name', 'w1', '--harness', 'pi', '--mode', 'interactive',
    '--brief', join(dir, 'brief.md'), '--task', join(dir, 'task.md'), '--worktree', '--repo', dir, '--branch', 'ticket/a', '--base', 'abc123']);
  assert.equal(w.worktree, true);
});

test('launch options: rejects what Herdr or the policy would reject', t => {
  const dir = files(t);
  const replace = (flag, value) => { const a = base(dir); a[a.indexOf(flag) + 1] = value; return a; };
  assert.throws(() => parseLaunch(replace('--name', '01-first')), /agent name rule/);
  assert.throws(() => parseLaunch(replace('--name', 'a'.repeat(33))), /agent name rule/);
  assert.throws(() => parseLaunch(replace('--role', 'boss')), /unknown role/);
  assert.throws(() => parseLaunch(replace('--harness', 'codex')), /pi or claude/);
  assert.throws(() => parseLaunch(replace('--brief', 'brief.md')), /absolute/);
  assert.throws(() => parseLaunch(replace('--task', join(dir, 'missing.md'))), /not found/);
  assert.throws(() => parseLaunch(base(dir).filter((_, i, a) => a[i] !== '--output' && a[i - 1] !== '--output')), /needs --output/);
  assert.throws(() => parseLaunch([...base(dir), '--worktree', '--repo', dir, '--branch', 'b', '--base', 'x']), /no --cwd/);
  assert.throws(() => parseLaunch([...base(dir), '--name', 'again']), /repeated/);
});

test('paths: record and read-only output inside the checkout only when Git-ignored', t => {
  const repo = files(t);
  const git = (...a) => execFileSync('git', ['-C', repo, ...a], { stdio: 'ignore' });
  git('init'); writeFileSync(join(repo, '.gitignore'), '.scratch/\n');
  const ignored = gitIgnored(repo);
  const inScratch = join(repo, '.scratch', 'runs', 'r.json'), tracked = join(repo, 'r.json'), outside = join(tmpdir(), 'elsewhere.json');
  assert.equal(ignored(inScratch), true); assert.equal(ignored(tracked), false);
  assert.doesNotThrow(() => checkPaths({ record: inScratch, output: join(repo, '.scratch', 'runs', 'o.md'), role: 'spec-review' }, repo, ignored));
  assert.doesNotThrow(() => checkPaths({ record: outside, output: outside, role: 'standards-review' }, repo, ignored));
  assert.throws(() => checkPaths({ record: tracked, role: 'research' }, repo, ignored), /record must live outside/);
  assert.throws(() => checkPaths({ record: inScratch, output: join(repo, 'review.md'), role: 'spec-review' }, repo, ignored), /spec-review output/);
  // design-check reads design-review reports from inside the repository.
  assert.doesNotThrow(() => checkPaths({ record: inScratch, output: join(repo, 'docs', 'designs', 'reviews', 'challenge.md'), role: 'design-challenge' }, repo, ignored));
});

test('batch outcome: only a timely, settled, error-free, non-empty answer passes', () => {
  const good = { finalText: 'REPORT', aborted: false, error: false };
  assert.deepEqual(batchOutcome({ status: 0, timedOut: false }, good), { status: 'completed', failureReason: null });
  assert.equal(batchOutcome({ status: null, timedOut: true }, good).failureReason, 'timeout');
  assert.equal(batchOutcome({ status: 1, timedOut: false }, good).failureReason, 'exit');
  assert.equal(batchOutcome({ status: 0, timedOut: false }, null).failureReason, 'unparsable');
  assert.equal(batchOutcome({ status: 0, timedOut: false }, { ...good, aborted: true }).failureReason, 'aborted');
  assert.equal(batchOutcome({ status: 0, timedOut: false }, { ...good, error: true }).failureReason, 'harness-error');
  assert.equal(batchOutcome({ status: 0, timedOut: false }, { ...good, finalText: '' }).failureReason, 'empty');
});

test('run resources: deterministic ports in range, and the environment names', () => {
  const a = portCandidates('s:w1:t1', 2), b = portCandidates('s:w2:t2', 2);
  assert.deepEqual(a, portCandidates('s:w1:t1', 2));
  assert.notEqual(a[0], b[0]);
  assert.ok(a.every(p => p >= 20000 && p < 40000));
  assert.deepEqual(resourceEnv('r', [21000, 21001]), { MP_RUN_ID: 'r', MP_RUN_PORT: '21000', MP_RUN_PORT_1: '21000', MP_RUN_PORT_2: '21001' });
  assert.deepEqual(resourceEnv('r', []), { MP_RUN_ID: 'r' });
});

test('stale batch: running past its limit plus grace', () => {
  const startedAt = '2026-01-01T00:00:00.000Z', t0 = Date.parse(startedAt);
  const rec = { mode: 'batch', status: 'running', startedAt, timeoutMs: 60_000 };
  assert.equal(batchStale(rec, t0 + 60_000 + 59_000), false);
  assert.equal(batchStale(rec, t0 + 60_000 + 61_000), true);
  assert.equal(batchStale({ ...rec, status: 'completed' }, t0 + 1e9), false);
  assert.equal(batchStale({ ...rec, mode: 'interactive' }, t0 + 1e9), false);
});

test('launch options: timeout, setup and ports', t => {
  const dir = files(t);
  const o = parseLaunch(base(dir));
  assert.equal(o.timeoutMs, DEFAULTS.timeoutMs); assert.equal(o.ports, 0);
  assert.equal(parseLaunch([...base(dir), '--timeout-ms', '60000', '--setup', 'npm ci', '--ports', '2']).timeoutMs, 60000);
  assert.throws(() => parseLaunch([...base(dir), '--timeout-ms', '5']), /timeout-ms must be an integer/);
  assert.throws(() => parseLaunch([...base(dir), '--ports', '11']), /ports must be an integer/);
  assert.throws(() => parseLaunch([...base(dir), '--setup-timeout-ms', '5000']), /needs --setup/);
  assert.throws(() => parseLaunch([...base(dir), '--setup', ' ']), /needs a command/);
  const interactive = base(dir).filter((_, i, a) => a[i] !== '--output' && a[i - 1] !== '--output');
  interactive[interactive.indexOf('--mode') + 1] = 'interactive';
  assert.equal(parseLaunch(interactive).timeoutMs, undefined);
  assert.throws(() => parseLaunch([...interactive, '--timeout-ms', '60000']), /batch mode only/);
});

test('runLimited: kills the whole process tree on timeout', async t => {
  const dir = files(t);
  const marker = join(dir, 'grandchild-survived');
  // The child starts a grandchild that would write the marker after 2 s; the limit is 500 ms.
  const grandchild = `setTimeout(()=>require('fs').writeFileSync(${JSON.stringify(marker)},'x'),2000)`;
  const child = `require('child_process').spawn(process.execPath,['-e',${JSON.stringify(grandchild)}],{stdio:'ignore'});setInterval(()=>{},1000)`;
  const started = Date.now();
  const r = await runLimited(process.execPath, ['-e', child], { timeoutMs: 500 });
  assert.equal(r.timedOut, true); assert.equal(r.status, null);
  assert.ok(Date.now() - started < 1900, 'returned promptly after the limit');
  await new Promise(done => setTimeout(done, 2500));
  assert.equal(existsSync(marker), false, 'grandchild was killed with the tree');
  const ok = await runLimited(process.execPath, ['-e', 'process.stdout.write("hi")'], { timeoutMs: 5000 });
  assert.deepEqual([ok.status, ok.timedOut, ok.stdout], [0, false, 'hi']);
});
