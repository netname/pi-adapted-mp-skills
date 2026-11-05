import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { piSessionModel, piStreamResult, claudeResult, claudeSessionModels, parseLaunch } from '../scripts/herdr-delegate.mjs';

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
