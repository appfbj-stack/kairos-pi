/**
 * images:compress — comprime imagem (preserva formato original).
 *
 * Para jpeg/webp/avif usa quality. Para png usa compressionLevel.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  input: z.string().describe("Caminho da imagem de entrada"),
  output: z.string().describe("Caminho da imagem comprimida de saída"),
  quality: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(70)
    .describe("Qualidade (1-100, quanto menor mais compressão)"),
});

export const compressTool: Tool<typeof inputSchema> = {
  name: "images:compress",
  description:
    "Comprime imagem preservando formato original. quality=70 é bom default — comprime bem sem perda visível.",
  dangerous: true,
  inputSchema,
  execute: async (input) => {
    const inAbs = ensureAllowed(input.input);
    const outAbs = ensureAllowed(input.output);
    await fs.mkdir(path.dirname(outAbs), { recursive: true });

    const inMeta = await sharp(inAbs).metadata();
    const inStat = await fs.stat(inAbs);

    let pipeline = sharp(inAbs);
    const fmt = inMeta.format;
    if (fmt === "jpeg" || fmt === "jpg") {
      pipeline = pipeline.jpeg({ quality: input.quality, mozjpeg: true });
    } else if (fmt === "webp") {
      pipeline = pipeline.webp({ quality: input.quality });
    } else if (fmt === "avif") {
      pipeline = pipeline.avif({ quality: input.quality });
    } else if (fmt === "png") {
      pipeline = pipeline.png({ compressionLevel: 9, palette: true });
    } else {
      throw new Error(`Formato não suporta compressão: ${fmt}`);
    }

    const info = await pipeline.toFile(outAbs);
    return {
      input: inAbs,
      output: outAbs,
      inputSize: inStat.size,
      outputSize: info.size,
      reductionPercent: Math.round(((inStat.size - info.size) / inStat.size) * 100),
      format: info.format,
    };
  },
};
