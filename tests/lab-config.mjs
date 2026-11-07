// Shared test fixture (not a test file).
// The quotation lab's rows from docs/BEGINNER-VALIDATION.md, step 5.
export const labConfig = () => ({
  schemaVersion: 1,
  herdrSession: 'quote-lab',
  evidenceDir: '/home/netname/code/quote-workflow-lab-01/.scratch/quote-demo/runs',
  limits: { implementationWorkers: 2, researchWorkers: 3, repairAttempts: 2, batchTimeoutMs: 1_800_000 },
  worktreeSetup: 'npm ci',
  families: { Claude: '^anthropic/', DeepSeek: '^deepseek/' },
  roles: {
    planning: { harness: 'claude', mode: 'coordinator', model: 'anthropic/claude-opus-5-5', family: 'Claude' },
    implementation: { harness: 'pi', mode: 'interactive', model: 'deepseek/deepseek-flash', family: 'DeepSeek' },
    'design-comprehension': { harness: 'pi', mode: 'batch', tools: 'read-only', model: 'deepseek/deepseek-flash', family: 'DeepSeek' },
    'design-challenge': { harness: 'pi', mode: 'batch', tools: 'read-only', model: 'deepseek/deepseek-flash', family: 'DeepSeek' },
    'spec-review': { harness: 'claude', mode: 'batch', tools: 'read-only', model: 'anthropic/claude-sonnet-5-5', family: 'Claude', timeoutMs: 600_000 },
    'standards-review': { harness: 'claude', mode: 'batch', tools: 'read-only', model: 'anthropic/claude-sonnet-5-5', family: 'Claude' },
    research: { unavailable: 'not exercised in the first run' },
  },
});
