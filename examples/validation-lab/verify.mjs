#!/usr/bin/env node
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Usage: node verify.mjs REPO PROFILE EVIDENCE_ROOT
const [repoArg, profile, outputArg] = process.argv.slice(2);
const suites = { unit: ['unit/pricing'], integration: ['integration/catalog'], e2e: ['e2e/quote'], 'combined-ab': ['unit/pricing', 'integration/catalog'], all: ['unit/pricing', 'integration/catalog', 'e2e/quote'] };
if (process.argv.length !== 5 || !suites[profile]) { console.error('usage: verify.mjs REPO unit|integration|e2e|combined-ab|all EVIDENCE_ROOT'); process.exit(1); }
const repo = resolve(repoArg), root = resolve(outputArg);
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
try {
  const head = git('rev-parse', 'HEAD');
  if (git('status', '--porcelain=v1', '--untracked-files=all', '--ignore-submodules=none')) throw new Error('Candidate must be committed and clean before verification');
  mkdirSync(root, { recursive: true });
  const directory = mkdtempSync(join(root, `${profile}-`));
  const command = [process.execPath, '--test', ...suites[profile].map(s => `test/${s}.test.mjs`)];
  const start = new Date().toISOString();
  const env = { ...process.env };
  // The verifier may itself be exercised from node:test. Do not inherit runner context.
  delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(command[0], command.slice(1), { cwd: repo, env, encoding: 'utf8', timeout: 60000, maxBuffer: 10 * 1024 * 1024 });
  writeFileSync(join(directory, 'stdout.log'), result.stdout ?? '');
  writeFileSync(join(directory, 'stderr.log'), result.stderr ?? '');
  const finalHead = git('rev-parse', 'HEAD');
  const dirty = git('status', '--porcelain=v1', '--untracked-files=all', '--ignore-submodules=none');
  const passed = result.status === 0 && !result.error && !dirty && finalHead === head;
  const manifest = { profile, repo, head, finalHead, command, start, end: new Date().toISOString(), environment: 'unique OS temp directory per test; no shared services', exitCode: result.status, signal: result.signal, error: result.error?.message ?? null, dirty, passed, directory };
  writeFileSync(join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify(manifest, null, 2));
  process.exitCode = passed ? 0 : 1;
} catch (error) { console.error(error.message); process.exitCode = 1; }
