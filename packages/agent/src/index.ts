/**
 * Kairós Desktop Alves — Agent entrypoint.
 *
 * Modelado no Pi Agent (`@earendil-works/pi-coding-agent`).
 * Este package é o núcleo: loop, tools, permissions, memory.
 * A UI (Electron) consome via IPC.
 */

export { Agent } from "./agent.js";
export type { AgentConfig, AgentEvent } from "./types.js";
export { runAgentLoop } from "./loop.js";
export { ToolRegistry } from "./tools/registry.js";
export type { Tool, ToolContext } from "./tools/registry.js";
export { Permissions } from "./permissions/index.js";
export {
  type Extension,
  normalizeExtension,
  registerExtension,
  registerExtensions,
} from "./extensions/loader.js";
