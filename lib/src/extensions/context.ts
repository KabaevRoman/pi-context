import type { Runtime } from 'pi-code-core/runtime/runtime';
export function registerContext(runtime: Runtime, includePrompt = true): void {
  runtime.pi.on('context', event => {
    if (!runtime.ready) return;
    const content = `Authoritative compatibility state:\n${JSON.stringify({ mode: runtime.state.mode, plan: runtime.state.plan, tasks: Object.values(runtime.state.tasks) })}`;
    return { messages: [...event.messages.filter(m => !(m.role === 'custom' && m.customType === 'claude-compat:workflow')), { role: 'custom' as const, customType: 'claude-compat:workflow', content, display: false, timestamp: 0 }] };
  });
  runtime.pi.on('session_before_compact', async (_event, ctx) => {
    const outcome = await runtime.hooks.run('PreCompact', {}, runtime.config, ctx.cwd, ctx.signal);
    if (outcome.deny) return { cancel: true };
    // Use pi's native compaction algorithm; structured state is restored independently.
    runtime.persist();
  });
  runtime.pi.on('session_compact', async (_event, ctx) => {
    await runtime.memory.load(ctx.cwd);
    await runtime.hooks.run('PostCompact', {}, runtime.config, ctx.cwd, ctx.signal);
  });
  if (includePrompt) runtime.pi.on('before_agent_start', async (_event, ctx) => {
    if (!runtime.ready) return;
    const workflow = { mode: runtime.state.mode, plan: runtime.state.plan, tasks: Object.values(runtime.state.tasks) };
    return {
      systemPrompt: runtime.prompts.system(ctx.model ? `${ctx.model.provider}/${ctx.model.id}` : 'unknown', ctx.cwd, [...runtime.tools], runtime.memory.format()),
      message: { customType: 'claude-compat:workflow', content: `Authoritative compatibility state:\n${JSON.stringify(workflow)}${runtime.state.mode === 'plan' ? '\nPlan mode is active. Do not mutate source files or run shell commands. Write only the designated plan artifact and request approval with ExitPlanMode.' : ''}`, display: false },
    };
  });
}
