/**
 * IPC handlers — bridge entre renderer (UI) e main (Electron + Agent).
 *
 * Sprint 0: só o handler de "ping" pra provar que a ponte funciona.
 * Sprint 1: registra os canais `chat:send`, `chat:stop`, `agent:event`, etc.
 */

import { ipcMain } from "electron";

export function registerIpcHandlers(): void {
  ipcMain.handle("app:ping", async () => {
    return { ok: true, app: "Kairós Desktop Alves", version: "0.1.0" };
  });

  // Sprint 1: implementar.
  // ipcMain.handle("chat:send", async (_e, message) => { ... });
  // ipcMain.handle("chat:stop", async (_e, sessionId) => { ... });
}
