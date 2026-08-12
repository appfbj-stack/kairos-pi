/**
 * Extensions loader — carrega e registra extensions no ToolRegistry.
 *
 * Padrão:
 *   - Cada extension é um módulo TS com `export default { name, version, tools: Tool[] }`
 *   - O loader recebe a extension, valida e registra cada tool no registry
 *   - Suporta tanto import dinâmico (lazy) quanto direto (eager)
 *
 * Modelado na extensions API do Pi Agent (`@earendil-works/pi-coding-agent`).
 */

import type { Tool, ToolRegistry } from "../tools/registry.js";

/** Forma de uma extension Kairos. */
export interface Extension {
  /** Nome único, ex: "kairos-video". */
  name: string;
  /** Versão semântica, ex: "0.1.0". */
  version: string;
  /** Descrição opcional. */
  description?: string;
  /** Tools que a extension registra. */
  tools: Tool[];
}

/** Módulo importado (ESM ou CJS). */
type ExtensionModule = { default: Extension } | Extension;

/** Valida e normaliza uma extension. */
export function normalizeExtension(mod: ExtensionModule): Extension {
  const ext: Extension = "default" in mod ? mod.default : mod;

  if (!ext || typeof ext !== "object") {
    throw new Error("Extension inválida: módulo vazio ou não-objeto");
  }
  if (typeof ext.name !== "string" || ext.name.length === 0) {
    throw new Error("Extension inválida: campo `name` obrigatório (string)");
  }
  if (typeof ext.version !== "string" || ext.version.length === 0) {
    throw new Error(
      `Extension "${ext.name}" inválida: campo \`version\` obrigatório (string)`
    );
  }
  if (!Array.isArray(ext.tools)) {
    throw new Error(
      `Extension "${ext.name}" inválida: campo \`tools\` obrigatório (array)`
    );
  }
  for (const tool of ext.tools) {
    if (!tool.name) {
      throw new Error(
        `Extension "${ext.name}" tem tool sem \`name\``
      );
    }
  }
  return ext;
}

/** Registra todas as tools de uma extension no registry. */
export function registerExtension(
  registry: ToolRegistry,
  mod: ExtensionModule
): Extension {
  const ext = normalizeExtension(mod);
  for (const tool of ext.tools) {
    registry.register(tool);
  }
  return ext;
}

/** Registra várias extensions em sequência. */
export function registerExtensions(
  registry: ToolRegistry,
  mods: ExtensionModule[]
): Extension[] {
  return mods.map((m) => registerExtension(registry, m));
}
