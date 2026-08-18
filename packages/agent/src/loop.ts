/**
 * Loop principal do agente — re-exporta o runLlmLoop real.
 *
 * Mantido como entrypoint estável (Agent.handle() chama daqui).
 * A implementação real está em ./llm/loop.ts.
 *
 * Sprint 1.8: usa o provider do agent.config (mutável pela UI), não do env.
 */

import type { Agent } from "./agent.js";
import type { AgentEvent } from "./types.js";
import { runLlmLoop } from "./llm/index.js";

export async function* runAgentLoop(
  agent: Agent,
  userMessage: string,
  options: {
    initialMessages?: { role: "user" | "assistant"; content: string }[];
  } = {}
): AsyncIterable<AgentEvent> {
  yield* runLlmLoop(agent, userMessage, {
    provider: agent.config.provider,
    initialMessages: options.initialMessages,
  });
}
