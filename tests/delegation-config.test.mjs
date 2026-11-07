import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { labConfig } from './lab-config.mjs';
import { CONFIG_ROLES, validateConfig, parseConfig, harnessArgsFor, launchDefaults, renderTable, replaceTable, tableStatus, TABLE_START, TABLE_END } from '../scripts/delegation-config.mjs';

const withRole = (role, row) => { const c = labConfig(); c.roles[role] = row; return c; };
const errorsFor = cfg => validateConfig(cfg).join('\n');

test('config: the lab rows are valid', () => {
  assert.deepEqual(validateConfig(labConfig()), []);
  assert.doesNotThrow(() => parseConfig(JSON.stringify(labConfig())));
});

test('config: the template is a starting point, not a valid config', () => {
  const template = readFileSync(new URL('../skills/engineering/_shared/delegation.template.json', import.meta.url), 'utf8');
  const cfg = JSON.parse(template);
  assert.deepEqual(Object.keys(cfg.roles).filter(r => !CONFIG_ROLES.includes(r)), []);
  assert.match(errorsFor(cfg), /evidenceDir/);
  assert.match(errorsFor(cfg), /roles\.implementation\.model/);
});

test('harness arguments: model flag and tool profile per harness', () => {
  const { roles } = labConfig();
  assert.deepEqual(harnessArgsFor(roles.implementation), ['--model', 'deepseek/deepseek-flash']);
  assert.deepEqual(harnessArgsFor(roles['design-challenge']), ['--model', 'deepseek/deepseek-flash', '--tools', 'read,grep,find,ls']);
  // Claude Code takes the bare ID; inspect reports anthropic/<id>.
  assert.deepEqual(harnessArgsFor(roles['spec-review']), ['--model', 'claude-sonnet-5-5', '--tools', 'Read,Grep,Glob', '--permission-mode', 'dontAsk']);
  assert.deepEqual(harnessArgsFor({ ...roles.implementation, extraArgs: ['--thinking', 'high'] }), ['--model', 'deepseek/deepseek-flash', '--thinking', 'high']);
});

test('config: rejects settings the helper or the policy would reject', () => {
  const impl = labConfig().roles.implementation, spec = labConfig().roles['spec-review'];
  assert.match(errorsFor(withRole('implementation', { ...impl, model: 'deepseek-flash' })), /provider\/id/);
  assert.match(errorsFor(withRole('spec-review', { ...spec, model: 'openai/gpt-x' })), /anthropic\/<id>/);
  assert.match(errorsFor(withRole('spec-review', { ...spec, tools: 'full' })), /set "read-only"/);
  assert.match(errorsFor(withRole('spec-review', { ...spec, extraArgs: ['--model', 'x'] })), /comes from "model"/);
  assert.match(errorsFor(withRole('spec-review', { ...spec, extraArgs: ['--permission-mode=default'] })), /comes from "model"/);
  assert.match(errorsFor(withRole('implementation', { ...impl, timeoutMs: 60_000 })), /batch rows only/);
  assert.match(errorsFor(withRole('implementation', { ...impl, mode: 'coordinator' })), /interactive" or "batch/);
  assert.match(errorsFor(withRole('planning', { ...labConfig().roles.planning, mode: 'batch' })), /coordinator/);
  assert.match(errorsFor(withRole('boss', impl)), /unknown role/);
  assert.match(errorsFor(withRole('research', { unavailable: 'later', harness: 'pi' })), /only the "unavailable" reason/);
  assert.match(errorsFor(withRole('implementation', { ...impl, model2: 'x' })), /unknown setting/);
  assert.match(errorsFor({ ...labConfig(), evidenceDir: '.scratch/runs' }), /evidenceDir/);
  assert.match(errorsFor({ ...labConfig(), schemaVersion: 2 }), /schemaVersion/);
  assert.throws(() => parseConfig('{'), /not valid JSON/);
  assert.throws(() => parseConfig(JSON.stringify({ ...labConfig(), schemaVersion: 2 })), /schemaVersion/);
});

test('config: a family pattern ties the declared family to its models', () => {
  const impl = labConfig().roles.implementation;
  assert.match(errorsFor(withRole('implementation', { ...impl, model: 'openrouter/deepseek-flash' })), /does not match the DeepSeek pattern \^deepseek\//);
  // Family names match case-insensitively; a family without a pattern is not checked.
  assert.deepEqual(validateConfig(withRole('implementation', { ...impl, family: 'deepseek' })), []);
  assert.deepEqual(validateConfig(withRole('implementation', { ...impl, model: 'openrouter/x', family: 'Other' })).filter(e => /pattern/.test(e)), []);
  assert.match(errorsFor({ ...labConfig(), families: { Claude: '(' } }), /not a valid regular expression/);
  assert.match(errorsFor({ ...labConfig(), families: ['x'] }), /families: must map/);
  const { families, ...none } = labConfig();
  assert.equal(launchDefaults(none, 'spec-review').familyPattern, null, 'patterns are optional');
});

test('config: reviewers must use a different family from the work they review', () => {
  const spec = labConfig().roles['spec-review'], design = labConfig().roles['design-challenge'];
  assert.match(errorsFor(withRole('spec-review', { ...spec, harness: 'pi', model: 'deepseek/deepseek-pro', family: 'deepseek' })), /also the implementation family/);
  assert.match(errorsFor(withRole('design-challenge', { ...design, harness: 'claude', model: 'anthropic/claude-haiku-5-5', family: 'Claude' })), /also the planning family/);
  // The two review axes may share a family with each other.
  assert.deepEqual(validateConfig(labConfig()), []);
});

test('launch defaults: what a --config launch takes from the row', () => {
  const cfg = labConfig();
  assert.deepEqual(launchDefaults(cfg, 'spec-review'), {
    harness: 'claude', mode: 'batch', harnessArgs: ['--model', 'claude-sonnet-5-5', '--tools', 'Read,Grep,Glob', '--permission-mode', 'dontAsk'],
    model: 'anthropic/claude-sonnet-5-5', family: 'Claude', familyPattern: '^anthropic/', timeoutMs: 600_000, setup: 'npm ci',
  });
  assert.equal(launchDefaults(cfg, 'standards-review').timeoutMs, 1_800_000, 'falls back to limits.batchTimeoutMs');
  assert.equal(launchDefaults(cfg, 'implementation').timeoutMs, null, 'interactive sessions have no batch limit');
  assert.throws(() => launchDefaults(cfg, 'planning'), /started by hand/);
  assert.throws(() => launchDefaults(cfg, 'research'), /unavailable.*not exercised/);
  assert.throws(() => launchDefaults(cfg, 'evidence-audit'), /no row/);
});

test('role table: rendered from the config and kept in sync between markers', () => {
  const table = renderTable(labConfig());
  const lines = table.split('\n');
  assert.equal(lines[0], '| Role | Harness | Mode | Harness arguments (after `--`) | Exact model | Family |');
  assert.equal(lines[2], "| planning | Claude Code | (coordinator's own session) | — | anthropic/claude-opus-5-5 | Claude |");
  assert.ok(lines.includes('| spec-review | Claude Code | batch | `--model claude-sonnet-5-5 --tools Read,Grep,Glob --permission-mode dontAsk` | anthropic/claude-sonnet-5-5 | Claude |'));
  assert.equal(lines[4], '| research | — | — | — | unavailable: not exercised in the first run | — |', 'rows follow the fixed role order');

  const doc = `# Project delegation\r\n\r\n${TABLE_START}\r\n| old |\r\n${TABLE_END}\r\n\r\nNotes.\r\n`;
  assert.equal(tableStatus(doc, table), 'stale');
  const updated = replaceTable(doc, table);
  assert.equal(tableStatus(updated, table), 'in-sync');
  assert.ok(updated.endsWith(`${TABLE_END}\r\n\r\nNotes.\r\n`), 'text outside the markers is kept');
  assert.ok(!/[^\r]\n/.test(updated), 'the document keeps its CRLF line endings');
  assert.equal(replaceTable(updated, table), updated, 'rendering again changes nothing');
  assert.equal(tableStatus('# no table', table), 'no-markers');
  assert.equal(replaceTable('# no table', table), null);
});
