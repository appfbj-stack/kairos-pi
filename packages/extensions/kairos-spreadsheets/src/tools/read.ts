/**
 * sheets:read — lê células de uma planilha.
 *
 * Suporta xlsx, xls, csv. Retorna matriz 2D + header opcional.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
// xlsx é CJS — default import preserva readFile/writeFile/etc
// (namespace import deixa readFile undefined em ESM strict)
import XLSX from "xlsx";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  path: z.string().describe("Caminho absoluto do arquivo (xlsx, xls ou csv)"),
  sheet: z
    .string()
    .optional()
    .describe("Nome da sheet a ler. Se omitido, lê a primeira."),
  range: z
    .string()
    .optional()
    .describe('Range A1 (ex: "A1:D10"). Se omitido, lê a planilha inteira.'),
  hasHeader: z
    .boolean()
    .default(true)
    .describe("Se true (default), primeira linha é tratada como header"),
  maxRows: z
    .number()
    .int()
    .positive()
    .default(10_000)
    .describe("Limite de linhas (proteção contra planilhas gigantes)"),
});

export const readTool: Tool<typeof inputSchema> = {
  name: "sheets:read",
  description:
    'Lê células de uma planilha (xlsx, xls, csv). Retorna header (se hasHeader) e matriz 2D de valores. Use range="A1:D10" para sub-conjuntos.',
  dangerous: false,
  inputSchema,
  execute: async (input) => {
    const abs = ensureAllowed(input.path);
    // SheetJS detecta o formato pela extensão automaticamente.
    const wb = XLSX.readFile(abs);
    const sheetName = input.sheet ?? wb.SheetNames[0];
    if (!sheetName) throw new Error("Planilha sem sheets");
    const ws = wb.Sheets[sheetName];
    if (!ws) throw new Error(`Sheet não encontrada: ${sheetName}`);

    const range = input.range
      ? XLSX.utils.decode_range(input.range)
      : undefined;
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      range,
      blankrows: false,
      defval: null,
    });

    const sliced = aoa.slice(0, input.maxRows);
    const header = input.hasHeader && sliced.length > 0 ? sliced[0] : null;
    const rows = input.hasHeader ? sliced.slice(1) : sliced;

    return {
      path: abs,
      sheet: sheetName,
      sheetNames: wb.SheetNames,
      header,
      rows,
      totalRowsRead: sliced.length,
      truncated: aoa.length > input.maxRows,
    };
  },
};
