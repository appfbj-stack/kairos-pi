/**
 * Janela principal do Electron.
 */

import { BrowserWindow, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createMainWindow({ isDev }: { isDev: boolean }): BrowserWindow {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 600,
    minHeight: 500,
    title: "Kairós Desktop Alves",
    backgroundColor: "#0f172a", // slate-900 (paleta definida no briefing §8)
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Mantém acesso ao preload TS; tighten na Sprint 5
    },
  });

  win.once("ready-to-show", () => win.show());

  // Loga tudo que acontece no console do renderer pra ajudar debug em dev.
  win.webContents.on("console-message", (_e, level, message, line, source) => {
    const tag = ["DEBUG", "INFO", "WARN", "ERROR"][level] ?? `L${level}`;
    console.log(`[renderer:${tag}] ${message} (${source}:${line})`);
  });
  win.webContents.on("did-fail-load", (_e, code, desc, url) => {
    console.error(`[renderer:load-fail] ${code} ${desc} url=${url}`);
  });
  win.webContents.on("render-process-gone", (_e, details) => {
    console.error(`[renderer:gone] reason=${details.reason} exitCode=${details.exitCode}`);
  });

  // Links externos abrem no browser do sistema, não na app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../../dist-renderer/index.html"));
  }

  return win;
}
