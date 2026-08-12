/**
 * Loop principal do agente.
 *
 * Modelado no Pi Agent loop:
 *   user message → plan → tool call → tool result → ... → done
 *
 * A implementação real (Sprint 1) vai usar `complete()` de `@earendil-works/pi-ai`
 * com streaming, parsear tool calls, executar via ToolRegistry e devolver AgentEvent.
 */

import type { Agent } from "./agent.js";
import type { AgentEvent } from "./types.js";

export async function* runAgentLoop(
  _agent: Agent,
  _userMessage: string
): AsyncIterable<AgentEvent> {
  // Stub para Sprint 0 — retorna só um done.
  // Sprint 1 substitui pelo loop real com LLM streaming + tool execution.
  yield { type: "done", reason: "stop" };
}
