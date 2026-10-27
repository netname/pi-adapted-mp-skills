import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const source = join(dirname(fileURLToPath(import.meta.url)), '../skills/misc/git-guardrails/scripts/block-dangerous-git.sh');
export function readDefaultPatterns() {
  const array = /DANGEROUS_PATTERNS=\(([\s\S]*?)\n\)/.exec(readFileSync(source, 'utf8'));
  if (!array) throw new Error('Cannot read default Git guardrail patterns');
  const patterns = [...array[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(match => match[1]);
  if (!patterns.length) throw new Error('Default Git guardrail patterns are empty');
  return patterns;
}
const disabled = { enabled: false, patterns: [] };
export function readConfig(cwd, defaults, home = homedir()) {
  const project = join(cwd, '.pi/git-guardrails.json');
  const path = existsSync(project) ? project : join(home, '.pi/agent/git-guardrails.json');
  let raw;
  try { raw = JSON.parse(readFileSync(path, 'utf8')); } catch { return disabled; }
  if (!raw || raw.enabled !== true) return disabled;
  if (raw.patterns !== undefined && (!Array.isArray(raw.patterns) || raw.patterns.some(p => typeof p !== 'string' || !p))) return { enabled: true, error: 'patterns must be an array of nonempty regex strings' };
  return { enabled: true, patterns: raw.patterns ?? defaults };
}

// Recognize common literal Git global options. This is not a shell parser:
// aliases, variables, executable wrappers and dynamically built commands are outside its scope.
export function normalizeGitOptions(command) {
  const value = String.raw`(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\s;&|]+)`;
  const valued = String.raw`(?:-C|-c|--git-dir|--work-tree|--namespace|--config-env)(?:[ \t]+|=)${value}`;
  const flag = String.raw`--(?:no-pager|paginate|bare|no-replace-objects|literal-pathspecs|glob-pathspecs|noglob-pathspecs|icase-pathspecs)`;
  const prefix = new RegExp(String.raw`\bgit(?:\.exe)?(?:[ \t]+(?:${valued}|${flag}))*[ \t]+`, 'g');
  return command.replace(prefix, 'git ');
}
export function blockedReason(command, config) {
  if (!config.enabled) return undefined;
  if (config.error) return `Git guardrail configuration error: ${config.error}`;
  let matchers;
  try { matchers = config.patterns.map(pattern => [pattern, new RegExp(pattern)]); }
  catch { return 'Git guardrail configuration error: invalid regular expression'; }
  const normalized = normalizeGitOptions(command);
  for (const [pattern, matcher] of matchers) if (matcher.test(command) || matcher.test(normalized)) return `BLOCKED: command matches Git guardrail pattern '${pattern}'.`;
  return undefined;
}
export function createGuardrailHandler(defaults, home = homedir()) {
  return async (event, ctx) => {
    if (event.toolName !== 'bash') return undefined;
    const command = typeof event.input?.command === 'string' ? event.input.command : '';
    const reason = blockedReason(command, readConfig(ctx.cwd, defaults, home));
    if (!reason) return undefined;
    if (ctx.hasUI) ctx.ui.notify(reason, 'warning');
    return { block: true, reason };
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const reason = blockedReason(process.argv.slice(2).join(' '), { enabled: true, patterns: readDefaultPatterns() });
    if (reason) { console.error(reason); process.exitCode = 1; }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
