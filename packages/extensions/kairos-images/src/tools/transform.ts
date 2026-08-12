/**
 * images:transform — operações de transformação geométrica.
 *
 * Suporta: rotate (graus), flip (vertical/horizontal), crop (região).
 *
 * Múltiplas operações podem ser combinadas em uma chamada.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  input: z.string().describe("Caminho da imagem de entrada"),
  output: z.string().describe("Caminho da imagem transformada de saída"),
  rotate: z
    .number()
    .int()
    .min(-360)
    .max(360)
    .default(0)
    .describe("Rotação em graus (positivo = sentido horário)"),
  flip: z
    .enum(["none", "horizontal", "vertical", "both"])
    .default("none")
    .describe("Flip da imagem"),
  crop: z
    .object({
      left: z.number().int().nonnegative(),
      top: z.number().int().nonnegative(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })
    .optional()
    .describe("Recortar região: {left, top, width, height} em pixels"),
});

export const transformTool: Tool<typeof inputSchema> = {
  name: "images:transform",
  description:
    "Transformações geométricas: rotate (graus), flip (horizontal/vertical/both), crop (região retangular). Combináveis em uma chamada.",
  dangerous: true,
  inputSchema,
  execute: async (input) => {
    const inAbs = ensureAllowed(input.input);
    const outAbs = ensureAllowed(input.output);
    await fs.mkdir(path.dirname(outAbs), { recursive: true });

    let pipeline = sharp(inAbs);

    if (input.crop) {
      pipeline = pipeline.extract({
        left: input.crop.left,
        top: input.crop.top,
        width: input.crop.width,
        height: input.crop.height,
      });
    }

    if (input.rotate !== 0) {
      pipeline = pipeline.rotate(input.rotate);
    }

    if (input.flip === "horizontal" || input.flip === "both") {
      pipeline = pipeline.flop();
    }
    if (input.flip === "vertical" || input.flip === "both") {
      pipeline = pipeline.flip();
    }

    const info = await pipeline.toFile(outAbs);
    return {
      input: inAbs,
      output: outAbs,
      width: info.width,
      height: info.height,
      sizeBytes: info.size,
    };
  },
};
