/**
 * Git Guardrails Extension
 *
 * Blocks dangerous git commands before they execute, mirroring the pattern list
 * that ships with the `git-guardrails` skill. The upstream hook mechanism was
 * replaced by the frozen D5-20 substitution: a `pi.on("tool_call", …)` handler
 * returning `{ block: true, reason }`.
 *
 * The extension ships with the package but is **inert until the user opts in**,
 * so installing this package never changes anyone's git behaviour by surprise.
 * Opt in by creating one of:
 *
 *   <repo>/.pi/git-guardrails.json          (this project only)
 *   ~/.pi/agent/git-guardrails.json         (all projects)
 *
 * with `{ "enabled": true }`. Add `"patterns": ["…"]` to replace the default
 * pattern list. Set `PI_GIT_GUARDRAILS=off` to disable even when opted in.
 *
 * The default pattern list lives in
 * `skills/misc/git-guardrails/scripts/block-dangerous-git.sh` and is read from
 * there at load time, so the script and the extension cannot drift.
 */

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const HERE = dirname(fileURLToPath(import.meta.url));
const PATTERN_SOURCE = join(
	HERE,
	"..",
	"skills",
	"misc",
	"git-guardrails",
	"scripts",
	"block-dangerous-git.sh",
);

/** Used only when the pattern source cannot be read. Mirrors the sidecar. */
const FALLBACK_PATTERNS = ["git push", "git reset --hard", "git clean -fd", "git clean -f", "git branch -D", "git checkout \\.", "git restore \\.", "push --force", "reset --hard"];

/** Read the `DANGEROUS_PATTERNS=( … )` array from the skill's sidecar script. */
function readDefaultPatterns(): string[] {
	try {
		const text = readFileSync(PATTERN_SOURCE, "utf8");
		const array = /DANGEROUS_PATTERNS=\(([\s\S]*?)\n\)/.exec(text);
		if (!array) return FALLBACK_PATTERNS;
		const patterns = [...array[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
		return patterns.length > 0 ? patterns : FALLBACK_PATTERNS;
	} catch {
		return FALLBACK_PATTERNS;
	}
}

type GuardrailConfig = { enabled: boolean; patterns: string[] };

const DISABLED: GuardrailConfig = { enabled: false, patterns: [] };

function readJson(path: string): Record<string, unknown> | undefined {
	try {
		const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
			return parsed as Record<string, unknown>;
		}
	} catch {
		// Missing or malformed file: treat as not opted in.
	}
	return undefined;
}

/**
 * Resolve the opt-in config for the current working directory. A project file
 * wins over a global one; a missing file, `enabled: false`, or a malformed file
 * all mean "not opted in".
 */
function readConfig(cwd: string, defaults: string[]): GuardrailConfig {
	const project = readJson(join(cwd, ".pi", "git-guardrails.json"));
	const global = readJson(join(homedir(), ".pi", "agent", "git-guardrails.json"));
	const raw = project ?? global;
	if (!raw || raw.enabled === false) return DISABLED;
	const custom = Array.isArray(raw.patterns) ? raw.patterns.filter((p): p is string => typeof p === "string" && p.length > 0) : [];
	return { enabled: true, patterns: custom.length > 0 ? custom : defaults };
}

export default function (pi: ExtensionAPI) {
	if (process.env.PI_GIT_GUARDRAILS === "off") return;

	const defaults = readDefaultPatterns();

	pi.on("session_start", async (_event, ctx) => {
		const config = readConfig(ctx.cwd, defaults);
		if (config.enabled && ctx.hasUI) {
			ctx.ui.setStatus("git-guardrails", `git guardrails: ${config.patterns.length} pattern(s)`);
		}
	});

	pi.on("tool_call", async (event, ctx) => {
		if (event.toolName !== "bash") return undefined;
		const config = readConfig(ctx.cwd, defaults);
		if (!config.enabled) return undefined;

		const command = typeof event.input.command === "string" ? event.input.command : "";
		for (const pattern of config.patterns) {
			let matcher: RegExp;
			try {
				matcher = new RegExp(pattern);
			} catch {
				continue; // A user-supplied pattern that is not a valid regex is skipped.
			}
			if (matcher.test(command)) {
				const reason = `BLOCKED: '${command}' matches dangerous pattern '${pattern}'. The user has prevented you from running this command.`;
				if (ctx.hasUI) ctx.ui.notify(reason, "warning");
				return { block: true, reason };
			}
		}
		return undefined;
	});
}
