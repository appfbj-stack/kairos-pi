/**
 * Electron main process — entrypoint.
 *
 * Sprint 0: abre a janela com "Kairós Desktop Alves" no título.
 * Sprint 1+: carrega o Agent, registra IPC handlers.
 */

import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMainWindow } from "./window.js";
import { registerIpcHandlers } from "./ipc.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === "development";

app.whenReady().then(() => {
  registerIpcHandlers();
  createMainWindow({ isDev });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow({ isDev });
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Garante que só uma instância do app roda por vez.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}
