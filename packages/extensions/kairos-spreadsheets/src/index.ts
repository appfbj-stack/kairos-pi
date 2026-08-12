/**
 * kairos-spreadsheets — extensão de planilhas do Kairós.
 *
 * Casa direto com PRD §7.
 * Tools expostas (5):
 *   - sheets:list    — lista sheets + dimensões
 *   - sheets:read    — lê células (xlsx/xls/csv)
 *   - sheets:create  — cria planilha nova
 *   - sheets:append  — adiciona linhas
 *   - sheets:export  — converte para csv/xlsx/json
 *
 * Stack: SheetJS (`xlsx`) — único pacote, cobre todos os formatos.
 * Safety: whitelist de paths (mesmo padrão do kairos-files).
 * Destrutivas (create, append, export) marcadas com dangerous:true.
 */

import type { Extension, Tool } from "@kairos/agent";
import { z } from "zod";
import { readTool } from "./tools/read.js";
import { listSheetsTool } from "./tools/sheets.js";
import { createTool } from "./tools/create.js";
import { appendTool } from "./tools/append.js";
import { exportTool } from "./tools/export.js";

const extension: Extension = {
  name: "kairos-spreadsheets",
  version: "0.1.0",
  description:
    "Leitura, criação, edição e exportação de planilhas (xlsx, xls, csv) com whitelist de paths.",
  tools: [readTool, listSheetsTool, createTool, appendTool, exportTool] as unknown as Tool<z.ZodTypeAny>[],
};

export default extension;
export { extension };
