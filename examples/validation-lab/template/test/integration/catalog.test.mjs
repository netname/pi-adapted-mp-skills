import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadCatalog } from '../../src/catalog.mjs';

async function fixture(t, content) {
  const dir = await mkdtemp(join(tmpdir(), 'quote-catalog-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = join(dir, 'catalog.json');
  await writeFile(file, content);
  return file;
}
test('reads a real catalog without changing it', async t => {
  const items = [{ sku: 'PEN', name: 'Bolígrafo', unitPriceCents: 1250 }];
  const path = await fixture(t, JSON.stringify(items));
  assert.deepEqual(await loadCatalog(path), items);
});
test('rejects duplicate SKUs, invalid shapes, prices and malformed JSON', async t => {
  for (const data of ['{', '{}', '[null]', '[{"sku":"","name":"x","unitPriceCents":1}]', '[{"sku":"A","name":"","unitPriceCents":1}]', '[{"sku":"A","name":"x","unitPriceCents":-1}]', '[{"sku":"A","name":"x","unitPriceCents":1.5}]', '[{"sku":"A","name":"x","unitPriceCents":1},{"sku":"A","name":"y","unitPriceCents":2}]']) {
    const path = await fixture(t, data);
    await assert.rejects(() => loadCatalog(path));
  }
});
test('reports a missing catalog', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'quote-missing-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await assert.rejects(() => loadCatalog(join(dir, 'absent.json')));
});
