import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
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
  const before = await readFile(path, "utf8");
  assert.deepEqual(await loadCatalog(path), items);
  assert.equal(await readFile(path, "utf8"), before);
});
test('rejects duplicate SKUs, invalid shapes, prices and malformed JSON', async t => {
  for (const data of ['{', '{}', '[null]', '[{"sku":1,"name":"x","unitPriceCents":1}]', '[{"sku":"A","name":"x","unitPriceCents":"1"}]', '[{"sku":"A","name":"x","unitPriceCents":9007199254740992}]', '[{"sku":"","name":"x","unitPriceCents":1}]', '[{"sku":"A","name":"","unitPriceCents":1}]', '[{"sku":"A","name":"x","unitPriceCents":-1}]', '[{"sku":"A","name":"x","unitPriceCents":1.5}]', '[{"sku":"A","name":"x","unitPriceCents":1},{"sku":"A","name":"y","unitPriceCents":2}]']) {
    const path = await fixture(t, data);
    await assert.rejects(() => loadCatalog(path));
    assert.equal(await readFile(path, "utf8"), data);
  }
});
test('reports a missing catalog', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'quote-missing-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await assert.rejects(() => loadCatalog(join(dir, 'absent.json')));
});

test('allows an empty catalog and treats SKU case distinctly', async t => {
  assert.deepEqual(await loadCatalog(await fixture(t, '[]')), []);
  const items = [{ sku: 'PEN', name: 'A', unitPriceCents: 0 }, { sku: 'pen', name: 'B', unitPriceCents: 1 }];
  assert.deepEqual(await loadCatalog(await fixture(t, JSON.stringify(items))), items);
});
