/** Opt-in command-pattern checks, not a shell sandbox. See the git-guardrails skill. */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createGuardrailHandler, readConfig, readDefaultPatterns } from "../lib/git-guardrails.mjs";

export default function (pi: ExtensionAPI) {
  if (process.env.PI_GIT_GUARDRAILS === "off") return;
  const defaults = readDefaultPatterns();
  pi.on("session_start", async (_event, ctx) => {
    const config = readConfig(ctx.cwd, defaults);
    if (config.enabled && ctx.hasUI) {
      ctx.ui.setStatus("git-guardrails", config.error ? "git guardrails: configuration error" : `git guardrails: ${config.patterns.length} pattern(s)`);
    }
  });
  pi.on("tool_call", createGuardrailHandler(defaults));
}
