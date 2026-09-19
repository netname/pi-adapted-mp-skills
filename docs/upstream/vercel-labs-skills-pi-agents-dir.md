# Draft upstream issue — `vercel-labs/skills`: Pi should use `.agents/skills`

Status: **draft, not filed.** Paste into `https://github.com/vercel-labs/skills/issues/new`
(or use it as the body of a PR against `src/agents.ts`).

Verified against `skills@1.7.0`. Related decision: **D17** in
[`../ADAPTATION_PLAN.md`](../ADAPTATION_PLAN.md).

---

## Title

`pi`: install skills to `.agents/skills` (universal), not `.pi/skills`

## Body

### What I'd like to change

In `src/agents.ts`:

```diff
 pi: {
   name: 'pi',
   displayName: 'Pi',
-  skillsDir: '.pi/skills',
+  skillsDir: '.agents/skills',
   globalSkillsDir: join(home, '.pi/agent/skills'),
   detectInstalled: async () => {
     return existsSync(join(home, '.pi/agent'));
   },
 },
```

### Why

**1. Pi reads `.agents/skills` already.** Pi's documented skill load locations are
`~/.pi/agent/skills/`, `~/.agents/skills/`, `.pi/skills/`, and `.agents/skills/` (in `cwd` and
ancestor directories). Writing to `.pi/skills` puts Pi's skills in a Pi-only directory, while the
path that every other client can see sits unused.

**2. Every sibling entry in this registry uses `.agents/skills`.** Codex, Cursor, Cline, Gemini
CLI, GitHub Copilot, OpenCode, Amp, Kimi Code CLI, Warp, Zed and Droid all declare
`skillsDir: '.agents/skills'`. Pi is a universal agent in practice but not in this table.

**3. That is the point of the convention.** One install should be visible to every compliant
client. As written, `npx skills add <repo> -a pi` produces something no other agent can see.

### Evidence

Patched a local copy of `skills@1.7.0` with the diff above, then ran it against a repo
containing 26 skills:

```bash
npx skills add <repo> -a pi -y --full-depth          # project scope, copy mode
npx skills add <repo> -a pi -y -g --full-depth       # user scope
```

| Scenario | Before | After |
| --- | --- | --- |
| `-a pi` (project) | `<proj>/.pi/skills/` — 26 dirs | `<proj>/.agents/skills/` — 26 dirs; no `.pi/` created |
| `-a pi -g` (user) | `~/.pi/agent/skills/` | `~/.agents/skills/` — 26 dirs; `~/.pi/agent/skills/` empty |

Note that a single-target `-a pi` install runs in **copy** mode (`uniqueDirs.size <= 1`), so after
this change the files are copied straight into `.agents/skills` — no symlink step is involved.

### Side effect I want to flag before you find it

`isUniversalAgent()` is derived from `skillsDir === '.agents/skills'`, so this one line also
reclassifies Pi as a **universal** agent. The consequence is that *global* installs move to the
canonical `~/.agents/skills/` and no longer write the declared `globalSkillsDir`
(`~/.pi/agent/skills/`). That is fine for Pi — `~/.agents/skills` is one of Pi's documented load
locations — but it is a behaviour change beyond the project-scope fix, and it interacts with the
known issues in this area:

- #1060 — universal classification keys off the project-level `skillsDir`
- #1372 / #1873 — global universal installs write only to canonical, skipping the declared
  `globalSkillsDir`

Pi is unusually safe here: its canonical user directory (`~/.agents/skills`) is the same path Pi
scans, so those bugs do not misplace Pi's skills. If you'd rather keep the global behaviour
untouched, the alternative is to keep `skillsDir: '.pi/skills'` and have the installer support a
second, shared project directory per agent — but that needs a schema change, so I've proposed the
one-liner.

`globalSkillsDir` still matters after the change: `supportsGlobal` reads it to decide whether the
"Installation scope" prompt is offered. It should stay non-undefined for Pi.

### Non-goals

- `detectInstalled` is correct as-is; `~/.pi/agent` is the right install marker.
- Nothing in the Pi harness needs to change.
- I'm not proposing a second skills directory, symlink management, or scope changes.

### Happy to

Open this as a PR with the one-line change plus a test if there's an existing fixture for agent
table assertions — just point me at where the agent registry is tested.
