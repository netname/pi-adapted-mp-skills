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
  assert.deepEqual(JSON.parse(result.stdout), { sku: 'PEN', name: 'Bolígrafo', quantity: 3, totalCents: 3750 });
  assert.equal(readFileSync(path, 'utf8'), before);
});
test('invalid user requests produce no quote and a useful error', t => {
  const path = fixture(t);
  for (const args of [[path, 'MISSING', '1'], [path, 'PEN', '0'], [path, 'PEN', '1.5'], [path, 'PEN', '2x'], [path, 'PEN', '1', 'extra'], []]) {
    const result = run(...args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.ok(result.stderr.trim().length > 0);
    assert.doesNotMatch(result.stderr, /at .*\(.*:\d+:\d+\)/, 'no stack trace for user errors');
  }
});
