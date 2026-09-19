/**
 * inspect.ts — M6 smoke-test probe (Pi-context snapshot).
 *
 * This is a **test probe**, not package content: `scripts/smoke-test.sh` loads it
 * with `pi -e` and it writes a JSON snapshot of everything the smoke test needs to
 * assert. Nothing in this file ships in the package.
 *
 * It reports facts only — no pass/fail logic lives here. The assertions are in
 * `scripts/probes/check.mjs`, which runs offline against the snapshot so the same
 * facts can be checked on the pinned install, the floating install, and the
 * collision fixture without re-running Pi.
 *
 * Facts captured, per `before_agent_start` (so `/skill:<name>` expansion is visible
 * in `prompt`, which is the authoritative surface for D3):
 *   - `prompt`            the prompt Pi actually built for the turn
 *   - `commands`          `pi.getCommands()` (skill commands with `sourceInfo` provenance)
 *   - `tools`             `pi.getAllTools()` (name + `sourceInfo.source`/`path`)
 *   - `skillOptions`      `systemPromptOptions.skills` (all registered skills)
 *   - `visibleSkills`     names parsed out of the **rendered** `<available_skills>` block
 *                         (never `systemPromptOptions.skills`, which also lists
 *                         user-invoked skills — the M3 finding)
 *   - `diskSkills`        on-disk scan of project/user skill dirs plus every package
 *                         root the settings files resolve to, with each `SKILL.md`'s
 *                         declared `name` and path
 *   - `settings`          the raw settings files, so the driver can assert the
 *                         `pi install <path>` entry shape
 *
 * Usage: M6_PROBE_OUT=<file> pi -p -a --no-session -e scripts/probes/inspect.ts "<prompt>"
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const OUT = process.env.M6_PROBE_OUT;
const LABEL = process.env.M6_PROBE_LABEL ?? "";

function readJson(path: string): Record<string, unknown> | undefined {
	try {
		const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
	} catch {
		// Missing or malformed: the driver reports the absence, the probe does not fail.
	}
	return undefined;
}

/** Frontmatter `name` from a SKILL.md, without a YAML dependency. */
function frontmatterName(text: string): string | null {
	const lines = text.split(/\r?\n/);
	if ((lines[0] ?? "").trim() !== "---") return null;
	for (let i = 1; i < lines.length; i += 1) {
		if (lines[i].trim() === "---") break;
		const match = /^name:\s*(.+?)\s*$/.exec(lines[i]);
		if (match) return match[1].replace(/^["']|["']$/g, "");
	}
	return null;
}

/** Every `SKILL.md` under `dir`, as `{ name, path, root }`. */
function scanSkillDir(dir: string, root: string, out: Array<{ name: string; path: string; root: string }>): void {
	if (!existsSync(dir)) return;
	let entries: ReturnType<typeof readdirSync>;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of entries) {
		const abs = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
			scanSkillDir(abs, root, out);
		} else if (entry.isFile() && entry.name === "SKILL.md") {
			const name = frontmatterName(readFileSync(abs, "utf8"));
			if (name) out.push({ name, path: abs.split("\\").join("/"), root: root.split("\\").join("/") });
		}
	}
}

/**
 * Resolve a settings package source to a package root on disk, mirroring Pi's
 * documented install roots (`packages.md`). Returns null when the source is a
 * shape this probe does not resolve — reported as unattributed rather than guessed.
 */
function resolvePackageRoot(source: string, settingsDir: string, scope: "user" | "project"): string | null {
	try {
		if (source.startsWith("npm:")) {
			const spec = source.slice(4);
			const name = spec.startsWith("@") ? spec.split("@").slice(0, 2).join("@") : spec.split("@")[0];
			const base = scope === "project" ? join(settingsDir, "npm", "node_modules") : join(homedir(), ".pi", "agent", "npm", "node_modules");
			const root = join(base, name);
			return existsSync(root) ? resolve(root) : null;
		}
		if (/^(git:|https?:|ssh:|git@)/.test(source)) return null; // git clones: not resolved by this probe.
		if (source.startsWith(".") || source.startsWith("/") || /^[A-Za-z]:[\\/]/.test(source)) {
			const root = resolve(settingsDir, source);
			return existsSync(root) ? root : null;
		}
	} catch {
		return null;
	}
	return null;
}

function diskSkills(cwd: string): {
	definitions: Array<{ name: string; path: string; root: string }>;
	unresolvedSources: string[];
	settings: { project: unknown; user: unknown };
} {
	const definitions: Array<{ name: string; path: string; root: string }> = [];
	const unresolvedSources: string[] = [];

	// Project + user skill directories Pi documents (skills.md §Locations).
	scanSkillDir(join(cwd, ".pi", "skills"), ".pi/skills", definitions);
	scanSkillDir(join(cwd, ".agents", "skills"), ".agents/skills", definitions);
	scanSkillDir(join(homedir(), ".pi", "agent", "skills"), "~/.pi/agent/skills", definitions);
	scanSkillDir(join(homedir(), ".agents", "skills"), "~/.agents/skills", definitions);

	const projectPath = join(cwd, ".pi", "settings.json");
	const userPath = join(homedir(), ".pi", "agent", "settings.json");
	const project = readJson(projectPath);
	const user = readJson(userPath);

	for (const [settings, settingsDir, scope] of [
		[project, join(cwd, ".pi"), "project"],
		[user, join(homedir(), ".pi", "agent"), "user"],
	] as const) {
		for (const source of (settings?.packages as unknown[]) ?? []) {
			const spec = typeof source === "string" ? source : typeof (source as Record<string, unknown>)?.source === "string" ? ((source as Record<string, unknown>).source as string) : null;
			if (!spec) continue;
			const root = resolvePackageRoot(spec, settingsDir, scope);
			if (!root) {
				unresolvedSources.push(spec);
				continue;
			}
			scanSkillDir(join(root, "skills"), `${scope}:${spec}`, definitions);
		}
		// Settings `skills` array entries resolve relative to the settings file.
		for (const entry of (settings?.skills as unknown[]) ?? []) {
			if (typeof entry !== "string") continue;
			const root = resolve(settingsDir, entry);
			if (existsSync(root)) scanSkillDir(root, `settings:${entry}`, definitions);
		}
	}

	return { definitions, unresolvedSources, settings: { project, user } };
}

/** Names inside the rendered `<available_skills>` block. */
function parseVisibleSkills(systemPrompt: string): string[] {
	const block = /<available_skills>([\s\S]*?)<\/available_skills>/.exec(systemPrompt);
	if (!block) return [];
	return [...block[1].matchAll(/<name>([\s\S]*?)<\/name>/g)].map((m) => m[1].trim());
}

function skillOptionNames(options: unknown): string[] {
	const skills = (options as { skills?: unknown } | undefined)?.skills;
	if (!Array.isArray(skills)) return [];
	return skills
		.map((s) => (typeof s === "string" ? s : (s as { name?: string })?.name))
		.filter((n): n is string => typeof n === "string");
}

export default function (pi: ExtensionAPI) {
	pi.on("before_agent_start", async (event, ctx) => {
		if (!OUT) return;
		const options = event.systemPromptOptions as { cwd?: string } | undefined;
		const cwd = options?.cwd ?? ctx.cwd;
		const disk = diskSkills(cwd);
		const snapshot = {
			label: LABEL,
			probeOut: OUT,
			cwd: cwd.split("\\").join("/"),
			prompt: event.prompt,
			systemPromptLength: event.systemPrompt?.length ?? 0,
			visibleSkills: parseVisibleSkills(event.systemPrompt ?? ""),
			skillOptions: skillOptionNames(event.systemPromptOptions),
			commands: pi.getCommands().map((command) => ({
				name: command.name,
				source: command.source,
				path: command.sourceInfo?.path?.split("\\").join("/") ?? null,
				origin: command.sourceInfo?.origin ?? null,
				scope: command.sourceInfo?.scope ?? null,
			})),
			tools: pi.getAllTools().map((tool) => ({
				name: tool.name,
				source: tool.sourceInfo?.source ?? null,
				path: tool.sourceInfo?.path?.split("\\").join("/") ?? null,
			})),
			unresolvedSources: disk.unresolvedSources,
			settings: disk.settings,
			diskSkills: disk.definitions,
		};
		try {
			writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
		} catch {
			// The driver reports a missing snapshot.
		}
	});
}
