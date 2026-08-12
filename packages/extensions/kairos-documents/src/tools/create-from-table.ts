/**
 * docs:create-from-table — cria .docx com tabela formatada.
 *
 * Gera um Word .docx com header (primeira linha em negrito) + rows
 * em uma tabela com bordas.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
} from "docx";
import fs from "node:fs";
import path from "node:path";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  outputPath: z.string().describe("Caminho absoluto do .docx a criar"),
  title: z.string().optional().describe("Título do documento"),
  author: z.string().default("Kairos"),
  header: z.array(z.string()).min(1).describe("Nomes das colunas (primeira linha, em negrito)"),
  rows: z
    .array(z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])))
    .describe("Linhas de dados (matriz 2D)"),
});

function makeCell(text: string, isHeader: boolean): TableCell {
  return new TableCell({
    width: { size: 25, type: WidthType.PERCENTAGE },
    shading: isHeader
      ? { type: ShadingType.SOLID, color: "D3D3D3", fill: "D3D3D3" }
      : undefined,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: isHeader })],
        alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
      }),
    ],
  });
}

export const createFromTableTool: Tool<typeof inputSchema> = {
  name: "docs:create-from-table",
  description:
    "Cria um .docx com tabela formatada. Header (primeira linha) em negrito com fundo cinza. Rows como células normais.",
  dangerous: true,
  inputSchema,
  execute: async (input) => {
    const abs = ensureAllowed(input.outputPath);
    if (!abs.endsWith(".docx")) {
      throw new Error("outputPath deve terminar em .docx");
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true });

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      },
      rows: [
        new TableRow({
          tableHeader: true,
          children: input.header.map((h) => makeCell(h, true)),
        }),
        ...input.rows.map(
          (row) =>
            new TableRow({
              children: row.map((c) => makeCell(c == null ? "" : String(c), false)),
            })
        ),
      ],
    });

    const children: (Paragraph | Table)[] = [];
    if (input.title) {
      children.push(
        new Paragraph({
          text: input.title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        })
      );
      children.push(new Paragraph({ text: "" }));
    }
    children.push(table);

    const doc = new Document({
      creator: input.author,
      title: input.title ?? "Relatório",
      sections: [{ properties: {}, children }],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(abs, buffer);
    const stat = fs.statSync(abs);

    return {
      path: abs,
      sizeBytes: stat.size,
      rowCount: input.rows.length,
      colCount: input.header.length,
    };
  },
};
