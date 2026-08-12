/**
 * kairos-documents — extensão de documentos Word do Kairós.
 *
 * Casa com PRD §9.
 * Tools expostas (4):
 *   - docs:create            — cria .docx a partir de texto (markdown-like)
 *   - docs:create-from-table — cria .docx com tabela formatada
 *   - docs:read              — lê texto (ou HTML formatado)
 *   - docs:info              — metadados (autor, datas, contagem)
 *
 * Stack:
 *   - docx  (criar .docx)
 *   - mammoth (ler .docx)
 *   - jszip (parsear core.xml do .docx pra metadata)
 */

import type { Extension, Tool } from "@kairos/agent";
import { z } from "zod";
import { createTool } from "./tools/create.js";
import { createFromTableTool } from "./tools/create-from-table.js";
import { readTool } from "./tools/read.js";
import { infoTool } from "./tools/info.js";

const extension: Extension = {
  name: "kairos-documents",
  version: "0.1.0",
  description:
    "Criação e leitura de documentos Word .docx. Suporta títulos markdown-like, tabelas formatadas, leitura de texto/HTML e metadados.",
  tools: [createTool, createFromTableTool, readTool, infoTool] as unknown as Tool<z.ZodTypeAny>[],
};

export default extension;
export { extension };
