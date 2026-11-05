import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkDesign, snapshot } from '../scripts/design-check.mjs';
function fixture(t) {
  const repo = mkdtempSync(join(tmpdir(), 'mp-design-'));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  for (const file of ['spec.md', 'design.md', 'model.c4', 'plan.md', 'comprehension.md', 'challenge.md']) writeFileSync(join(repo, file), file);
  const inputs = snapshot(repo, ['spec.md', 'design.md', 'model.c4', 'plan.md']);
  const record = { schemaVersion: 1, status: 'accepted', route: 'full', authorFamilies: ['Claude'], inputs,
    reviews: ['comprehension', 'challenge'].map(axis => ({ axis, runId: axis, model: 'synthetic-test-model', family: 'DeepSeek', status: 'complete', blockingFindings: 0, inputs, report: `${axis}.md`, reportSha256: snapshot(repo, [`${axis}.md`])[`${axis}.md`] })),
    approval: { by: 'Synthetic test fixture, not a real approval', at: '2026-01-01T00:00:00Z', reference: 'test-only', inputs } };
  return { repo, record };
}
test('accepts structurally complete full and lightweight records without claiming design quality', t => {
  const { repo, record } = fixture(t);
  assert.equal(checkDesign(repo, record).ready, true);
  record.route = 'lightweight'; assert.equal(checkDesign(repo, record).ready, true);
});
test('rejects changed spec, design, model and plan rather than refreshing approval', t => {
  const { repo, record } = fixture(t);
  for (const file of Object.keys(record.inputs)) {
    writeFileSync(join(repo, file), 'changed');
    assert.throws(() => checkDesign(repo, record), /stale files/);
    writeFileSync(join(repo, file), file);
  }
});
test('rejects missing approval, incomplete axes, same-family review and reused sessions', t => {
  const { repo, record } = fixture(t);
  const cases = [r => { r.status = 'draft'; }, r => { delete r.approval; }, r => { r.reviews.pop(); }, r => { r.reviews[0].family = ' claude '; }, r => { r.reviews[0].blockingFindings = 1; }, r => { r.reviews[0].status = 'failed'; }, r => { r.reviews[0].runId = r.reviews[1].runId; }, r => { r.reviews[0].inputs = {}; }, r => { r.approval.inputs = {}; }];
  for (const mutate of cases) { const copy = structuredClone(record); mutate(copy); assert.throws(() => checkDesign(repo, copy)); }
});
test('rejects changed review evidence and unsafe snapshot paths', t => {
  const { repo, record } = fixture(t);
  writeFileSync(join(repo, 'challenge.md'), 'changed verdict');
  assert.throws(() => checkDesign(repo, record), /stale files/);
  for (const files of [[], ['spec.md', 'spec.md'], ['/etc/passwd'], ['C:\\outside'], ['missing']]) assert.throws(() => snapshot(repo, files));
  if (process.platform !== 'win32') { symlinkSync('/etc/passwd', join(repo, 'escape')); assert.throws(() => snapshot(repo, ['escape']), /escapes/); }
});
