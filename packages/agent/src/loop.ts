/**
 * Loop principal do agente — re-exporta o runLlmLoop real.
 *
 * Mantido como entrypoint estável (Agent.handle() chama daqui).
 * A implementação real está em ./llm/loop.ts.
 *
 * Casa com o loop do Pi Agent (https://pi.dev/docs/latest/sdk).
 */

import type { Agent } from "./agent.js";
import type { AgentEvent } from "./types.js";
import { runLlmLoop, readProviderConfigFromEnv } from "./llm/index.js";

export async function* runAgentLoop(
  agent: Agent,
  userMessage: string
): AsyncIterable<AgentEvent> {
  // Lê config do env. Sprint 1+: ler de settings persistido no SQLite.
  const provider = readProviderConfigFromEnv();

  yield* runLlmLoop(agent, userMessage, { provider });
}
