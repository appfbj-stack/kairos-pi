/**
 * files:move — move/renomeia arquivo ou diretório.
 *
 * Também usado como "rename" quando destino está no mesmo diretório.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import fs from "node:fs/promises";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  from: z.string().describe("Caminho absoluto de origem"),
  to: z.string().describe("Caminho absoluto de destino"),
  overwrite: z
    .boolean()
    .default(false)
    .describe("Se true, sobrescreve destino existente. Default é falhar."),
});

export const moveTool: Tool<typeof inputSchema> = {
  name: "files:move",
  description:
    "Move ou renomeia arquivo/diretório. Se o destino existir, overwrite=false (default) causa erro. Use isto também para renomear.",
  dangerous: true,
  inputSchema,
  execute: async (input) => {
    const from = ensureAllowed(input.from);
    const to = ensureAllowed(input.to);

    const destExists = await fs
      .stat(to)
      .then(() => true)
      .catch(() => false);

    if (destExists && !input.overwrite) {
      throw new Error(
        `Destino já existe: ${to}. Use overwrite=true para sobrescrever.`
      );
    }

    await fs.rename(from, to);
    return { from, to, overwritten: destExists };
  },
};
