#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// A read-only planner, not a tracker lock or an executor.
export function frontier(graph) {
  if (!Array.isArray(graph?.tickets)) throw new Error('tickets must be an array');
  const tickets = new Map();
  const states = new Set(['ready', 'running', 'review', 'blocked', 'integrated']);
  for (const t of graph.tickets) {
    if (typeof t.id !== 'string' || !t.id || tickets.has(t.id)) throw new Error('ticket IDs must be unique nonempty strings');
    if (!states.has(t.status) || !Array.isArray(t.blockedBy) || t.blockedBy.some(id => typeof id !== 'string')) throw new Error(`invalid ticket: ${t.id}`);
    if (t.status === 'integrated' && (t.verified !== true || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(t.integratedSha ?? ''))) throw new Error(`integrated ticket lacks verified revision: ${t.id}`);
    tickets.set(t.id, t);
  }
  const visited = new Set(), active = new Set();
  function visit(id) {
    if (!tickets.has(id)) throw new Error(`unknown blocker: ${id}`);
    if (active.has(id)) throw new Error(`dependency cycle at ${id}`);
    if (visited.has(id)) return;
    active.add(id);
    for (const dep of tickets.get(id).blockedBy) visit(dep);
    active.delete(id); visited.add(id);
  }
  for (const id of tickets.keys()) visit(id);
  return graph.tickets.filter(t => t.status === 'ready' && !t.claim && t.blockedBy.every(id => tickets.get(id).status === 'integrated')).map(t => t.id);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.length !== 3) throw new Error('usage: frontier.mjs graph.json');
    console.log(JSON.stringify(frontier(JSON.parse(readFileSync(process.argv[2], 'utf8'))), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
