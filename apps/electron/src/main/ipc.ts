/**
 * IPC handlers — bridge entre renderer (UI) e main (Electron + Agent).
 *
 * Canais:
 *   - app:ping           — health check (Sprint 0)
 *   - app:debug          — info de debug pro renderer
 *   - agent:start        — inicia sessão (cria Agent)
 *   - agent:send         — envia mensagem, stream de AgentEvent de volta
 *   - agent:stop         — cancela execução
 *   - agent:provider     — get/set provider config
 *   - agent:list-tools   — lista tools registradas
 */

import { ipcMain, BrowserWindow, type IpcMainInvokeEvent } from "electron";
import {
  getAgent,
  handleUserMessage,
  stopAgent,
  setProvider,
  getProvider,
  getDebugInfo,
} from "./agent-instance.js";
import type { AgentEvent, ProviderConfig } from "@kairos/agent";
import { logger } from "@kairos/core";

function getWindow(event: IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

export function registerIpcHandlers(): void {
  // Health check
  ipcMain.handle("app:ping", async () => {
    return { ok: true, app: "Kairós Desktop Alves", version: "0.1.0" };
  });

  // Debug info
  ipcMain.handle("app:debug", async () => getDebugInfo());

  // Inicia sessão
  ipcMain.handle("agent:start", async (_event, sessionId: string) => {
    if (typeof sessionId !== "string" || !sessionId) {
      throw new Error("sessionId é obrigatório");
    }
    const agent = getAgent(sessionId);
    return {
      sessionId,
      toolCount: agent.tools.list().length,
      tools: agent.tools.list().map((t) => ({
        name: t.name,
        description: t.description,
        dangerous: t.dangerous ?? false,
      })),
    };
  });

  // Envia mensagem — retorna stream de eventos
  ipcMain.handle(
    "agent:send",
    async (event, sessionId: string, userMessage: string) => {
      if (typeof userMessage !== "string" || !userMessage.trim()) {
        throw new Error("userMessage vazio");
      }
      const win = getWindow(event);
      if (!win) {
        throw new Error("Window não encontrada");
      }

      logger.info({ sessionId, length: userMessage.length }, "Mensagem recebida");

      // Itera o AsyncIterable e envia cada evento via webContents
      const channel = `agent:event:${sessionId}`;
      for await (const ev of handleUserMessage(sessionId, userMessage)) {
        if (!win.isDestroyed()) {
          win.webContents.send(channel, ev);
        }
      }
      return { ok: true };
    }
  );

  // Para execução
  ipcMain.handle("agent:stop", async (_event, sessionId: string) => {
    stopAgent(sessionId);
    return { ok: true };
  });

  // Provider config
  ipcMain.handle("agent:provider:get", async () => getProvider());

  ipcMain.handle(
    "agent:provider:set",
    async (_event, next: ProviderConfig) => {
      if (!next || typeof next !== "object") {
        throw new Error("Provider inválido");
      }
      if (!next.provider || !next.modelId) {
        throw new Error("provider e modelId obrigatórios");
      }
      setProvider(next);
      return { ok: true, provider: getProvider() };
    }
  );

  // Lista tools
  ipcMain.handle("agent:list-tools", async (_event, sessionId: string) => {
    const agent = getAgent(sessionId);
    return agent.tools.list().map((t) => ({
      name: t.name,
      description: t.description,
      dangerous: t.dangerous ?? false,
    }));
  });

  logger.info("IPC handlers registrados");
}

// Re-exportar tipo pro renderer
export type { AgentEvent };
