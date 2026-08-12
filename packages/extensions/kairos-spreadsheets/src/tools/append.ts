/**
 * sheets:append — adiciona linhas no fim de uma sheet existente.
 *
 * Lê o arquivo, append rows, salva de volta. Boa pra ir adicionando dados
 * incrementalmente sem precisar ler tudo primeiro.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import * as XLSX from "xlsx";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  path: z.string().describe("Caminho do arquivo xlsx"),
  sheet: z.string().optional().describe("Nome da sheet. Default: primeira."),
  rows: z
    .array(z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])))
    .min(1)
    .describe("Linhas a adicionar (matriz 2D)"),
});

export const appendTool: Tool<typeof inputSchema> = {
  name: "sheets:append",
  description:
    "Adiciona linhas no fim de uma sheet existente. Útil para acumular dados incrementalmente.",
  dangerous: true,
  inputSchema,
  execute: async (input) => {
    const abs = ensureAllowed(input.path);
    const wb = XLSX.readFile(abs);
    const sheetName = input.sheet ?? wb.SheetNames[0];
    if (!sheetName) throw new Error("Planilha sem sheets");
    const ws = wb.Sheets[sheetName];
    if (!ws) throw new Error(`Sheet não encontrada: ${sheetName}`);

    const existing = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false, defval: null });
    const combined = [...existing, ...input.rows];
    const newWs = XLSX.utils.aoa_to_sheet(combined);

    // Preserva larguras de coluna e merges se existirem
    if (ws["!cols"]) newWs["!cols"] = ws["!cols"];
    if (ws["!merges"]) newWs["!merges"] = ws["!merges"];

    wb.Sheets[sheetName] = newWs;
    XLSX.writeFile(wb, abs);

    return {
      path: abs,
      sheet: sheetName,
      rowsAppended: input.rows.length,
      totalRows: combined.length,
    };
  },
};
