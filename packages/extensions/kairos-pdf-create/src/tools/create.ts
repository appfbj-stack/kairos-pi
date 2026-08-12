/**
 * pdf:create — cria um PDF a partir de texto formatado.
 *
 * Suporta marcação simples no texto:
 *   - Linhas começando com `# ` viram título
 *   - Linhas normais viram parágrafo
 *   - Linhas vazias viram espaço
 *
 * Para algo mais complexo, use `pdf:create-from-html`.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  outputPath: z.string().describe("Caminho absoluto do PDF a criar (deve terminar em .pdf)"),
  title: z.string().optional().describe("Título do documento (metadata + primeira página)"),
  author: z.string().default("Kairos").describe("Autor (metadata)"),
  text: z.string().describe("Texto do documento. Suporta `# ` para títulos e parágrafos normais."),
  fontSize: z.number().int().min(6).max(72).default(11).describe("Tamanho base da fonte"),
});

export const createTool: Tool<typeof inputSchema> = {
  name: "pdf:create",
  description:
    "Cria um PDF a partir de texto. Suporta marcação simples: linhas começando com `# ` viram título. Use `pdf:create-from-html` para layout rico.",
  dangerous: true,
  inputSchema,
  execute: async (input) => {
    const abs = ensureAllowed(input.outputPath);
    if (!abs.endsWith(".pdf")) {
      throw new Error("outputPath deve terminar em .pdf");
    }

    fs.mkdirSync(path.dirname(abs), { recursive: true });

    return new Promise<{ path: string; sizeBytes: number; pageCount: number }>((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: input.title ?? "Documento",
          Author: input.author,
          Creator: "Kairos Desktop Alves",
          Producer: "pdfkit",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => {
        const buf = Buffer.concat(chunks);
        fs.writeFileSync(abs, buf);
        const stat = fs.statSync(abs);
        // pdfkit não dá contagem fácil; estimativa baseada em chunks
        resolve({ path: abs, sizeBytes: stat.size, pageCount: doc.bufferedPageRange().count });
      });
      doc.on("error", reject);

      // Renderiza texto
      const lines = input.text.split(/\r?\n/);
      for (const line of lines) {
        if (line.startsWith("# ")) {
          doc.fontSize(input.fontSize * 1.8).font("Helvetica-Bold").text(line.slice(2), { align: "left" });
          doc.moveDown(0.5);
        } else if (line.trim() === "") {
          doc.moveDown(0.5);
        } else {
          doc.fontSize(input.fontSize).font("Helvetica").text(line, { align: "left" });
        }
        doc.font("Helvetica"); // reset
      }

      doc.end();
    });
  },
};
