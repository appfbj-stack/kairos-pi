/**
 * video:trim — corta um trecho de um vídeo.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "node:path";
import fs from "node:fs";

ffmpeg.setFfmpegPath(ffmpegPath as unknown as string);

const inputSchema = z.object({
  input: z.string().describe("Caminho do vídeo de entrada"),
  output: z.string().describe("Caminho do vídeo cortado de saída"),
  startTime: z
    .string()
    .default("00:00:00")
    .describe("Tempo inicial do corte (formato HH:MM:SS ou segundos)"),
  duration: z
    .string()
    .describe("Duração do trecho a manter (formato HH:MM:SS ou segundos)"),
});

export const videoTrimTool: Tool<typeof inputSchema> = {
  name: "video:trim",
  description:
    "Corta um trecho de um vídeo, mantendo apenas o intervalo [startTime, startTime+duration].",
  dangerous: true,
  inputSchema,
  execute: async (input, ctx) => {
    if (!fs.existsSync(input.input)) {
      throw new Error(`Arquivo de entrada não encontrado: ${input.input}`);
    }
    const outputDir = path.dirname(input.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    return new Promise<{ output: string; sizeBytes: number }>((resolve, reject) => {
      ffmpeg(input.input)
        .setStartTime(input.startTime)
        .setDuration(input.duration)
        .output(input.output)
        .on("end", () => {
          const stat = fs.statSync(input.output);
          resolve({ output: input.output, sizeBytes: stat.size });
        })
        .on("error", (err) => reject(err))
        .run();
    });
  },
};
