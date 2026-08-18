/**
 * sheets:list — lista as sheets de um arquivo.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
// xlsx é CJS — default import preserva readFile/writeFile/etc
// (namespace import deixa readFile undefined em ESM strict)
import XLSX from "xlsx";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  path: z.string().describe("Caminho absoluto do arquivo"),
});

export const listSheetsTool: Tool<typeof inputSchema> = {
  name: "sheets:list",
  description: "Lista o nome de todas as sheets/abas em um arquivo de planilha.",
  dangerous: false,
  inputSchema,
  execute: async (input) => {
    const abs = ensureAllowed(input.path);
    const wb = XLSX.readFile(abs, { bookFiles: true });
    return {
      path: abs,
      sheets: wb.SheetNames.map((name) => {
        const ws = wb.Sheets[name];
        return {
          name,
          rowCount: ws ? XLSX.utils.decode_range(ws["!ref"] || "A1:A1").e.r + 1 : 0,
          colCount: ws ? XLSX.utils.decode_range(ws["!ref"] || "A1:A1").e.c + 1 : 0,
        };
      }),
    };
  },
};
