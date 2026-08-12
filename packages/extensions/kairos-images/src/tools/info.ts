/**
 * images:info — lê metadados de uma imagem.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import sharp from "sharp";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  path: z.string().describe("Caminho absoluto da imagem"),
});

export const infoTool: Tool<typeof inputSchema> = {
  name: "images:info",
  description:
    "Lê metadados de uma imagem: largura, altura, formato, channels, espaço de cor, tem alpha, tamanho do arquivo.",
  dangerous: false,
  inputSchema,
  execute: async (input) => {
    const abs = ensureAllowed(input.path);
    const meta = await sharp(abs).metadata();
    return {
      path: abs,
      format: meta.format,
      width: meta.width,
      height: meta.height,
      channels: meta.channels,
      hasAlpha: meta.hasAlpha,
      colorSpace: meta.space,
      density: meta.density,
      pages: meta.pages,
      exif: meta.exif ? { present: true } : { present: false },
    };
  },
};
