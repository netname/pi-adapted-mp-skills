#!/usr/bin/env node
// Delegation transport over Herdr TUI: launch fresh sessions in persistent panes, and record what
// actually ran. It does not choose work, judge results or enforce policy; see
// skills/engineering/_shared/DELEGATION.md.
//
//   launch  --record R --role ROLE --name NAME --harness pi|claude --mode interactive|batch
//           --brief FILE --task FILE [--output FILE] (--cwd DIR | --worktree --repo DIR --branch B --base REF)
//           [--timeout-ms N] [--setup CMD] [--setup-timeout-ms N] [--ports N]
//           [-- HARNESS_ARGS...]
//   exec    R          (runs inside the pane for --mode batch; not for direct use)
//   inspect R [--expect-model PROVIDER/MODEL]
//
// Every path is absolute. The record lives outside the delegated checkout, or in a Git-ignored path.

import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, renameSync, openSync, closeSync } from 'node:fs';
import { createServer } from 'node:net';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HELPER = fileURLToPath(import.meta.url);
const ROLES = ['implementation', 'research', 'spec-review', 'standards-review', 'design-comprehension', 'design-challenge', 'exploration', 'evidence-audit'];
const BATCH_INSTRUCTION = 'Follow the role brief and the task you were given. Return your complete report as your final answer. Do not modify, create or delete any file.';
export const DEFAULTS = { timeoutMs: 30 * 60 * 1000, setupTimeoutMs: 10 * 60 * 1000, ports: 0 };
const PORT_RANGE = { low: 20000, size: 20000 };

function need(condition, message) { if (!condition) throw new Error(message); }
const sha256 = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const now = () => new Date().toISOString();
const inside = (child, parent) => { const r = relative(parent, child); return r === '' || (!r.startsWith(`..${sep}`) && r !== '..' && !isAbsolute(r)); };

// ---- Parsers (pure; exported for tests) -------------------------------------------------------

function jsonLines(text) {
  return text.split(/\r?\n/).filter(l => l.trim()).flatMap(l => { try { return [JSON.parse(l)]; } catch { return []; } });
}

/** Pi session file (.jsonl): the last model_change is the model in effect. */
export function piSessionModel(text) {
  const changes = jsonLines(text).filter(e => e.type === 'model_change' && e.provider && e.modelId);
  const last = changes.at(-1);
  return last ? { provider: last.provider, model: last.modelId } : null;
}

/** `pi -p --mode json` stream: effective model per assistant message, and the final text. */
export function piStreamResult(text) {
  const events = jsonLines(text);
  const replies = events.filter(e => e.type === 'message_end' && e.message?.role === 'assistant').map(e => e.message);
  const models = [...new Set(replies.filter(m => m.provider && m.model).map(m => `${m.provider}/${m.model}`))];
  const last = replies.at(-1);
  const finalText = (last?.content ?? []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
  const settled = events.find(e => e.type === 'agent_settled');
  return { models, finalText, aborted: settled ? settled.aborted === true : true, error: last?.stopReason === 'error' };
}

/** `claude -p --output-format json` result object. */
export function claudeResult(text) {
  const obj = JSON.parse(text.trim());
  const models = Object.keys(obj.modelUsage ?? {}).map(m => `anthropic/${m}`);
  return { models, finalText: String(obj.result ?? '').trim(), aborted: false, error: obj.is_error === true };
}

/** Claude Code session file (.jsonl): models named on assistant messages. */
export function claudeSessionModels(text) {
  return [...new Set(jsonLines(text).filter(e => e.type === 'assistant' && e.message?.model).map(e => `anthropic/${e.message.model}`))];
}

/**
 * Batch outcome from exit status, timeout and parsed output (pure). A run passes only when it
 * exited 0 in time, settled, reported no error and produced a final answer.
 */
export function batchOutcome({ status, timedOut }, result) {
  if (timedOut) return { status: 'failed', failureReason: 'timeout' };
  if (status !== 0) return { status: 'failed', failureReason: 'exit' };
  if (!result) return { status: 'failed', failureReason: 'unparsable' };
  if (result.aborted) return { status: 'failed', failureReason: 'aborted' };
  if (result.error) return { status: 'failed', failureReason: 'harness-error' };
  if (!result.finalText) return { status: 'failed', failureReason: 'empty' };
  return { status: 'completed', failureReason: null };
}

/** Candidate ports for a run: deterministic from the run identity, spread over the range (pure). */
export function portCandidates(seed, count, tries = 50) {
  const start = createHash('sha256').update(seed).digest().readUInt32BE(0) % PORT_RANGE.size;
  return Array.from({ length: count * tries }, (_, i) => PORT_RANGE.low + ((start + i * 7919) % PORT_RANGE.size));
}

/** Environment a delegated run's setup command and batch harness receive (pure). */
export function resourceEnv(runId, ports) {
  const env = { MP_RUN_ID: runId };
  ports.forEach((p, i) => { env[`MP_RUN_PORT_${i + 1}`] = String(p); });
  if (ports.length) env.MP_RUN_PORT = String(ports[0]);
  return env;
}

// ---- Process helpers ---------------------------------------------------------------------------

function run(cmd, args, options = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...options });
  if (r.error) throw new Error(r.error.code === 'ENOENT' ? `\`${cmd}\` not found on PATH` : `${cmd}: ${r.error.message}`);
  return r;
}
function herdr(args) {
  const r = run('herdr', args);
  const out = (r.stdout || '').trim();
  let parsed; try { parsed = JSON.parse(out); } catch { throw new Error(`herdr ${args.slice(0, 2).join(' ')}: ${(out || r.stderr).trim()}`); }
  if (parsed.error) throw new Error(`herdr ${args.slice(0, 2).join(' ')}: ${parsed.error.code}: ${parsed.error.message}`);
  return parsed.result;
}

/** Kill a child and everything it started (a shell, the harness, its tools). */
function killTree(child) {
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else { try { process.kill(-child.pid, 'SIGKILL'); } catch { try { child.kill('SIGKILL'); } catch { /* gone */ } } }
}

/** Run with a hard time limit; on expiry the whole process tree is killed. */
export function runLimited(cmd, args, { timeoutMs, stdin = 'ignore', ...options }) {
  return new Promise(resolvePromise => {
    const child = spawn(cmd, args, { ...options, stdio: [stdin, 'pipe', 'pipe'], detached: process.platform !== 'win32', windowsHide: true });
    const out = [], err = [];
    let timedOut = false;
    child.stdout.on('data', c => out.push(c));
    child.stderr.on('data', c => err.push(c));
    const timer = setTimeout(() => { timedOut = true; killTree(child); }, timeoutMs);
    child.on('error', e => { clearTimeout(timer); resolvePromise({ status: null, timedOut, error: e, stdout: '', stderr: String(e.message) }); });
    child.on('close', status => {
      clearTimeout(timer);
      resolvePromise({ status: timedOut ? null : status, timedOut, stdout: Buffer.concat(out).toString('utf8'), stderr: Buffer.concat(err).toString('utf8') });
    });
  });
}

function portFree(port) {
  return new Promise(resolvePromise => {
    const server = createServer().once('error', () => resolvePromise(false));
    server.listen(port, '127.0.0.1', () => server.close(() => resolvePromise(true)));
  });
}
async function allocatePorts(seed, count) {
  const ports = [];
  for (const p of portCandidates(seed, count)) {
    if (ports.length === count) break;
    if (!ports.includes(p) && await portFree(p)) ports.push(p);
  }
  need(ports.length === count, `could not find ${count} free port(s) in ${PORT_RANGE.low}-${PORT_RANGE.low + PORT_RANGE.size - 1}`);
  return ports;
}

const readRecord = file => JSON.parse(readFileSync(file, 'utf8'));
function writeRecord(file, record) {
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, JSON.stringify(record, null, 2) + '\n');
  renameSync(tmp, file);
}
const base = file => file.replace(/\.json$/, '');

// ---- Options -----------------------------------------------------------------------------------

function intOption(o, key, low, high) {
  if (o[key] === undefined) return;
  const n = Number(o[key]);
  need(Number.isInteger(n) && n >= low && n <= high, `--${key.replace(/[A-Z]/g, c => '-' + c.toLowerCase())} must be an integer in [${low}, ${high}]`);
  o[key] = n;
}

export function parseLaunch(argv) {
  const o = { harnessArgs: [], worktree: false };
  const i = argv.indexOf('--');
  const own = i === -1 ? argv : argv.slice(0, i);
  if (i !== -1) o.harnessArgs = argv.slice(i + 1);
  for (let k = 0; k < own.length; k++) {
    const flag = own[k];
    if (flag === '--worktree') { o.worktree = true; continue; }
    const key = { '--record': 'record', '--role': 'role', '--name': 'name', '--harness': 'harness', '--mode': 'mode', '--brief': 'brief',
      '--task': 'task', '--output': 'output', '--cwd': 'cwd', '--repo': 'repo', '--branch': 'branch', '--base': 'base',
      '--timeout-ms': 'timeoutMs', '--setup': 'setup', '--setup-timeout-ms': 'setupTimeoutMs', '--ports': 'ports' }[flag];
    need(key && own[k + 1] !== undefined && !(key in o), `bad or repeated option: ${flag}`);
    o[key] = own[++k];
  }
  for (const k of ['record', 'role', 'name', 'harness', 'mode', 'brief', 'task']) need(o[k], `missing --${k}`);
  need(ROLES.includes(o.role), `unknown role ${o.role}; use one of ${ROLES.join(', ')}`);
  need(['pi', 'claude'].includes(o.harness), 'harness must be pi or claude');
  need(['interactive', 'batch'].includes(o.mode), 'mode must be interactive or batch');
  // Herdr agent names: lowercase letter first, then [a-z0-9_-], 1-32 characters.
  need(/^[a-z][a-z0-9_-]{0,31}$/.test(o.name), 'name must match ^[a-z][a-z0-9_-]{0,31}$ (Herdr agent name rule)');
  for (const k of ['record', 'brief', 'task', 'output', 'cwd', 'repo']) if (o[k]) need(isAbsolute(o[k]), `--${k} must be an absolute path`);
  for (const k of ['brief', 'task']) need(existsSync(o[k]), `--${k} not found: ${o[k]}`);
  if (o.worktree) need(o.repo && o.branch && o.base && !o.cwd, '--worktree needs --repo, --branch and --base, and no --cwd');
  else need(o.cwd && !o.repo && !o.branch && !o.base, 'give --cwd, or --worktree with --repo/--branch/--base');
  if (o.mode === 'batch') need(o.output, 'batch mode needs --output for the report');
  // An interactive session has no exit status to time out; wait for it with `herdr agent wait --timeout`.
  if (o.timeoutMs !== undefined) need(o.mode === 'batch', '--timeout-ms applies to batch mode only; for interactive sessions use herdr agent wait --timeout');
  intOption(o, 'timeoutMs', 10_000, 24 * 60 * 60 * 1000);
  intOption(o, 'setupTimeoutMs', 1_000, 2 * 60 * 60 * 1000);
  intOption(o, 'ports', 0, 10);
  if (o.setup !== undefined) need(o.setup.trim(), '--setup needs a command');
  if (o.setupTimeoutMs !== undefined) need(o.setup, '--setup-timeout-ms needs --setup');
  if (o.mode === 'batch') o.timeoutMs ??= DEFAULTS.timeoutMs;
  o.setupTimeoutMs ??= DEFAULTS.setupTimeoutMs;
  o.ports ??= DEFAULTS.ports;
  if (process.platform === 'win32') for (const a of o.harnessArgs) need(!/["%]/.test(a), `harness argument cannot contain " or % on Windows: ${a}`);
  return o;
}

// Roles whose output may be a tracked file inside the delegated checkout. Design reviews write the
// report that design-check later reads from inside the repository; research and implementation
// write their own artifacts. Code review and the other read-only roles must leave the checkout clean.
const OUTPUT_IN_TREE = ['research', 'implementation', 'design-comprehension', 'design-challenge'];

/**
 * Where the record and the output may go, relative to the delegated checkout (pure; exported for
 * tests). Inside the checkout is allowed only when Git ignores the path, so the checkout stays
 * clean, except for an OUTPUT_IN_TREE role's output.
 */
export function checkPaths({ record, output, role }, cwd, isIgnored) {
  const within = p => inside(resolve(p), resolve(cwd));
  need(!within(record) || isIgnored(record), 'the record must live outside the delegated checkout or in a Git-ignored path inside it (for example .scratch/)');
  if (output && !OUTPUT_IN_TREE.includes(role)) {
    need(!within(output) || isIgnored(output), `${role} output must live outside the delegated checkout or in a Git-ignored path inside it`);
  }
}
export function gitIgnored(cwd) {
  return p => run('git', ['-C', cwd, 'check-ignore', '-q', '--no-index', '--', resolve(p)]).status === 0;
}

// ---- Commands ----------------------------------------------------------------------------------

async function launch(argv) {
  const o = parseLaunch(argv);
  need(!existsSync(o.record), `record already exists: ${o.record}; use a new run name`);
  if (o.output) need(!existsSync(o.output), `output already exists: ${o.output}; use a new path for each run`);
  if (o.cwd) checkPaths(o, o.cwd, gitIgnored(o.cwd));
  const status = run('herdr', ['status', 'server']).stdout;
  need(/status:\s*running/.test(status), 'the Herdr server is not running; start it with `herdr` (or `herdr --session NAME`) in its own terminal');
  if (o.mode === 'interactive') {
    const taken = run('herdr', ['agent', 'get', o.name]);
    need(/agent_not_found/.test(taken.stdout + taken.stderr), `a Herdr agent named ${o.name} already exists`);
  }
  const created = o.worktree
    ? herdr(['worktree', 'create', '--cwd', o.repo, '--branch', o.branch, '--base', o.base, '--label', o.name, '--no-focus'])
    : herdr(['workspace', 'create', '--cwd', o.cwd, '--label', o.name, '--no-focus']);
  const pane = created?.root_pane;
  need(pane?.pane_id, 'herdr did not return a pane id');
  const cwd = o.worktree ? created.workspace?.worktree?.checkout_path ?? pane.cwd : o.cwd;
  if (o.worktree) checkPaths(o, cwd, gitIgnored(cwd));

  const herdrSession = process.env.HERDR_SESSION || 'default';
  const runId = `${herdrSession}:${o.name}:${pane.terminal_id}`;
  const ports = o.ports ? await allocatePorts(runId, o.ports) : [];
  const record = {
    schemaVersion: 1, runId, role: o.role,
    harness: o.harness, mode: o.mode, herdrSession, agentName: o.mode === 'interactive' ? o.name : null,
    workspaceId: pane.workspace_id, paneId: pane.pane_id, terminalId: pane.terminal_id, cwd,
    worktree: o.worktree ? { repo: o.repo, branch: o.branch, base: o.base } : null,
    brief: { path: o.brief, sha256: sha256(o.brief) }, task: { path: o.task, sha256: sha256(o.task) }, output: o.output ?? null,
    harnessArgs: o.harnessArgs, timeoutMs: o.timeoutMs ?? null,
    resources: { env: resourceEnv(runId, ports), note: 'Ports were free at launch; they are not reserved. Shared services still need a lease.' },
    setup: o.setup ? { command: o.setup, timeoutMs: o.setupTimeoutMs, exitCode: null, timedOut: false, log: `${base(o.record)}.setup.log` } : null,
    status: 'launched', failureReason: null, exitCode: null, effective: null, sessionFile: null, stream: null,
    startedAt: now(), finishedAt: null,
  };
  writeRecord(o.record, record);

  if (o.setup) {
    // The project's worktree setup (dependencies, local config) runs before the harness starts.
    const shell = process.platform === 'win32' ? ['cmd.exe', ['/d', '/s', '/c', `"${o.setup}"`]] : ['/bin/sh', ['-c', o.setup]];
    const r = await runLimited(shell[0], shell[1], { cwd, timeoutMs: o.setupTimeoutMs, env: { ...process.env, ...record.resources.env }, windowsVerbatimArguments: true });
    writeFileSync(record.setup.log, `$ ${o.setup}\n${r.stdout}${r.stderr ? `\n--- stderr ---\n${r.stderr}` : ''}`);
    Object.assign(record.setup, { exitCode: r.status, timedOut: r.timedOut });
    if (r.timedOut || r.status !== 0) {
      Object.assign(record, { status: 'failed', failureReason: r.timedOut ? 'setup-timeout' : 'setup', finishedAt: now() });
      writeRecord(o.record, record);
      throw new Error(`setup ${r.timedOut ? 'timed out' : `failed (exit ${r.status})`}; see ${record.setup.log}. The workspace is left for inspection: herdr workspace close ${pane.workspace_id}`);
    }
    writeRecord(o.record, record);
  }

  if (o.mode === 'interactive') {
    const started = herdr(['agent', 'start', o.name, '--kind', o.harness, '--pane', pane.pane_id, '--timeout', '120000', ...(o.harnessArgs.length ? ['--', ...o.harnessArgs] : [])]);
    record.sessionFile = started?.agent?.agent_session?.value ?? null;
    const outputLine = o.output ? ` Write your result to ${o.output}.` : '';
    const env = Object.entries(record.resources.env).map(([k, v]) => `${k}=${v}`).join(' ');
    const envLine = ports.length ? ` Use these run resources for any server or test you start (set them in your shell first): ${env}.` : '';
    herdr(['agent', 'prompt', o.name, `Read the role brief at ${o.brief} and the task at ${o.task}, then follow them.${outputLine}${envLine}`]);
    record.status = 'running';
    writeRecord(o.record, record);
  } else {
    // `pane run` prints nothing on success. From here on only `exec` (in the pane) writes the record.
    const r = run('herdr', ['pane', 'run', pane.pane_id, `node "${HELPER}" exec "${o.record}"`]);
    need(r.status === 0 && !/"error"/.test(r.stdout), `herdr pane run failed: ${(r.stdout + r.stderr).trim()}`);
  }
  console.log(JSON.stringify(record, null, 2));
}

function quoteCmd(a) { return /^[A-Za-z0-9_./:=@\\-]+$/.test(a) ? a : `"${a}"`; }

async function exec([file]) {
  need(file && isAbsolute(file), 'exec needs the absolute record path');
  const record = readRecord(file);
  need(record.mode === 'batch' && record.status === 'launched', 'exec only runs a launched batch record');
  record.status = 'running'; record.stream = `${base(file)}.out`; writeRecord(file, record);
  const args = record.harness === 'pi'
    ? ['-p', '--mode', 'json', '--no-session', ...record.harnessArgs, `@${record.brief.path}`, `@${record.task.path}`]
    : ['-p', '--output-format', 'json', ...record.harnessArgs, `Role brief: ${record.brief.path}. Task: ${record.task.path}. Read both.`];
  writeFileSync(`${file}.prompt`, BATCH_INSTRUCTION + '\n');
  const stdin = openSync(`${file}.prompt`, 'r');
  const options = { cwd: record.cwd, stdin, timeoutMs: record.timeoutMs ?? DEFAULTS.timeoutMs, env: { ...process.env, ...(record.resources?.env ?? {}) } };
  let r;
  try {
    // npm installs pi/claude as .cmd shims on Windows, which need a shell; quote every argument.
    r = process.platform === 'win32'
      ? await runLimited(record.harness, args.map(quoteCmd), { ...options, shell: true })
      : await runLimited(record.harness, args, options);
  } finally { closeSync(stdin); }
  writeFileSync(record.stream, r.stdout ?? '');
  writeFileSync(`${record.stream}.err`, r.stderr ?? '');
  record.exitCode = r.status;
  let result = null;
  try { result = record.harness === 'pi' ? piStreamResult(r.stdout ?? '') : claudeResult(r.stdout ?? ''); } catch { /* unparsable output */ }
  record.effective = result ? { models: result.models, source: 'print-stream' } : null;
  const outcome = batchOutcome(r, result);
  if (outcome.status === 'completed') writeFileSync(record.output, result.finalText + '\n');
  Object.assign(record, outcome, { finishedAt: now() });
  writeRecord(file, record);
  console.log(`${record.status}${record.failureReason ? ` (${record.failureReason})` : ''}: ${record.runId} (exit ${r.status})`);
}

/** A batch run still marked running after its limit plus a grace period has lost its exec process. */
export function batchStale(record, at = Date.now(), graceMs = 60_000) {
  if (record.mode !== 'batch' || !['launched', 'running'].includes(record.status)) return false;
  return at > Date.parse(record.startedAt) + (record.timeoutMs ?? DEFAULTS.timeoutMs) + graceMs;
}

function inspect([file, ...rest]) {
  need(file && isAbsolute(file), 'inspect needs the absolute record path');
  let expect = null;
  if (rest.length) { need(rest[0] === '--expect-model' && rest[1] && rest.length === 2, 'usage: inspect R [--expect-model PROVIDER/MODEL]'); expect = rest[1]; }
  const record = readRecord(file);
  if (record.mode === 'interactive') {
    const r = run('herdr', ['agent', 'get', record.agentName]);
    let agent = null; try { agent = JSON.parse(r.stdout).result?.agent ?? null; } catch { /* server down */ }
    record.live = agent ? { status: agent.agent_status, paneId: agent.pane_id, terminalId: agent.terminal_id } : { status: 'not-found' };
    if (agent && agent.terminal_id !== record.terminalId) record.live.warning = 'terminal changed since launch; this is not the launched session';
    record.sessionFile = agent?.agent_session?.value ?? record.sessionFile;
    if (record.sessionFile && existsSync(record.sessionFile)) {
      const text = readFileSync(record.sessionFile, 'utf8');
      const models = record.harness === 'pi' ? [piSessionModel(text)].filter(Boolean).map(m => `${m.provider}/${m.model}`) : claudeSessionModels(text);
      record.effective = { models, source: 'session-file' };
    }
    writeRecord(file, record);
  } else if (batchStale(record)) {
    // Printed only: the record is left for `exec` to own, in case it is merely slow to write.
    record.live = { status: 'stale', warning: 'still running past its time limit: its exec process was probably lost (server restart?). Treat the run as failed and relaunch under a new name.' };
  }
  console.log(JSON.stringify(record, null, 2));
  if (expect) {
    const models = record.effective?.models ?? [];
    need(models.length > 0, 'effective model unknown: independence is unverified');
    need(models.every(m => m === expect), `effective model ${models.join(', ')} differs from expected ${expect}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [command, ...args] = process.argv.slice(2);
    if (command === 'launch') await launch(args);
    else if (command === 'exec') await exec(args);
    else if (command === 'inspect') inspect(args);
    else throw new Error('usage: herdr-delegate.mjs launch ... | exec RECORD | inspect RECORD [--expect-model P/M]');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
