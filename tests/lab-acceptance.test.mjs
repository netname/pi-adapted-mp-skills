import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Synthetic implementation tests the acceptance suite, never copied by the lab generator.
const pricing = `export function calculateTotalCents(p,q) {
  if(!Number.isSafeInteger(p)||p<0||!Number.isSafeInteger(q)||q<=0||!Number.isSafeInteger(p*q)) throw new RangeError('Invalid amount');
  return p*q;
}`;
const catalog = `import {readFile} from 'node:fs/promises';
export async function loadCatalog(path) {
  const items=JSON.parse(await readFile(path,'utf8')), seen=new Set();
  if(!Array.isArray(items)) throw new Error('Invalid catalog');
  for(const item of items) {
    if(!item||typeof item.sku!=='string'||!item.sku.length||typeof item.name!=='string'||!item.name.length||!Number.isSafeInteger(item.unitPriceCents)||item.unitPriceCents<0||seen.has(item.sku)) throw new Error('Invalid item');
    seen.add(item.sku);
  }
  return items;
}`;
const cli = `import {loadCatalog} from './catalog.mjs';
import {calculateTotalCents} from './pricing.mjs';
try {
  const args=process.argv.slice(2), [path,sku,q]=args;
  if(args.length!==3||!/^\\d+$/.test(q)) throw new Error('Invalid arguments');
  const quantity=Number(q), items=await loadCatalog(path), item=items.find(x=>x.sku===sku);
  if(!item) throw new Error('Missing SKU');
  const totalCents=calculateTotalCents(item.unitPriceCents,quantity);
  process.stdout.write(JSON.stringify({sku,name:item.name,quantity,totalCents}) + '\\n');
} catch(error) { console.error(error.message); process.exitCode=1; }`;
test('lab acceptance rejects a missing newline and input mutation', t => {
  const root=mkdtempSync(join(tmpdir(),'mp-acceptance-')),repo=join(root,'lab');
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  execFileSync(process.execPath,[resolve('examples/validation-lab/create.mjs'),repo]);
  mkdirSync(join(repo,'src'));
  const write=(name,source)=>writeFileSync(join(repo,'src',name+'.mjs'),source);
  write('pricing',pricing);write('catalog',catalog);write('cli',cli);
  const env={...process.env};delete env.NODE_TEST_CONTEXT;
  const run=(files)=>spawnSync(process.execPath,['--test',...files],{cwd:repo,env,encoding:'utf8',timeout:15000});
  const all=['test/unit/pricing.test.mjs','test/integration/catalog.test.mjs','test/e2e/quote.test.mjs'];
  const good=run(all);assert.equal(good.status,0,good.stdout+good.stderr);
  write('cli',cli.replace(" + '\\n'",''));
  const newline=run(['test/e2e/quote.test.mjs']);assert.equal(newline.status,1);assert.match(newline.stdout,/JSON output ends with a newline/);
  write('cli',cli);
  write('catalog',catalog.replace('{readFile}','{readFile,appendFile}').replace('return items;',"await appendFile(path,'\\n'); return items;"));
  assert.equal(run(['test/integration/catalog.test.mjs']).status,1);
  assert.ok(readFileSync(join(repo,'src/catalog.mjs'),'utf8').includes('appendFile'));
});
