/**
 * kairos-video — extensão de vídeo do Kairós.
 *
 * Padrão de extension (modelado na extensions API do Pi Agent):
 *   - exporta default um objeto Extension
 *   - tem `name`, `version`, `tools[]`
 *   - o extensions loader do @kairos/agent instancia e registra
 *
 * Tools expostas:
 *   - video:convert   — converte formato (mp4, webm, mov, mkv, avi)
 *   - video:trim      — corta trecho por tempo inicial/final
 *   - video:probe     — lê metadados (duração, codec, resolução)
 *   - video:audio     — extrai áudio do vídeo (mp3, wav, aac)
 */

import type { Extension, Tool } from "@kairos/agent";
import { z } from "zod";
import { videoConvertTool } from "./tools/convert.js";
import { videoTrimTool } from "./tools/trim.js";
import { videoProbeTool } from "./tools/probe.js";
import { videoAudioTool } from "./tools/audio.js";

const extension: Extension = {
  name: "kairos-video",
  version: "0.1.0",
  description:
    "Ferramentas de vídeo: conversão, corte, extração de áudio, leitura de metadados. Usa ffmpeg empacotado (sem dependência externa).",
  // Cast explícito: cada tool tem seu próprio Zod schema, e o array é
  // tipado como `Tool<ZodTypeAny>[]` na interface Extension. O cast é seguro
  // porque o loader trata todas as tools uniformemente via ToolContext.
  tools: [videoConvertTool, videoTrimTool, videoProbeTool, videoAudioTool] as unknown as Tool<z.ZodTypeAny>[],
};

export default extension;
export { extension };
