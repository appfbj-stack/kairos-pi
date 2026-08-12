/**
 * kairos-images — extensão de processamento de imagem do Kairós.
 *
 * Casa com PRD §10.
 * Processamento 100% local usando sharp (libvips — rápido, sem upload).
 *
 * Tools expostas (5):
 *   - images:info       — metadados (largura, altura, formato, channels)
 *   - images:resize     — redimensiona (cover, contain, fill, inside, outside)
 *   - images:convert    — converte formato (jpg, png, webp, avif, gif, tiff)
 *   - images:compress   — comprime preservando formato
 *   - images:transform  — rotate, flip, crop (combináveis)
 *
 * Geração via provider (DALL-E, etc) — fase 2, fora do MVP.
 */

import type { Extension, Tool } from "@kairos/agent";
import { z } from "zod";
import { infoTool } from "./tools/info.js";
import { resizeTool } from "./tools/resize.js";
import { convertTool } from "./tools/convert.js";
import { compressTool } from "./tools/compress.js";
import { transformTool } from "./tools/transform.js";

const extension: Extension = {
  name: "kairos-images",
  version: "0.1.0",
  description:
    "Processamento local de imagens: metadados, redimensionar, converter, comprimir, transformações geométricas. Usa sharp (libvips).",
  tools: [infoTool, resizeTool, convertTool, compressTool, transformTool] as unknown as Tool<z.ZodTypeAny>[],
};

export default extension;
export { extension };
