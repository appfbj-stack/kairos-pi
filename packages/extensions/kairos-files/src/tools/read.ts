/**
 * files:read — lê o conteúdo de um arquivo de texto.
 *
 * Para binários (PDF, imagens), use tools específicas (kairos-pdf-*).
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import fs from "node:fs/promises";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  path: z.string().describe("Caminho absoluto do arquivo"),
  encoding: z
    .enum(["utf-8", "utf8", "ascii", "latin1", "base64"])
    .default("utf-8")
    .describe("Encoding do arquivo"),
  maxBytes: z
    .number()
    .int()
    .positive()
    .default(1_000_000)
    .describe("Tamanho máximo em bytes (1MB default) — protege contra arquivos gigantes"),
});

export const readTool: Tool<typeof inputSchema> = {
  name: "files:read",
  description:
    "Lê o conteúdo de um arquivo de texto. Para arquivos >1MB, ajuste maxBytes. Para binários (PDF, imagens), use tools específicas.",
  dangerous: false,
  inputSchema,
  execute: async (input) => {
    const abs = ensureAllowed(input.path);
    const stat = await fs.stat(abs);
    if (stat.size > input.maxBytes) {
      throw new Error(
        `Arquivo muito grande (${stat.size} bytes). Aumente maxBytes ou use outra estratégia.`
      );
    }
    const content = await fs.readFile(abs, {
      encoding: input.encoding as BufferEncoding,
    });
    return {
      path: abs,
      sizeBytes: stat.size,
      encoding: input.encoding,
      content,
    };
  },
};
