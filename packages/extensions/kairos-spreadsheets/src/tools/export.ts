/**
 * sheets:export — converte planilha pra outro formato (csv, xlsx, json).
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
  inputPath: z.string().describe("Caminho do arquivo de origem"),
  outputPath: z.string().describe("Caminho do arquivo de saída (formato deduzido pela extensão)"),
  sheet: z.string().optional().describe("Sheet a exportar. Default: primeira."),
  asJson: z
    .boolean()
    .default(false)
    .describe("Se true, escreve JSON (array de objetos) em vez de CSV/xlsx"),
});

export const exportTool: Tool<typeof inputSchema> = {
  name: "sheets:export",
  description:
    "Exporta planilha para outro formato. csv/xlsx via extensão do outputPath. asJson=true força JSON (array de objetos, header como chaves).",
  dangerous: true,
  inputSchema,
  execute: async (input) => {
    const inAbs = ensureAllowed(input.inputPath);
    const outAbs = ensureAllowed(input.outputPath);

    const wb = XLSX.readFile(inAbs);
    const sheetName = input.sheet ?? wb.SheetNames[0];
    if (!sheetName) throw new Error("Planilha sem sheets");
    const ws = wb.Sheets[sheetName];
    if (!ws) throw new Error(`Sheet não encontrada: ${sheetName}`);

    fs.mkdirSync(path.dirname(outAbs), { recursive: true });

    if (input.asJson) {
      const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
      fs.writeFileSync(outAbs, JSON.stringify(records, null, 2), "utf-8");
    } else if (outAbs.endsWith(".csv")) {
      const csv = XLSX.utils.sheet_to_csv(ws);
      fs.writeFileSync(outAbs, csv, "utf-8");
    } else if (outAbs.endsWith(".xlsx")) {
      const newWb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newWb, ws, sheetName);
      XLSX.writeFile(newWb, outAbs);
    } else {
      throw new Error("Formato de saída deve ser .csv, .xlsx ou asJson=true");
    }

    const stat = fs.statSync(outAbs);
    return {
      inputPath: inAbs,
      outputPath: outAbs,
      sheet: sheetName,
      sizeBytes: stat.size,
    };
  },
};
