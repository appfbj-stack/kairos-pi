/**
 * Preload — expõe API segura pro renderer via contextBridge.
 *
 * Sprint 1.3: adicionado openFileDialog e attach.
 */

import { contextBridge, ipcRenderer } from "electron";
import type { AgentEvent, ProviderConfig } from "@kairos/agent";

export interface AttachmentSummary {
  name: string;
  size: number;
  path: string;
}

export interface Attachment {
  name: string;
  size: number;
  type: "text" | "image";
  mime: string;
  content: string;
}

const api = {
  // Health
  ping: (): Promise<{ ok: boolean; app: string; version: string }> =>
    ipcRenderer.invoke("app:ping"),

  debug: (): Promise<unknown> => ipcRenderer.invoke("app:debug"),

  // File dialog (Sprint 1.3)
  openFileDialog: (): Promise<
    { canceled: true; files: [] } | { canceled: false; files: AttachmentSummary[] }
  > => ipcRenderer.invoke("dialog:open-file"),

  // Attach (Sprint 1.3)
  attach: (paths: string[]): Promise<Attachment[]> =>
    ipcRenderer.invoke("agent:attach", paths),

  // Sessão
  start: (
    sessionId: string
  ): Promise<{ sessionId: string; toolCount: number; tools: { name: string; description: string; dangerous: boolean }[] }> =>
    ipcRenderer.invoke("agent:start", sessionId),

  // Chat
  send: (
    sessionId: string,
    userMessage: string,
    attachments?: { name: string; type: "text" | "image"; mime: string; content: string }[]
  ): Promise<{ ok: true }> => ipcRenderer.invoke("agent:send", sessionId, userMessage, attachments),

  // Recebe eventos do agent
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
