/**
 * sheets:create — cria uma planilha nova.
 *
 * Cria arquivo xlsx com uma sheet inicial. Aceita header + rows opcionais.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
// xlsx é CJS — default import preserva readFile/writeFile/etc
// (namespace import deixa readFile undefined em ESM strict)
import XLSX from "xlsx";
import path from "node:path";
import fs from "node:fs";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  outputPath: z.string().describe("Caminho absoluto do arquivo a criar (deve terminar em .xlsx)"),
  sheetName: z.string().default("Plan1").describe("Nome da primeira sheet"),
  header: z
    .array(z.string())
    .optional()
    .describe("Lista de nomes de colunas (primeira linha)"),
  rows: z
    .array(z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])))
    .optional()
    .describe("Linhas iniciais como matriz 2D"),
  overwrite: z.boolean().default(false).describe("Se true, sobrescreve arquivo existente"),
});

export const createTool: Tool<typeof inputSchema> = {
  name: "sheets:create",
  description:
    "Cria uma nova planilha xlsx. Opcionalmente com header (primeira linha) e rows iniciais. Por segurança, overwrite=false (default).",
  dangerous: true,
  inputSchema,
  execute: async (input) => {
    const abs = ensureAllowed(input.outputPath);
    if (!abs.endsWith(".xlsx")) {
      throw new Error("Apenas .xlsx é suportado para criação. Use .csv só com sheets:export");
    }

    const exists = fs.existsSync(abs);
    if (exists && !input.overwrite) {
      throw new Error(`Arquivo já existe: ${abs}. Use overwrite=true para sobrescrever.`);
    }

    const aoa: unknown[][] = [];
    if (input.header) aoa.push(input.header);
    if (input.rows) aoa.push(...input.rows);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, input.sheetName);

    fs.mkdirSync(path.dirname(abs), { recursive: true });
    XLSX.writeFile(wb, abs);

    return {
      path: abs,
      sheetName: input.sheetName,
      rowCount: aoa.length,
      colCount: input.header?.length ?? 0,
      created: !exists,
    };
  },
};
