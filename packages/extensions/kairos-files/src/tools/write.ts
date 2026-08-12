/**
 * files:write — escreve conteúdo em um arquivo.
 *
 * Cria o arquivo se não existir. Sobrescreve se existir (sempre backup opcional).
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  path: z.string().describe("Caminho absoluto do arquivo"),
  content: z.string().describe("Conteúdo a escrever"),
  encoding: z
    .enum(["utf-8", "utf8", "ascii", "latin1", "base64"])
    .default("utf-8"),
  createDirs: z
    .boolean()
    .default(true)
    .describe("Se true, cria diretórios pai se não existirem"),
  overwrite: z
    .boolean()
    .default(false)
    .describe("Se false (default) e arquivo existir, lança erro. Se true, sobrescreve."),
});

export const writeTool: Tool<typeof inputSchema> = {
  name: "files:write",
  description:
    "Escreve conteúdo em um arquivo. Por segurança, overwrite=false: se o arquivo existir, pede confirmação explícita. Use createDirs=true para criar a hierarquia.",
  dangerous: true,
  inputSchema,
  execute: async (input) => {
    const abs = ensureAllowed(input.path);

    const exists = await fs
      .stat(abs)
      .then(() => true)
      .catch(() => false);

    if (exists && !input.overwrite) {
      throw new Error(
        `Arquivo já existe: ${abs}. Use overwrite=true para sobrescrever.`
      );
    }

    if (input.createDirs) {
      await fs.mkdir(path.dirname(abs), { recursive: true });
    }

    await fs.writeFile(abs, input.content, {
      encoding: input.encoding as BufferEncoding,
    });
    const stat = await fs.stat(abs);

    return {
      path: abs,
      sizeBytes: stat.size,
      created: !exists,
      overwritten: exists,
    };
  },
};
