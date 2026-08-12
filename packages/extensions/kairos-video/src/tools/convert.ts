/**
 * video:convert — converte um vídeo para outro formato.
 *
 * Usa ffmpeg-static (binário empacotado, sem instalar ffmpeg no sistema).
 * Marca como dangerous: cria arquivo de saída, pode sobrescrever.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "node:path";
import fs from "node:fs";

ffmpeg.setFfmpegPath(ffmpegPath as unknown as string);

const inputSchema = z.object({
  input: z.string().describe("Caminho absoluto do arquivo de vídeo de entrada"),
  output: z
    .string()
    .describe(
      "Caminho absoluto do arquivo de saída (sem extensão; extensão é definida por `format`)"
    ),
  format: z
    .enum(["mp4", "webm", "mov", "mkv", "avi"])
    .default("mp4")
    .describe("Formato de saída desejado"),
  crf: z
    .number()
    .int()
    .min(0)
    .max(51)
    .default(23)
    .describe("Qualidade (0=lossless, 51=pior, 23=default)"),
});

export const videoConvertTool: Tool<typeof inputSchema> = {
  name: "video:convert",
  description:
    "Converte um arquivo de vídeo para outro formato (mp4, webm, mov, mkv, avi) usando ffmpeg. Cria um novo arquivo no caminho de saída.",
  dangerous: true,
  inputSchema,
  execute: async (input, ctx) => {
    const outputPath = input.output.endsWith(`.${input.format}`)
      ? input.output
      : `${input.output}.${input.format}`;

    if (!fs.existsSync(input.input)) {
      throw new Error(`Arquivo de entrada não encontrado: ${input.input}`);
    }

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    return new Promise<{ output: string; sizeBytes: number }>((resolve, reject) => {
      ffmpeg(input.input)
        .output(outputPath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .addOption("-crf", String(input.crf))
        .on("end", () => {
          const stat = fs.statSync(outputPath);
          resolve({ output: outputPath, sizeBytes: stat.size });
        })
        .on("error", (err) => reject(err))
        .run();
    });
  },
};
