/**
 * video:audio — extrai a trilha de áudio de um vídeo.
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
  output: z.string().describe("Caminho do arquivo de áudio de saída"),
  format: z
    .enum(["mp3", "wav", "aac", "flac", "ogg"])
    .default("mp3")
    .describe("Formato de áudio de saída"),
  bitrate: z
    .string()
    .default("192k")
    .describe("Bitrate do áudio (ex: 128k, 192k, 320k)"),
});

export const videoAudioTool: Tool<typeof inputSchema> = {
  name: "video:audio",
  description:
    "Extrai a trilha de áudio de um vídeo, salvando em mp3/wav/aac/flac/ogg.",
  dangerous: true,
  inputSchema,
  execute: async (input) => {
    if (!fs.existsSync(input.input)) {
      throw new Error(`Arquivo de entrada não encontrado: ${input.input}`);
    }
    const outputDir = path.dirname(input.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    return new Promise<{ output: string; sizeBytes: number }>((resolve, reject) => {
      ffmpeg(input.input)
        .noVideo()
        .audioCodec("libmp3lame")
        .audioBitrate(input.bitrate)
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
