import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter } from '../lib/frontmatter.mjs';

test('rejects malformed nested YAML that the old validator accepted', () => {
  const result = parseFrontmatter('---\nname: pr\ndescription: Example\nlicense: MIT\n  upstream: example/skills\n---\n');
  assert.ok(result.error);
});
test('parses quoted colons, multiline descriptions and metadata with source lines', () => {
  const result = parseFrontmatter('---\nname: example\ndescription: >\n  First line:\n  second line.\nmetadata:\n  source: "repo: source"\ndisable-model-invocation: true\n---\n');
  assert.equal(result.error, undefined);
  assert.match(result.data.description, /First line: second line/);
  assert.equal(result.data.metadata.source, 'repo: source');
  assert.equal(result.keys.find(k => k.key === 'metadata').line, 6);
});
test('rejects duplicate fields, incorrect field types and missing YAML fences', () => {
  for (const content of ['name: one\nname: two\ndescription: example', 'name: 7\ndescription: example', 'name: one\ndescription: [bad]', 'name: one\ndescription: ok\nmetadata: false', 'name: one\ndescription: ok\ndisable-model-invocation: "false"']) {
    assert.ok(parseFrontmatter(`---\n${content}\n---`).error);
  }
  assert.ok(parseFrontmatter('---\nname: one').error);
  assert.equal(parseFrontmatter('name: one'), null);
});
