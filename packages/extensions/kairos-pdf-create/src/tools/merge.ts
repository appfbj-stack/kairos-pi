/**
 * pdf:merge — junta múltiplos PDFs em um só.
 *
 * Usa pdf-lib (mantém formatação, não rasteriza).
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import { PDFDocument } from "pdf-lib";
import fs from "node:fs/promises";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  inputs: z
    .array(z.string().min(1))
    .min(2)
    .describe("Array de caminhos absolutos dos PDFs a juntar (em ordem)"),
  outputPath: z.string().describe("Caminho absoluto do PDF resultante"),
  overwrite: z.boolean().default(false),
});

export const mergeTool: Tool<typeof inputSchema> = {
  name: "pdf:merge",
  description: "Junta múltiplos PDFs em um só, preservando a formatação original. As páginas ficam na ordem dos inputs.",
  dangerous: true,
  inputSchema,
  execute: async (input) => {
    const out = ensureAllowed(input.outputPath);
    for (const p of input.inputs) ensureAllowed(p);

    const exists = await fs
      .stat(out)
      .then(() => true)
      .catch(() => false);
    if (exists && !input.overwrite) {
      throw new Error(`Arquivo já existe: ${out}. Use overwrite=true.`);
    }

    const merged = await PDFDocument.create();
    for (const inputPath of input.inputs) {
      const bytes = await fs.readFile(inputPath);
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    }

    const out_bytes = await merged.save();
    await fs.writeFile(out, out_bytes);
    const stat = await fs.stat(out);

    return {
      path: out,
      sizeBytes: stat.size,
      inputCount: input.inputs.length,
      pageCount: merged.getPageCount(),
    };
  },
};
