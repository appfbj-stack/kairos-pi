/**
 * files:mkdir — cria uma pasta (com parents se necessário).
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import fs from "node:fs";
import path from "node:path";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  path: z.string().describe("Caminho absoluto da pasta a criar"),
  recursive: z
    .boolean()
    .default(true)
    .describe("Se true, cria pastas pai conforme necessário"),
});

export const mkdirTool: Tool<typeof inputSchema> = {
  name: "files:mkdir",
  description: "Cria uma pasta. Com recursive=true (default), cria toda a hierarquia de pastas pai necessária.",
  dangerous: true,
  inputSchema,
  execute: async (input) => {
    const abs = ensureAllowed(input.path);
    fs.mkdirSync(abs, { recursive: input.recursive });
    return { path: abs, created: true };
  },
};
