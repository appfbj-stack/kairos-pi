/**
 * video:probe — lê metadados de um vídeo (duração, codec, resolução).
 *
 * Não é destrutivo, apenas leitura.
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "node:fs";

ffmpeg.setFfmpegPath(ffmpegPath as unknown as string);

const inputSchema = z.object({
  input: z.string().describe("Caminho do vídeo"),
});

export interface VideoMetadata {
  durationSec: number;
  bitrate: number;
  format: string;
  videoCodec: string | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  audioCodec: string | null;
  audioSampleRate: number | null;
  audioChannels: number | null;
}

export const videoProbeTool: Tool<typeof inputSchema> = {
  name: "video:probe",
  description:
    "Lê metadados de um vídeo: duração, codec de vídeo/áudio, resolução, fps, bitrate. Use para entender o arquivo antes de processar.",
  dangerous: false,
  inputSchema,
  execute: async (input): Promise<VideoMetadata> => {
    if (!fs.existsSync(input.input)) {
      throw new Error(`Arquivo não encontrado: ${input.input}`);
    }

    return new Promise<VideoMetadata>((resolve, reject) => {
      ffmpeg.ffprobe(input.input, (err, data) => {
        if (err) return reject(err);

        const videoStream = data.streams.find((s) => s.codec_type === "video");
        const audioStream = data.streams.find((s) => s.codec_type === "audio");

        let fps: number | null = null;
        if (videoStream?.r_frame_rate) {
          const parts = videoStream.r_frame_rate.split("/").map(Number);
          const num = parts[0];
          const den = parts[1];
          if (num !== undefined && den !== undefined && den !== 0) {
            fps = num / den;
          }
        }

        resolve({
          durationSec: data.format.duration ?? 0,
          bitrate: data.format.bit_rate ?? 0,
          format: data.format.format_name ?? "unknown",
          videoCodec: videoStream?.codec_name ?? null,
          width: videoStream?.width ?? null,
          height: videoStream?.height ?? null,
          fps,
          audioCodec: audioStream?.codec_name ?? null,
          audioSampleRate: audioStream?.sample_rate
            ? Number(audioStream.sample_rate)
            : null,
          audioChannels: audioStream?.channels ?? null,
        });
      });
    });
  },
};
