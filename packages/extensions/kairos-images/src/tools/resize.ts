/**
 * images:resize — redimensiona uma imagem.
 *
 * Suporta:
 *   - width / height fixos
 *   - fit modes: cover, contain, fill, inside, outside
 *   - sem upscale (mantém tamanho se já menor)
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  input: z.string().describe("Caminho da imagem de entrada"),
  output: z.string().describe("Caminho da imagem de saída"),
  width: z.number().int().positive().optional().describe("Largura em pixels"),
  height: z.number().int().positive().optional().describe("Altura em pixels"),
  fit: z
    .enum(["cover", "contain", "fill", "inside", "outside"])
    .default("inside")
    .describe("Estratégia de redimensionamento"),
  withoutEnlargement: z
    .boolean()
    .default(true)
    .describe("Se true, não faz upscale (mantém tamanho se já for menor)"),
  format: z
    .enum(["keep", "jpeg", "png", "webp", "avif", "gif", "tiff"])
    .default("keep")
    .describe("Formato de saída. 'keep' mantém o original."),
});

export const resizeTool: Tool<typeof inputSchema> = {
  name: "images:resize",
  description:
    "Redimensiona uma imagem. Informe width e/ou height. Use fit para controlar como a imagem é cortada/redimensionada.",
  dangerous: true,
  inputSchema,
  execute: async (input) => {
    const inAbs = ensureAllowed(input.input);
    const outAbs = ensureAllowed(input.output);

    if (!input.width && !input.height) {
      throw new Error("Informe pelo menos width ou height");
    }

    await fs.mkdir(path.dirname(outAbs), { recursive: true });

    let pipeline = sharp(inAbs).resize({
      width: input.width,
      height: input.height,
      fit: input.fit,
      withoutEnlargement: input.withoutEnlargement,
    });

    if (input.format !== "keep") {
      pipeline = pipeline.toFormat(input.format === "jpeg" ? "jpeg" : input.format);
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
