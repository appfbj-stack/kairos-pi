/**
 * Preload — expõe API segura pro renderer via contextBridge.
 *
 * Sprint 0: só o "ping" pra provar a ponte.
 * Sprint 1: api.send, api.onAgentEvent, api.attachFile, etc.
 */

import { contextBridge, ipcRenderer } from "electron";

const api = {
  ping: (): Promise<{ ok: boolean; app: string; version: string }> =>
    ipcRenderer.invoke("app:ping"),

  // Sprint 1:
  // send: (msg: string) => ipcRenderer.invoke("chat:send", msg),
  // onAgentEvent: (cb: (e: AgentEvent) => void) => { ... },
};

contextBridge.exposeInMainWorld("kairos", api);

export type KairosAPI = typeof api;
