/**
 * Preload — expõe API segura pro renderer via contextBridge.
 *
 * Sprint 1.2: API completa de chat (send, stop, onEvent, listTools, provider).
 */

import { contextBridge, ipcRenderer } from "electron";
import type { AgentEvent, ProviderConfig } from "@kairos/agent";

const api = {
  // Health
  ping: (): Promise<{ ok: boolean; app: string; version: string }> =>
    ipcRenderer.invoke("app:ping"),

  debug: (): Promise<unknown> => ipcRenderer.invoke("app:debug"),

  // Sessão
  start: (
    sessionId: string
  ): Promise<{ sessionId: string; toolCount: number; tools: { name: string; description: string; dangerous: boolean }[] }> =>
    ipcRenderer.invoke("agent:start", sessionId),

  // Chat
  send: (sessionId: string, userMessage: string): Promise<{ ok: true }> =>
    ipcRenderer.invoke("agent:send", sessionId, userMessage),

  // Recebe eventos do agent (message, tool:call, tool:result, progress, etc)
  onAgentEvent: (
    sessionId: string,
    cb: (event: AgentEvent) => void
  ): (() => void) => {
    const channel = `agent:event:${sessionId}`;
    const handler = (_e: unknown, event: AgentEvent) => cb(event);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.off(channel, handler);
  },

  stop: (sessionId: string): Promise<{ ok: true }> =>
    ipcRenderer.invoke("agent:stop", sessionId),

  // Provider config
  getProvider: (): Promise<ProviderConfig> =>
    ipcRenderer.invoke("agent:provider:get"),

  setProvider: (next: ProviderConfig): Promise<{ ok: true; provider: ProviderConfig }> =>
    ipcRenderer.invoke("agent:provider:set", next),

  // Tools
  listTools: (
    sessionId: string
  ): Promise<{ name: string; description: string; dangerous: boolean }[]> =>
    ipcRenderer.invoke("agent:list-tools", sessionId),
};

contextBridge.exposeInMainWorld("kairos", api);

export type KairosAPI = typeof api;
