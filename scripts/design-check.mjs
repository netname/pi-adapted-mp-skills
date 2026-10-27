#!/usr/bin/env node
// Record integrity only: this cannot authenticate humans or judge a design.
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

function need(condition, message) { if (!condition) throw new Error(message); }
function text(value) { return typeof value === 'string' && value.trim().length > 0; }
function localFile(repo, file) {
  need(text(file) && !isAbsolute(file) && !file.includes('\\') && !/^[A-Za-z]:/.test(file), 'Use repository-relative forward-slash paths');
  const root = realpathSync(repo), target = realpathSync(resolve(root, file));
  const rel = relative(root, target);
  need(rel && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel), `Path escapes repository: ${file}`);
  need(statSync(target).isFile(), `Not a file: ${file}`);
  return target;
}
export function snapshot(repo, files) {
  need(Array.isArray(files) && files.length > 0 && new Set(files).size === files.length, 'Select a nonempty unique file list');
  return Object.fromEntries([...files].sort().map(file => [file, createHash('sha256').update(readFileSync(localFile(repo, file))).digest('hex')]));
}
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function fingerprints(repo, expected, label) {
  need(expected && typeof expected === 'object' && !Array.isArray(expected), `${label}: missing hashes`);
  const files = Object.keys(expected).sort();
  need(files.every(f => /^[a-f0-9]{64}$/.test(expected[f])), `${label}: invalid SHA-256`);
  const current = snapshot(repo, files);
  need(same(current, Object.fromEntries(files.map(f => [f, expected[f]]))), `${label}: stale files; review changes before refreshing acceptance`);
  return current;
}
export function checkDesign(repo, record) {
  need(record?.schemaVersion === 1, 'Unsupported design record version');
  need(['lightweight', 'full'].includes(record.route), 'Choose lightweight or full route');
  need(record.status === 'accepted', 'Design/plan is not accepted');
  const inputs = fingerprints(repo, record.inputs, 'Design inputs');
  need(Array.isArray(record.authorFamilies) && record.authorFamilies.length > 0 && record.authorFamilies.every(text), 'Record design author families');
  const authors = record.authorFamilies.map(f => f.trim().toLowerCase());
  need(Array.isArray(record.reviews) && record.reviews.length === 2, 'Require two design review axes');
  const ids = new Set();
  for (const axis of ['comprehension', 'challenge']) {
    const review = record.reviews.find(r => r.axis === axis);
    need(review && review.status === 'complete' && review.blockingFindings === 0, `${axis}: incomplete or blocking findings`);
    need(text(review.runId) && !ids.has(review.runId), `${axis}: require distinct fresh run IDs`);
    ids.add(review.runId);
    need(text(review.model) && text(review.family) && !authors.includes(review.family.trim().toLowerCase()), `${axis}: reviewer family must differ from design authors`);
    need(same(Object.entries(review.inputs ?? {}).sort(), Object.entries(inputs).sort()), `${axis}: reviewed inputs differ`);
    need(text(review.report) && !Object.hasOwn(inputs, review.report), `${axis}: report must be outside input set`);
    fingerprints(repo, { [review.report]: review.reportSha256 }, `${axis} report`);
  }
  need(record.reviews[0].report !== record.reviews[1].report, 'Require separate review reports');
  need(record.approval && text(record.approval.by) && text(record.approval.reference) && text(record.approval.at) && Number.isFinite(Date.parse(record.approval.at)), 'Record actual human acceptance identity, reference and time');
  need(same(Object.entries(record.approval.inputs ?? {}).sort(), Object.entries(inputs).sort()), 'Human acceptance targets different inputs');
  return { ready: true, route: record.route, inputs, limitation: 'Record integrity only; input completeness, actual independence, human consent and design quality require inspection.' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [command, repo, ...args] = process.argv.slice(2);
    need(repo && ((command === 'snapshot' && args.length > 0) || (command === 'check' && args.length === 1)), 'usage: design-check.mjs snapshot REPO FILE... | check REPO RECORD');
    let result;
    if (command === 'snapshot') result = snapshot(repo, args);
    else {
      const record = JSON.parse(readFileSync(localFile(repo, args[0]), 'utf8'));
      need(!Object.hasOwn(record.inputs ?? {}, args[0]), 'Readiness record cannot hash itself');
      result = checkDesign(repo, record);
    }
    console.log(JSON.stringify(result, null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
