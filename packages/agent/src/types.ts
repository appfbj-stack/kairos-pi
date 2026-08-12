/**
 * Tipos públicos do agente Kairós.
 */

import type { Model } from "@earendil-works/pi-ai";

export interface AgentConfig {
  /** Modelo LLM padrão (Anthropic, OpenAI, OpenRouter, MiniMax). */
  model: Model<any>;
  /** Diretório onde fica o SQLite (`kairos.db`) e arquivos de sessão. */
  workspaceDir: string;
  /** Lista de extensões habilitadas. */
  enabledExtensions: string[];
  /** Locale da UI (default: `pt-BR`). */
  locale?: string;
}

export type AgentEvent =
  | { type: "message"; content: string }
  | { type: "tool:call"; tool: string; input: unknown }
  | { type: "tool:result"; tool: string; output: unknown; durationMs: number }
  | { type: "progress"; step: string; percent?: number }
  | { type: "permission:request"; tool: string; input: unknown; prompt: string }
  | { type: "done"; reason: "stop" | "error" | "aborted" }
  | { type: "error"; message: string };
