import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../../src/cli.mjs', import.meta.url));
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'quote-e2e-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'catalog.json');
  writeFileSync(path, JSON.stringify([{ sku: 'PEN', name: 'Bolígrafo', unitPriceCents: 1250 }]));
  return path;
}
function run(...args) { return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 5000 }); }
test('a customer quotes three pens through the CLI', t => {
  const path = fixture(t), before = readFileSync(path, 'utf8');
  const result = run(path, 'PEN', '3');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.ok(result.stdout.endsWith('\n'), 'JSON output ends with a newline');
  assert.equal(result.stdout.trim().split('\n').length, 1, 'exactly one JSON output line');
  assert.deepEqual(JSON.parse(result.stdout), { sku: 'PEN', name: 'Bolígrafo', quantity: 3, totalCents: 3750 });
  assert.equal(readFileSync(path, 'utf8'), before);
});
test('invalid user requests produce no quote and a useful error', t => {
  const path = fixture(t);
  for (const args of [[path, 'MISSING', '1'], [path, 'PEN', '0'], [path, 'PEN', '1.5'], [path, 'PEN', '2x'], [path, 'PEN', '-1'], [path, 'PEN', '+1'], [path, 'PEN', '1e2'], [path, 'PEN', ' 1'], [path, 'PEN', '9007199254740992'], [path, 'pen', '1'], [path, 'PEN', '1', 'extra'], []]) {
    const result = run(...args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.ok(result.stderr.trim().length > 0);
    assert.doesNotMatch(result.stderr, /at .*\(.*:\d+:\d+\)/, 'no stack trace for user errors');
  }
});

test('catalog failures and unsafe products use the CLI error contract', t => {
  const path = fixture(t);
  for (const content of ['{', JSON.stringify([{ sku: 'PEN', name: 'Pen', unitPriceCents: Number.MAX_SAFE_INTEGER }])]) {
    writeFileSync(path, content);
    const result = run(path, 'PEN', '2');
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.ok(result.stderr.trim());
    assert.doesNotMatch(result.stderr, /at .*\(.*:\d+:\d+\)/);
    assert.equal(readFileSync(path, 'utf8'), content);
  }
  const missing = run(path + '.missing', 'PEN', '1');
  assert.equal(missing.status, 1);
  assert.equal(missing.stdout, '');
  assert.ok(missing.stderr.trim());
  assert.doesNotMatch(missing.stderr, /at .*\(.*:\d+:\d+\)/);
});
