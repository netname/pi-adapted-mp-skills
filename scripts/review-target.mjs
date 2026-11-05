#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function captureReview({ repo, base, head }) {
  if (!repo || !base || !head) throw new Error('repo, base and head are required');
  repo = resolve(repo);
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  const revision = ref => git('rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`).trim();
  const baseSha = revision(base), headSha = revision(head);
  const clean = () => {
    if (revision('HEAD') !== headSha) throw new Error('head must match the checked-out candidate');
    if (git('status', '--porcelain=v1', '--untracked-files=all', '--ignore-submodules=none').trim()) throw new Error('dirty worktree: commit intended changes before review');
  };
  clean();
  const mergeBase = git('merge-base', baseSha, headSha).trim();
  const diff = git('diff', '--no-ext-diff', '--no-textconv', '--binary', mergeBase, headSha, '--');
  if (!diff.trim()) throw new Error('empty diff: no candidate changes to review');
  const commits = git('log', '--format=%H %s', `${mergeBase}..${headSha}`, '--');
  clean();
  const directory = mkdtempSync(join(tmpdir(), 'mp-review-'));
  const manifest = { schemaVersion: 1, repo, base: baseSha, mergeBase, head: headSha, directory, diff: join(directory, 'diff.patch'), commits: join(directory, 'commits.txt') };
  writeFileSync(manifest.diff, diff);
  writeFileSync(manifest.commits, commits);
  writeFileSync(join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2), options = {};
    for (let i = 0; i < args.length; i += 2) {
      if (!['--repo', '--base', '--head'].includes(args[i]) || !args[i + 1] || args[i].slice(2) in options) throw new Error('usage: review-target.mjs --repo PATH --base REF --head REF');
      options[args[i].slice(2)] = args[i + 1];
    }
    console.log(JSON.stringify(captureReview(options), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
