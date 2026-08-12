/**
 * docs:create — cria um .docx a partir de texto.
 *
 * Marcações simples (estilo markdown):
 *   - `# ` → Heading 1
 *   - `## ` → Heading 2
 *   - `### ` → Heading 3
 *   - Linha vazia → parágrafo vazio (espaço)
 *   - Linha normal → parágrafo
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
} from "docx";
import fs from "node:fs";
import path from "node:path";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  outputPath: z.string().describe("Caminho absoluto do .docx a criar"),
  title: z.string().optional().describe("Título do documento"),
  author: z.string().default("Kairos"),
  text: z.string().describe("Texto do documento (suporta `# `, `## `, `### ` para títulos)"),
  fontSize: z.number().int().min(6).max(72).default(22).describe("Tamanho base (half-points: 22 = 11pt)"),
});

export const createTool: Tool<typeof inputSchema> = {
  name: "docs:create",
  description:
    "Cria um documento Word .docx a partir de texto. Suporta `# ` (H1), `## ` (H2), `### ` (H3) e parágrafos normais.",
  dangerous: true,
  inputSchema,
  execute: async (input) => {
    const abs = ensureAllowed(input.outputPath);
    if (!abs.endsWith(".docx")) {
      throw new Error("outputPath deve terminar em .docx");
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true });

    const children: Paragraph[] = [];

    if (input.title) {
      children.push(
        new Paragraph({
          text: input.title,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
        })
      );
      children.push(new Paragraph({ text: "" })); // espaço
    }

    for (const line of input.text.split(/\r?\n/)) {
      if (line.startsWith("### ")) {
        children.push(
          new Paragraph({
            text: line.slice(4),
            heading: HeadingLevel.HEADING_3,
          })
        );
      } else if (line.startsWith("## ")) {
        children.push(
          new Paragraph({
            text: line.slice(3),
            heading: HeadingLevel.HEADING_2,
          })
        );
      } else if (line.startsWith("# ")) {
        children.push(
          new Paragraph({
            text: line.slice(2),
            heading: HeadingLevel.HEADING_1,
          })
        );
      } else if (line.trim() === "") {
        children.push(new Paragraph({ text: "" }));
      } else {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line, size: input.fontSize })],
          })
        );
      }
    }

    const doc = new Document({
      creator: input.author,
      title: input.title ?? "Documento",
      description: "Criado por Kairos Desktop Alves",
      sections: [{ properties: {}, children }],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(abs, buffer);
    const stat = fs.statSync(abs);

    return {
      path: abs,
      sizeBytes: stat.size,
      paragraphCount: children.length,
    };
  },
};
