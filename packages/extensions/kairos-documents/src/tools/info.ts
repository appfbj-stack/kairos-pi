/**
 * docs:info — lê metadados de um .docx.
 *
 * Usa mammoth para extrair texto rápido, e parseia o ZIP do .docx
 * para ler core.xml (metadata).
 */

import { z } from "zod";
import type { Tool } from "@kairos/agent";
import fs from "node:fs/promises";
import JSZip from "jszip";
import { ensureAllowed } from "../safety.js";

const inputSchema = z.object({
  path: z.string().describe("Caminho absoluto do .docx"),
});

export const infoTool: Tool<typeof inputSchema> = {
  name: "docs:info",
  description:
    "Lê metadados de um .docx: autor, título, data de criação, contagem de parágrafos e palavras.",
  dangerous: false,
  inputSchema,
  execute: async (input) => {
    const abs = ensureAllowed(input.path);
    const buffer = await fs.readFile(abs);
    const zip = await JSZip.loadAsync(buffer);
    const coreXml = await zip.file("docProps/core.xml")?.async("text");
    const docXml = await zip.file("word/document.xml")?.async("text");

    const meta = parseCoreXml(coreXml ?? "");
    const text = docXml ? extractText(docXml) : "";

    return {
      path: abs,
      sizeBytes: buffer.byteLength,
      title: meta.title,
      author: meta.creator,
      createdAt: meta.created,
      modifiedAt: meta.modified,
      description: meta.description,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      paragraphCount: (docXml?.match(/<w:p\b/g) ?? []).length,
    };
  },
};

function parseCoreXml(xml: string): {
  title: string | null;
  creator: string | null;
  created: string | null;
  modified: string | null;
  description: string | null;
} {
  const get = (tag: string): string | null => {
    const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    return m && m[1] ? m[1].trim() : null;
  };
  return {
    title: get("dc:title"),
    creator: get("dc:creator"),
    created: get("dcterms:created"),
    modified: get("dcterms:modified"),
    description: get("dc:description"),
  };
}

function extractText(xml: string): string {
  // Extrai texto entre <w:t>...</w:t> e junta
  const matches = xml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) ?? [];
  return matches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ");
}
