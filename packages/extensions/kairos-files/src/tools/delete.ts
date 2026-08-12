/**
 * files:delete — exclui um arquivo ou diretório.
 *
 * Sempre destrutivo. Quando o usuário pedir "exclua X", o pi-nolo vai pedir
 * confirmação ANTES de chamar esta tool.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import fs from "node:fs/promises";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  path: z.string().describe("Caminho absoluto do arquivo ou diretório"),
  recursive: z
    .boolean()
    .default(false)
    .describe("Se true e for diretório, remove recursivamente (cuidado!)"),
});

export const deleteTool: Tool<typeof inputSchema> = {
  name: "files:delete",
  description:
    "Exclui um arquivo ou diretório. Para diretórios não-vazios, recursive=true é obrigatório. SEMPRE destrutivo — pi-nolo vai pedir confirmação ao usuário antes.",
  dangerous: true,
  inputSchema,
  execute: async (input) => {
    const abs = ensureAllowed(input.path);
    const stat = await fs.stat(abs);

    if (stat.isDirectory()) {
      if (!input.recursive) {
        throw new Error(
          `Path é diretório. Use recursive=true para excluir com conteúdo.`
        );
      }
      await fs.rm(abs, { recursive: true, force: true });
    } else {
      await fs.unlink(abs);
    }

    return { path: abs, deleted: true };
  },
};
