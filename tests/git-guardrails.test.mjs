import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { blockedReason, readConfig, readDefaultPatterns, createGuardrailHandler } from '../lib/git-guardrails.mjs';
const defaults = readDefaultPatterns();
function fixture(t) { const dir=mkdtempSync(join(tmpdir(),'mp-guard-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));mkdirSync(join(dir,'.pi'));return dir; }
test('guardrail requires explicit opt-in and respects project overrides', t => {
  const repo=fixture(t),home=fixture(t);mkdirSync(join(home,'.pi/agent'));
  writeFileSync(join(home,'.pi/agent/git-guardrails.json'),'{"enabled":true}');
  assert.equal(readConfig(repo,defaults,home).enabled,true);
  for(const content of ['{}','{"enabled":false}','{"enabled":"true"}','{']){
    writeFileSync(join(repo,'.pi/git-guardrails.json'),content);
    assert.equal(readConfig(repo,defaults,home).enabled,false);
  }
});
test('actual Bash handler blocks common Git option forms without executing commands', async t => {
  const repo=fixture(t);writeFileSync(join(repo,'.pi/git-guardrails.json'),'{"enabled":true}');
  const handler=createGuardrailHandler(defaults,repo),ctx={cwd:repo,hasUI:false};
  for(const command of ['git push origin main','git -C /tmp push origin main','git -C "path with spaces" -c advice.detachedHead=false clean -fd','git --git-dir=/tmp/repo --work-tree /tmp/tree branch -D topic','git --no-pager restore .','git.exe -C /tmp checkout .']){
    assert.equal((await handler({toolName:'bash',input:{command}},ctx))?.block,true,command);
  }
  assert.equal(await handler({toolName:'bash',input:{command:'git -C /tmp status'}},ctx),undefined);
  assert.equal(await handler({toolName:'read',input:{command:'git push'}},ctx),undefined);
});
test('custom patterns remain effective and invalid enabled patterns fail visibly', () => {
  assert.ok(blockedReason('rm file',{enabled:true,patterns:['^rm ']}));
  assert.equal(blockedReason('git push',{enabled:true,patterns:[]}),undefined);
  assert.match(blockedReason('git status',{enabled:true,patterns:['[']}),/configuration error/);
});
test('standalone checker shares global-option handling', () => {
  const result=spawnSync(process.execPath,['lib/git-guardrails.mjs','git -C /tmp push origin main'],{encoding:'utf8'});
  assert.equal(result.status,1);assert.match(result.stderr,/BLOCKED/);
});
