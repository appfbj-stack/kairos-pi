/**
 * files:search — procura arquivos por nome dentro de uma pasta.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  root: z.string().describe("Diretório raiz da busca"),
  query: z
    .string()
    .describe("Termo de busca (case-insensitive, match por substring do nome)"),
  maxResults: z
    .number()
    .int()
    .positive()
    .default(100)
    .describe("Limite de resultados (proteção contra explosão)"),
  maxDepth: z
    .number()
    .int()
    .min(1)
    .max(15)
    .default(8)
    .describe("Profundidade máxima de recursão"),
});

async function search(
  root: string,
  query: string,
  currentDepth: number,
  maxDepth: number,
  results: string[]
): Promise<void> {
  if (currentDepth > maxDepth) return;
  let entries;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return; // Pasta inacessível, ignora silenciosamente
  }
  for (const e of entries) {
    const full = path.join(root, e.name);
    if (e.name.toLowerCase().includes(query.toLowerCase())) {
      results.push(full);
    }
    if (e.isDirectory() && currentDepth < maxDepth) {
      await search(full, query, currentDepth + 1, maxDepth, results);
    }
  }
}

export const searchTool: Tool<typeof inputSchema> = {
  name: "files:search",
  description:
    "Procura arquivos/pastas por nome dentro de um diretório raiz. Retorna caminhos absolutos dos matches.",
  dangerous: false,
  inputSchema,
  execute: async (input) => {
    const root = ensureAllowed(input.root);
    const results: string[] = [];
    await search(root, input.query, 1, input.maxDepth, results);
    const truncated = results.slice(0, input.maxResults);
    return {
      root,
      query: input.query,
      totalMatches: results.length,
      truncated: results.length > input.maxResults,
      matches: truncated,
    };
  },
};
