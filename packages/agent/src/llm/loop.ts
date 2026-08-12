/**
 * Loop LLM real usando pi-ai.stream().
 *
 * Fluxo:
 *   1. Recebe Agent + userMessage
 *   2. Constrói Context (systemPrompt + messages + tools)
 *   3. Chama pi-ai.stream() — processa eventos
 *   4. Para cada ToolCall:
 *      a. Se dangerous, pede confirmação via Permissions (interface)
 *      b. Executa via ToolRegistry
 *      c. Envia ToolResultMessage de volta pro LLM
 *   5. Continua até stopReason ser "stop" | "length" | "aborted"
 *   6. Emite AgentEvent conforme o progresso
 *
 * Modelado no Pi Agent (https://pi.dev/docs/latest/sdk).
 */

import {
  type AssistantMessage,
  type AssistantMessageEvent,
  type Context,
  type Message,
  type Tool as PiTool,
  type ToolResultMessage,
  type UserMessage,
} from "@earendil-works/pi-ai";
import { stream } from "@earendil-works/pi-ai/compat";
import type { Agent } from "../agent.js";
import type { AgentEvent } from "../types.js";
import type { Tool as KairosTool } from "../tools/registry.js";
import { zodToTypebox } from "./zod-to-typebox.js";
import { buildModel, resolveApiKey, type ProviderConfig } from "./provider.js";

const MAX_TOOL_ITERATIONS = 25;

/** Loop principal — emite AgentEvent conforme o agente processa. */
export async function* runLlmLoop(
  agent: Agent,
  userMessage: string,
  options: {
    systemPrompt?: string;
    provider: ProviderConfig;
    initialMessages?: { role: "user" | "assistant"; content: string }[];
  } = {
    provider: { provider: "openrouter", modelId: "anthropic/claude-3.5-sonnet" },
  }
): AsyncIterable<AgentEvent> {
  const model = buildModel(options.provider);
  const apiKey = resolveApiKey(options.provider);

  // 1. Constrói tools no formato do pi-ai (typebox)
  const tools: PiTool[] = agent.tools.list().map(toKairosToolToPiTool);

  // 2. Carrega histórico (se houver) + mensagem do user
  const messages: Message[] = [];

  if (options.initialMessages && options.initialMessages.length > 0) {
    for (const m of options.initialMessages) {
      if (m.role === "user") {
        messages.push({
          role: "user",
          content: m.content,
          timestamp: Date.now(),
        });
      } else {
        // Mensagem assistant do histórico — constrói com campos obrigatórios vazios
        // (será ignorado pelo pi-ai, mas é necessário pra satisfazer o tipo discriminado)
        const stub: AssistantMessage = {
          role: "assistant",
          content: [{ type: "text", text: m.content }],
          api: "openai-completions", // placeholder
          provider: "openai",
          model: "history",
          usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
          stopReason: "stop",
          timestamp: Date.now(),
        };
        messages.push(stub);
      }
    }
  }

  const userMsg: UserMessage = {
    role: "user",
    content: userMessage,
    timestamp: Date.now(),
  };
  messages.push(userMsg);

  let iteration = 0;
  while (iteration++ < MAX_TOOL_ITERATIONS) {
    if (agent.permissions.isAborted()) {
      yield { type: "done", reason: "aborted" };
      return;
    }

    const context: Context = {
      systemPrompt:
        options.systemPrompt ??
        "Você é o Kairós, um agente de IA desktop. Responda em português do Brasil. Use as tools disponíveis para executar tarefas no computador do usuário. Sempre peça confirmação antes de ações destrutivas.",
      messages,
      tools: tools.length > 0 ? tools : undefined,
    };

    yield { type: "progress", step: "thinking", percent: 10 };

    // 3. Stream
    let lastMessage: AssistantMessage | undefined;
    try {
      for await (const event of stream(model, context, { apiKey })) {
        const result = yield* processStreamEvent(event, agent);
        if (result) lastMessage = result;
      }
    } catch (err) {
      yield { type: "error", message: err instanceof Error ? err.message : String(err) };
      yield { type: "done", reason: "error" };
      return;
    }

    if (!lastMessage) {
      yield { type: "error", message: "Stream não retornou mensagem final" };
      yield { type: "done", reason: "error" };
      return;
    }

    messages.push(lastMessage);

    // 4. Se for toolUse, executa as tools
    if (lastMessage.stopReason === "toolUse") {
      const toolCalls = lastMessage.content.filter(
        (c): c is Extract<typeof c, { type: "toolCall" }> => c.type === "toolCall"
      );

      for (const call of toolCalls) {
        if (agent.permissions.isAborted()) {
          yield { type: "done", reason: "aborted" };
          return;
        }

        const tool = agent.tools.get(call.name);
        if (!tool) {
          // Tool não encontrada — devolve erro
          const errResult: ToolResultMessage = {
            role: "toolResult",
            toolCallId: call.id,
            toolName: call.name,
            content: [{ type: "text", text: `Tool "${call.name}" não encontrada` }],
            isError: true,
            timestamp: Date.now(),
          };
          messages.push(errResult);
          yield {
            type: "tool:result",
            tool: call.name,
            output: "Tool não encontrada",
            durationMs: 0,
          };
          continue;
        }

        yield { type: "tool:call", tool: call.name, input: call.arguments };

        // Confirmação destrutiva (PRD §16, §28)
        if (tool.dangerous) {
          yield {
            type: "permission:request",
            tool: call.name,
            input: call.arguments,
            prompt: `A tool "${call.name}" é destrutiva. Deseja continuar?`,
          };
          const ok = await agent.permissions.confirm(
            `Executar ${call.name}?`
          );
          if (!ok) {
            const cancelResult: ToolResultMessage = {
              role: "toolResult",
              toolCallId: call.id,
              toolName: call.name,
              content: [{ type: "text", text: "Cancelado pelo usuário" }],
              isError: true,
              timestamp: Date.now(),
            };
            messages.push(cancelResult);
            yield {
              type: "tool:result",
              tool: call.name,
              output: "Cancelado pelo usuário",
              durationMs: 0,
            };
            continue;
          }
        }

        // Executa
        const start = Date.now();
        try {
          const parsed = tool.inputSchema.parse(call.arguments);
          const result = await tool.execute(parsed, {
            agentId: agent.id,
            sessionId: agent.id,
            cwd: agent.config.workspaceDir,
            abortSignal: new AbortController().signal,
            confirmDangerous: async (p) => agent.permissions.confirm(p),
          });
          const dur = Date.now() - start;

          const resultMsg: ToolResultMessage = {
            role: "toolResult",
            toolCallId: call.id,
            toolName: call.name,
            content: [{ type: "text", text: JSON.stringify(result) }],
            isError: false,
            timestamp: Date.now(),
          };
          messages.push(resultMsg);
          yield {
            type: "tool:result",
            tool: call.name,
            output: result,
            durationMs: dur,
          };
        } catch (err) {
          const dur = Date.now() - start;
          const errMsg: ToolResultMessage = {
            role: "toolResult",
            toolCallId: call.id,
            toolName: call.name,
            content: [
              {
                type: "text",
                text: `Erro: ${err instanceof Error ? err.message : String(err)}`,
              },
            ],
            isError: true,
            timestamp: Date.now(),
          };
          messages.push(errMsg);
          yield {
            type: "tool:result",
            tool: call.name,
            output: `Erro: ${err instanceof Error ? err.message : String(err)}`,
            durationMs: dur,
          };
        }
      }
      // Continua o loop com as tool results no context
      continue;
    }

    // 5. Stop final
    if (lastMessage.stopReason === "aborted") {
      yield { type: "done", reason: "aborted" };
      return;
    }
    if (lastMessage.stopReason === "error") {
      yield { type: "error", message: lastMessage.errorMessage ?? "Erro desconhecido" };
      yield { type: "done", reason: "error" };
      return;
    }
    // stop | length
    yield { type: "done", reason: "stop" };
    return;
  }

  yield { type: "error", message: `Loop excedeu ${MAX_TOOL_ITERATIONS} iterações` };
  yield { type: "done", reason: "error" };
}

/** Processa um evento do stream e emite AgentEvents. Retorna a mensagem final quando aplicável. */
async function* processStreamEvent(
  event: AssistantMessageEvent,
  _agent: Agent
): AsyncGenerator<AgentEvent, AssistantMessage | undefined, void> {
  switch (event.type) {
    case "start":
    case "text_start":
    case "text_end":
    case "thinking_start":
    case "thinking_end":
    case "toolcall_start":
    case "toolcall_end":
      return undefined;

    case "text_delta":
      yield { type: "message", content: event.delta };
      return undefined;

    case "thinking_delta":
      // Thinking não emite (interno). Sprint 2 pode expor opcionalmente.
      return undefined;

    case "toolcall_delta":
      // Acumula internamente — visível apenas no toolcall_end.
      return undefined;

    case "done": {
      // Texto final do assistant
      const text = event.message.content
        .filter((c) => c.type === "text")
        .map((c) => (c as { type: "text"; text: string }).text)
        .join("");
      if (text) yield { type: "message", content: text };
      return event.message;
    }

    case "error":
      yield {
        type: "error",
        message: event.error.errorMessage ?? "Erro no stream",
      };
      return event.error;
  }
}

/** Converte Tool Kairos (Zod) → Tool pi-ai (typebox). */
function toKairosToolToPiTool(tool: KairosTool): PiTool {
  // Cast seguro: a Tool tem inputSchema: ZodType. O pi-ai Tool quer parameters: TSchema.
  return {
    name: tool.name,
    description: tool.description,
    parameters: zodToTypebox(tool.inputSchema) as never,
  };
}
