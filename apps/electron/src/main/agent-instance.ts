/**
 * Agent singleton — gerencia o Agent do Kairós no main process.
 *
 * Cria 1 Agent por sessão de chat, carrega extensions, persiste no SQLite.
 * O renderer conversa com ele via IPC.
 */

import path from "node:path";
import os from "node:os";
import { app } from "electron";
import {
  Agent,
  type AgentEvent,
  readProviderConfigFromEnv,
  buildModel,
  registerExtension,
  type ProviderConfig,
} from "@kairos/agent";
import kairosVideo from "@kairos/extension-video";
import kairosFiles from "@kairos/extension-files";
import kairosSpreadsheets from "@kairos/extension-spreadsheets";
import kairosPdfCreate from "@kairos/extension-pdf-create";
import kairosDocuments from "@kairos/extension-documents";
import kairosImages from "@kairos/extension-images";
import { openDatabase, logger } from "@kairos/core";

let agent: Agent | null = null;
let currentSessionId: string | null = null;
let provider: ProviderConfig = readProviderConfigFromEnv();

function workspaceDir(): string {
  return path.join(app.getPath("userData"), "kairos-workspace");
}

/** Cria (ou retorna) o Agent. Idempotente. */
export function getAgent(sessionId: string): Agent {
  if (agent && currentSessionId === sessionId) return agent;

  logger.info({ sessionId, provider }, "Criando Agent");

  // Workspace dedicado por usuário
  const workspace = workspaceDir();
  const db = openDatabase(workspace);
  logger.info({ workspace }, "Database aberto");

  agent = new Agent(sessionId, {
    model: buildModel(provider),
    workspaceDir: workspace,
    enabledExtensions: [
      "kairos-files",
      "kairos-spreadsheets",
      "kairos-pdf-create",
      "kairos-documents",
      "kairos-images",
      "kairos-video",
    ],
    locale: "pt-BR",
  });

  // Carrega extensions no ToolRegistry
  registerExtension(agent.tools, kairosFiles);
  registerExtension(agent.tools, kairosSpreadsheets);
  registerExtension(agent.tools, kairosPdfCreate);
  registerExtension(agent.tools, kairosDocuments);
  registerExtension(agent.tools, kairosImages);
  registerExtension(agent.tools, kairosVideo);

  logger.info(
    { toolCount: agent.tools.list().length },
    `${agent.tools.list().length} tools registradas`
  );

  currentSessionId = sessionId;
  return agent;
}

/** Processa uma mensagem do user, retornando AsyncIterable<AgentEvent>. */
export async function* handleUserMessage(sessionId: string, userMessage: string) {
  const a = getAgent(sessionId);
  for await (const ev of a.handle(userMessage)) {
    yield ev;
  }
}

/** Pede cancelamento. */
export function stopAgent(sessionId: string): void {
  const a = getAgent(sessionId);
  a.stop();
}

/** Atualiza o provider em runtime (settings UI). */
export function setProvider(next: ProviderConfig): void {
  provider = next;
  // Invalida o agent pra forçar recriação com novo model
  agent = null;
  currentSessionId = null;
  logger.info({ provider }, "Provider atualizado");
}

/** Retorna o provider atual. */
export function getProvider(): ProviderConfig {
  return provider;
}

/** Retorna info de debug pro renderer. */
export function getDebugInfo() {
  const a = agent;
  return {
    provider,
    userData: app.getPath("userData"),
    workspace: workspaceDir(),
    cwd: process.cwd(),
    username: os.userInfo().username,
    platform: process.platform,
    nodeVersion: process.versions.node,
    electronVersion: process.versions.electron,
    toolCount: a?.tools.list().length ?? 0,
    currentSessionId,
  };
}
