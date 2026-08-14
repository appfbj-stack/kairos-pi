/**
 * Gera o ícone do Kairós Desktop Alves para o instalador.
 *
 * Saídas:
 *   - build/icon.png    (256x256) — ícone principal
 *   - build/icon.ico    (256x256 multi-res) — instalador NSIS
 *
 * Design: ampulheta (relógio de areia) representando Kairós — a deusa grega
 * do "tempo oportuno". Fundo com gradiente emerald-500, ampulheta em branco
 * com areia caindo, dois pilares de madeira como acabamento.
 */

import sharp from "sharp";
import pngToIco from "png-to-ico";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SIZE = 256;
const FG = "#ffffff";
const WOOD = "#fde68a"; // amber-200 (acabamento)
const SAND = "#fef3c7"; // amber-100 (areia)

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${SAND}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${SAND}" stop-opacity="0.7"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Fundo rounded -->
  <rect width="${SIZE}" height="${SIZE}" rx="48" fill="url(#bg)"/>
  <rect width="${SIZE}" height="${SIZE}" rx="48" fill="url(#glow)"/>

  <!-- Pilares de madeira (top e bottom) -->
  <rect x="56" y="40" width="144" height="14" rx="3" fill="${WOOD}"/>
  <rect x="56" y="202" width="144" height="14" rx="3" fill="${WOOD}"/>

  <!-- Perna de cima: areia quase cheia -->
  <path
    d="M 76 64 L 180 64 L 128 128 Z"
    fill="url(#sand)"
    stroke="${FG}"
    stroke-width="3"
    stroke-linejoin="round"
  />

  <!-- Perna de baixo: areia acumulada -->
  <path
    d="M 86 206 L 170 206 L 152 178 Q 128 168 104 178 Z"
    fill="url(#sand)"
    stroke="${FG}"
    stroke-width="3"
    stroke-linejoin="round"
  />

  <!-- Ampulheta: contornos externos (formato ampulheta) -->
  <path
    d="M 72 60 L 184 60 L 132 128 L 184 196 L 72 196 L 124 128 Z"
    fill="none"
    stroke="${FG}"
    stroke-width="6"
    stroke-linejoin="round"
    stroke-linecap="round"
  />

  <!-- Areia caindo: linha vertical fina -->
  <line x1="128" y1="128" x2="128" y2="170" stroke="${FG}" stroke-width="2" stroke-linecap="round" opacity="0.9"/>

  <!-- Grão de areia caindo -->
  <circle cx="128" cy="150" r="2" fill="${FG}"/>
  <circle cx="128" cy="160" r="1.5" fill="${FG}"/>

  <!-- Detalhe de areia no topo (saliência) -->
  <path
    d="M 80 70 Q 128 60 176 70"
    fill="none"
    stroke="${FG}"
    stroke-width="1.5"
    stroke-linecap="round"
    opacity="0.5"
  />
</svg>
`.trim();

const pngBuf = await sharp(Buffer.from(svg))
  .png()
  .toBuffer();

const pngPath = path.join(__dirname, "icon.png");
await writeFile(pngPath, pngBuf);
console.log(`✓ ${pngPath} (${pngBuf.length} bytes)`);

// ICO multi-resolução (16, 32, 48, 64, 128, 256)
const sizes = [16, 32, 48, 64, 128, 256];
const pngBuffers = await Promise.all(
  sizes.map((s) =>
    sharp(Buffer.from(svg))
      .resize(s, s)
      .png()
      .toBuffer()
  )
);
const icoBuf = await pngToIco(pngBuffers);
const icoPath = path.join(__dirname, "icon.ico");
await writeFile(icoPath, icoBuf);
console.log(`✓ ${icoPath} (${icoBuf.length} bytes)`);

console.log("\n🕰️  Ícone Kairós (ampulheta) gerado com sucesso.");
