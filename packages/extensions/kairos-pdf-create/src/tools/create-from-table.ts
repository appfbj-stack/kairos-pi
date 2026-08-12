/**
 * pdf:create-from-table — cria um PDF tabular (estilo relatório).
 *
 * Recebe header (colunas) + rows (matriz 2D) e gera um PDF formatado
 * com a tabela. Quebra linhas longas e pagina automaticamente.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  outputPath: z.string().describe("Caminho absoluto do PDF a criar"),
  title: z.string().optional(),
  author: z.string().default("Kairos"),
  header: z.array(z.string()).min(1).describe("Nomes das colunas (primeira linha)"),
  rows: z
    .array(z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])))
    .describe("Linhas de dados (matriz 2D)"),
  fontSize: z.number().int().min(6).max(72).default(9),
});

export const createFromTableTool: Tool<typeof inputSchema> = {
  name: "pdf:create-from-table",
  description:
    "Cria um PDF tabular (estilo relatório) a partir de header + rows. Cada coluna fica igualmente espaçada, linhas longas quebram automaticamente.",
  dangerous: true,
  inputSchema,
  execute: async (input) => {
    const abs = ensureAllowed(input.outputPath);
    if (!abs.endsWith(".pdf")) throw new Error("outputPath deve terminar em .pdf");

    fs.mkdirSync(path.dirname(abs), { recursive: true });

    return new Promise<{ path: string; sizeBytes: number; pageCount: number }>((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: input.title ?? "Relatório",
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
        resolve({ path: abs, sizeBytes: stat.size, pageCount: doc.bufferedPageRange().count });
      });
      doc.on("error", reject);

      // Título
      if (input.title) {
        doc.fontSize(16).font("Helvetica-Bold").text(input.title, { align: "center" });
        doc.moveDown(1);
      }

      // Layout: largura útil / número de colunas
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const colCount = input.header.length;
      const colWidth = pageWidth / colCount;
      const cellPadding = 4;
      const lineHeight = input.fontSize * 1.4;

      // Função para escrever uma linha (cabeçalho ou row) com quebra
      const writeRow = (cells: string[], isHeader: boolean) => {
        const wrapped: string[][] = cells.map((c) => wrapText(c, colWidth - cellPadding * 2, input.fontSize));
        const maxLines = Math.max(...wrapped.map((w) => w.length));
        const rowHeight = maxLines * lineHeight;

        // Page break se não couber
        if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
        }

        const startY = doc.y;
        let x = doc.page.margins.left;

        cells.forEach((_, i) => {
          const colX = x;
          const lines = wrapped[i] ?? [""];
          doc.fontSize(input.fontSize).font(isHeader ? "Helvetica-Bold" : "Helvetica");
          lines.forEach((line, j) => {
            doc.text(line, colX + cellPadding, startY + j * lineHeight, {
              width: colWidth - cellPadding * 2,
              align: isHeader ? "center" : "left",
            });
          });
          x += colWidth;
        });

        doc.y = startY + rowHeight;

        // Linha horizontal depois do cabeçalho
        if (isHeader) {
          doc
            .moveTo(doc.page.margins.left, doc.y)
            .lineTo(doc.page.width - doc.page.margins.right, doc.y)
            .stroke();
        }
      };

      writeRow(input.header, true);
      for (const row of input.rows) {
        writeRow(row.map((c) => (c == null ? "" : String(c))), false);
      }

      doc.end();
    });
  },
};

// Quebra texto em linhas que cabem na largura `maxWidth` (estimativa simples).
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  if (!text) return [""];
  // Caracteres médios ~ fontSize * 0.5 (heurística)
  const charsPerLine = Math.max(1, Math.floor(maxWidth / (fontSize * 0.5)));
  const result: string[] = [];
  let line = "";
  for (const wordOrig of text.split(/\s+/)) {
    let word = wordOrig;
    if ((line + " " + word).trim().length <= charsPerLine) {
      line = (line + " " + word).trim();
    } else {
      if (line) result.push(line);
      // Quebra palavra muito longa
      while (word.length > charsPerLine) {
        result.push(word.slice(0, charsPerLine));
        word = word.slice(charsPerLine);
      }
      line = word;
    }
  }
  if (line) result.push(line);
  return result.length ? result : [""];
}
