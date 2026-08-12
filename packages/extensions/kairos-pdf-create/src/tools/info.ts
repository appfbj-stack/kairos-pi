/**
 * pdf:info — lê metadados de um PDF.
 *
 * Não destrutivo. Bom para entender o arquivo antes de processar.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import { PDFDocument } from "pdf-lib";
import fs from "node:fs/promises";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  path: z.string().describe("Caminho absoluto do PDF"),
});

export const infoTool: Tool<typeof inputSchema> = {
  name: "pdf:info",
  description:
    "Lê metadados de um PDF: número de páginas, título, autor, criador, producer, datas.",
  dangerous: false,
  inputSchema,
  execute: async (input) => {
    const abs = ensureAllowed(input.path);
    const bytes = await fs.readFile(abs);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

    return {
      path: abs,
      sizeBytes: bytes.byteLength,
      pageCount: doc.getPageCount(),
      title: doc.getTitle() ?? null,
      author: doc.getAuthor() ?? null,
      subject: doc.getSubject() ?? null,
      keywords: doc.getKeywords() ?? null,
      creator: doc.getCreator() ?? null,
      producer: doc.getProducer() ?? null,
      creationDate: doc.getCreationDate()?.toISOString() ?? null,
      modificationDate: doc.getModificationDate()?.toISOString() ?? null,
    };
  },
};
