/**
 * docs:read — lê texto de um .docx.
 *
 * Usa mammoth (mais robusto para extrair texto de .docx que parsing manual).
 * Retorna parágrafos como array, preservando estrutura básica.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import mammoth from "mammoth";
import fs from "node:fs/promises";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  path: z.string().describe("Caminho absoluto do .docx"),
  includeHtml: z
    .boolean()
    .default(false)
    .describe("Se true, retorna HTML formatado em vez de texto puro (preserva bold, italic, etc)"),
});

export const readTool: Tool<typeof inputSchema> = {
  name: "docs:read",
  description:
    "Lê o conteúdo de um .docx. Por padrão retorna texto puro. Use includeHtml=true para preservar formatação.",
  dangerous: false,
  inputSchema,
  execute: async (input) => {
    const abs = ensureAllowed(input.path);
    const buffer = await fs.readFile(abs);
    const result = input.includeHtml
      ? await mammoth.convertToHtml({ buffer })
      : await mammoth.extractRawText({ buffer });

    return {
      path: abs,
      sizeBytes: buffer.byteLength,
      content: result.value,
      warnings: result.messages
        .filter((m) => m.type === "warning")
        .map((m) => m.message),
    };
  },
};
