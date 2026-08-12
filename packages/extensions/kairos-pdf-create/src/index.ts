/**
 * kairos-pdf-create — extensão de criação de PDFs do Kairós.
 *
 * Casa com PRD §8.
 * Note: pdf-web-access (do catálogo Pi) já cobre LEITURA de PDF.
 * Esta extension cobre o lado oposto: CRIAR e MANIPULAR PDFs.
 *
 * Tools expostas (4):
 *   - pdf:create            — cria PDF a partir de texto (com títulos via `# `)
 *   - pdf:create-from-table — cria PDF tabular (relatório)
 *   - pdf:merge             — junta múltiplos PDFs
 *   - pdf:info              — metadados de um PDF
 *
 * Stack:
 *   - pdfkit (criar PDFs do zero)
 *   - pdf-lib (manipular PDFs existentes — merge, info)
 */

import type { Extension, Tool } from "@kairos/agent";
import { z } from "zod";
import { createTool } from "./tools/create.js";
import { createFromTableTool } from "./tools/create-from-table.js";
import { mergeTool } from "./tools/merge.js";
import { infoTool } from "./tools/info.js";

const extension: Extension = {
  name: "kairos-pdf-create",
  version: "0.1.0",
  description:
    "Criação e manipulação de PDFs. Texto, tabelas (relatórios), merge, metadados. Leitura de PDF é coberta pelo pi-web-access.",
  tools: [createTool, createFromTableTool, mergeTool, infoTool] as unknown as Tool<z.ZodTypeAny>[],
};

export default extension;
export { extension };
