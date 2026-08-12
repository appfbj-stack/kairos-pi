/**
 * images:convert — converte formato de imagem.
 *
 * Usa sharp para fazer a conversão com controle de qualidade.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  input: z.string().describe("Caminho da imagem de entrada"),
  output: z.string().describe("Caminho da imagem de saída (formato deduzido pela extensão)"),
  quality: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(80)
    .describe("Qualidade (1-100, só para jpeg/webp/avif)"),
  overwrite: z.boolean().default(false),
});

export const convertTool: Tool<typeof inputSchema> = {
  name: "images:convert",
  description:
    "Converte imagem para outro formato (jpg, png, webp, avif, gif, tiff). Formato deduzido pela extensão do output. quality só afeta jpeg/webp/avif.",
  dangerous: true,
  inputSchema,
  execute: async (input) => {
    const inAbs = ensureAllowed(input.input);
    const outAbs = ensureAllowed(input.output);

    const exists = await fs
      .stat(outAbs)
      .then(() => true)
      .catch(() => false);
    if (exists && !input.overwrite) {
      throw new Error(`Arquivo já existe: ${outAbs}. Use overwrite=true.`);
    }

    await fs.mkdir(path.dirname(outAbs), { recursive: true });

    const ext = path.extname(outAbs).toLowerCase().slice(1);
    let pipeline = sharp(inAbs);

    switch (ext) {
      case "jpg":
      case "jpeg":
        pipeline = pipeline.jpeg({ quality: input.quality });
        break;
      case "png":
        pipeline = pipeline.png({ compressionLevel: 9 });
        break;
      case "webp":
        pipeline = pipeline.webp({ quality: input.quality });
        break;
      case "avif":
        pipeline = pipeline.avif({ quality: input.quality });
        break;
      case "gif":
        pipeline = pipeline.gif();
        break;
      case "tiff":
        pipeline = pipeline.tiff({ quality: input.quality });
        break;
      default:
        throw new Error(`Formato de saída não suportado: .${ext}`);
    }

    const info = await pipeline.toFile(outAbs);
    return {
      input: inAbs,
      output: outAbs,
      width: info.width,
      height: info.height,
      sizeBytes: info.size,
      format: info.format,
    };
  },
};
