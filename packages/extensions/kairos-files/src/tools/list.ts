/**
 * files:list — lista o conteúdo de um diretório.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import fs from "node:fs";
import path from "node:path";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  path: z.string().describe("Caminho absoluto do diretório"),
  recursive: z
    .boolean()
    .default(false)
    .describe("Se true, lista recursivamente"),
  maxDepth: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(3)
    .describe("Profundidade máxima quando recursive=true"),
});

export interface FileEntry {
  path: string;
  name: string;
  type: "file" | "dir" | "other";
  sizeBytes: number;
  modifiedAt: number;
}

function listDir(dir: string, results: FileEntry[], currentDepth: number, maxDepth: number, recursive: boolean): void {
  if (recursive && currentDepth > maxDepth) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const stat = fs.statSync(full);
    const entry: FileEntry = {
      path: full,
      name: e.name,
      type: e.isDirectory() ? "dir" : e.isFile() ? "file" : "other",
      sizeBytes: stat.size,
      modifiedAt: stat.mtimeMs,
    };
    results.push(entry);
    if (recursive && e.isDirectory() && currentDepth < maxDepth) {
      listDir(full, results, currentDepth + 1, maxDepth, recursive);
    }
  }
}

export const listTool: Tool<typeof inputSchema> = {
  name: "files:list",
  description:
    "Lista o conteúdo de um diretório. Com recursive=true, entra em subdiretórios até a profundidade especificada em maxDepth (default 3).",
  dangerous: false,
  inputSchema,
  execute: async (input) => {
    const abs = ensureAllowed(input.path);
    if (!fs.existsSync(abs)) {
      throw new Error(`Diretório não encontrado: ${abs}`);
    }
    if (!fs.statSync(abs).isDirectory()) {
      throw new Error(`Path não é diretório: ${abs}`);
    }
    const results: FileEntry[] = [];
    listDir(abs, results, 1, input.maxDepth, input.recursive);
    return {
      path: abs,
      count: results.length,
      entries: results,
    };
  },
};
