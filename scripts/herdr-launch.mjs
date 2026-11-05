#!/usr/bin/env node
// Optional launcher: start one Pi session per ticket inside Herdr TUI, so each session stays
// alive after you close the terminal and several can run side by side (D18).
//
// Nothing in this package depends on it. Skills stay harness-agnostic; in-session delegation
// is still `pi-subagents` (D10/D16). This only automates "open a fresh Pi session and type
// `/skill:<name> <ticket>`".
//
// Usage:
//   node scripts/herdr-launch.mjs [options] <ticket.md> [<ticket.md> ...]
//
// Options:
//   --skill <name>     skill to invoke (default: implement) -> "/skill:<name> <ticket>"
//   --session <name>   Herdr named session (default: $HERDR_SESSION, else Herdr's default)
//   --worktree         one Git worktree + branch per ticket (required for more than one ticket)
//   --base <ref>       base ref for --worktree branches (default: HEAD)
//   --timeout <ms>     wait for Pi to be ready (default: 60000)
//   --dry-run          print the herdr commands instead of running them
//   -h, --help
//
// Verified against herdr 0.9.5 and pi 1.4.0 on Windows (see docs/NOTES.md, D18).

import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

const USAGE = `Usage: node scripts/herdr-launch.mjs [--skill <name>] [--session <name>] [--worktree [--base <ref>]]
                                    [--timeout <ms>] [--dry-run] <ticket.md> [<ticket.md> ...]`;

function die(msg, code = 1) {
  console.error(`herdr-launch: ${msg}`);
  process.exit(code);
}

function parseArgs(argv) {
  const opts = { skill: "implement", session: process.env.HERDR_SESSION || "", worktree: false,
    base: "HEAD", timeout: 60000, dryRun: false, tickets: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      if (i + 1 >= argv.length) die(`${a} needs a value\n${USAGE}`);
      return argv[++i];
    };
    switch (a) {
      case "-h": case "--help": console.log(USAGE); process.exit(0);
      case "--skill": opts.skill = value(); break;
      case "--session": opts.session = value(); break;
      case "--worktree": opts.worktree = true; break;
      case "--base": opts.base = value(); break;
      case "--timeout": opts.timeout = Number(value()); break;
      case "--dry-run": opts.dryRun = true; break;
      default:
        if (a.startsWith("-")) die(`unknown option ${a}\n${USAGE}`);
        opts.tickets.push(a);
    }
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(opts.skill)) die(`invalid skill name "${opts.skill}"`);
  if (opts.session && !/^[A-Za-z0-9._-]+$/.test(opts.session)) die(`invalid session name "${opts.session}"`);
  if (!Number.isInteger(opts.timeout) || opts.timeout <= 3000 || opts.timeout > 300000) {
    die("--timeout must be an integer in (3000, 300000]");
  }
  if (opts.tickets.length === 0) die(`no ticket given\n${USAGE}`);
  if (opts.tickets.length > 1 && !opts.worktree) {
    die("more than one ticket needs --worktree: parallel sessions in one checkout would edit and commit over each other.");
  }
  return opts;
}

function run(cmd, args, { allowFail = false } = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", env: process.env });
  if (r.error) {
    if (r.error.code === "ENOENT") die(`\`${cmd}\` not found on PATH.`);
    die(`${cmd}: ${r.error.message}`);
  }
  if (r.status !== 0 && !allowFail) {
    die(`\`${cmd} ${args.join(" ")}\` failed (exit ${r.status}):\n${(r.stderr || r.stdout).trim()}`);
  }
  return r;
}

function herdrJson(args) {
  const out = run("herdr", args).stdout.trim();
  let parsed;
  try { parsed = JSON.parse(out); } catch { die(`unexpected herdr output for \`${args.join(" ")}\`:\n${out}`); }
  if (parsed.error) die(`herdr ${args.slice(0, 2).join(" ")}: ${parsed.error.code}: ${parsed.error.message}`);
  return parsed.result;
}

const quote = (s) => (/^[A-Za-z0-9_./:=@-]+$/.test(s) ? s : `"${s.replace(/(["\\$`])/g, "\\$1")}"`);

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.session) process.env.HERDR_SESSION = opts.session;

  const root = run("git", ["rev-parse", "--show-toplevel"]).stdout.trim();

  const tickets = opts.tickets.map((t) => {
    const abs = path.resolve(t);
    if (!existsSync(abs) || !statSync(abs).isFile()) die(`ticket not found: ${t}`);
    const rel = path.relative(root, abs);
    if (rel.startsWith("..") || path.isAbsolute(rel)) die(`ticket is outside the repository: ${t}`);
    const relPosix = rel.split(path.sep).join("/");
    const slug = path.basename(abs, path.extname(abs)).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    const feature = path.basename(path.dirname(path.dirname(abs))).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    // Herdr agent names: start with a lowercase letter, then [a-z0-9_-], 1-32 characters.
    const agent = `t-${slug || "ticket"}`.slice(0, 32).replace(/-+$/, "");
    return { rel: relPosix, slug: slug || "ticket", feature, agent };
  });

  const names = tickets.map((t) => t.agent);
  if (new Set(names).size !== names.length) die("two tickets share a file name; pass them in separate runs.");

  if (opts.worktree) {
    // A worktree only sees committed files, so the ticket must be committed as-is.
    for (const t of tickets) {
      if (run("git", ["-C", root, "ls-files", "--error-unmatch", "--", t.rel], { allowFail: true }).status !== 0) {
        die(`--worktree: ${t.rel} is not tracked by git; commit it first so the worktree contains it.`);
      }
      if (run("git", ["-C", root, "status", "--porcelain", "--", t.rel]).stdout.trim()) {
        die(`--worktree: ${t.rel} has uncommitted changes; commit them first so the worktree sees them.`);
      }
    }
  }

  const plan = tickets.map((t) => {
    const create = opts.worktree
      ? ["worktree", "create", "--cwd", root, "--branch", `ticket/${t.feature}-${t.slug}`, "--base", opts.base,
          "--label", t.slug, "--no-focus"]
      : ["workspace", "create", "--cwd", root, "--label", t.slug, "--no-focus"];
    return { ...t, branch: `ticket/${t.feature}-${t.slug}`, create, prompt: `/skill:${opts.skill} ${t.rel}` };
  });

  if (opts.worktree) {
    // A project-scope install (`pi install -l`) lives in the untracked .pi/npm tree, which a fresh
    // worktree does not get, so its sessions would not find the skills.
    if (existsSync(path.join(root, ".pi", "npm")) &&
        run("git", ["-C", root, "ls-files", "--", ".pi/npm"]).stdout.trim() === "") {
      console.warn("herdr-launch: warning: this repo has a project-scope Pi install (.pi/npm), which worktrees do not get.\n" +
        "  Sessions in the worktrees will not find this package's skills. Install it at user scope instead:\n" +
        "  pi install <source>   (without -l)");
    }
    for (const p of plan) {
      if (run("git", ["-C", root, "rev-parse", "--verify", "--quiet", `refs/heads/${p.branch}`], { allowFail: true }).status === 0) {
        die(`--worktree: branch ${p.branch} already exists; merge or delete it first.`);
      }
    }
  }

  const sessionFlag = opts.session ? `HERDR_SESSION=${opts.session} ` : "";
  if (opts.dryRun) {
    for (const p of plan) {
      console.log(`# ${p.rel}`);
      console.log(`${sessionFlag}herdr ${p.create.map(quote).join(" ")}   # -> .result.root_pane.pane_id`);
      console.log(`${sessionFlag}herdr agent start ${p.agent} --kind pi --pane <pane_id> --timeout ${opts.timeout}`);
      console.log(`${sessionFlag}herdr agent prompt ${p.agent} ${quote(p.prompt)}\n`);
    }
    return;
  }

  run("herdr", ["--version"]);
  const status = run("herdr", ["status", "server"], { allowFail: true }).stdout;
  if (!/status:\s*running/.test(status)) {
    const attach = opts.session ? `herdr --session ${opts.session}` : "herdr";
    die(`the Herdr server is not running${opts.session ? ` for session "${opts.session}"` : ""}.\n` +
      `Start it in another terminal with \`${attach}\` (detach with ctrl+b q), then rerun.`);
  }

  const integ = run("herdr", ["integration", "status"], { allowFail: true }).stdout;
  if (!/^pi:\s*current/m.test(integ)) {
    console.warn("herdr-launch: warning: the Pi integration is not current; sessions will not resume after a server restart.\n" +
      "  Fix: herdr integration install pi");
  }

  // Check every name before creating anything, so a clash leaves no orphan workspace or worktree.
  for (const p of plan) {
    const r = run("herdr", ["agent", "get", p.agent], { allowFail: true });
    if (!/agent_not_found/.test(r.stdout + r.stderr)) {
      die(`a Herdr agent named ${p.agent} already exists in this session; finish or close it first.`);
    }
  }

  for (const p of plan) {
    const created = herdrJson(p.create);
    const pane = created?.root_pane?.pane_id;
    if (!pane) die(`could not read the new pane id for ${p.rel}`);
    herdrJson(["agent", "start", p.agent, "--kind", "pi", "--pane", pane, "--timeout", String(opts.timeout)]);
    // No --wait: Pi may run local slash commands without ever entering a working state.
    herdrJson(["agent", "prompt", p.agent, p.prompt]);
    const where = opts.worktree ? created?.workspace?.worktree?.checkout_path ?? "(worktree)" : root;
    console.log(`started ${p.agent}  pane ${pane}  ${p.prompt}\n  cwd ${where}`);
  }

  console.log(`\nWatch:  ${sessionFlag}herdr agent list   |   ${sessionFlag}herdr agent attach <name>   |   ` +
    `${opts.session ? `herdr --session ${opts.session}` : "herdr"}`);
  if (opts.worktree) {
    console.log("Each ticket commits on its own ticket/* branch; merge them back yourself.");
  }
}

main();
