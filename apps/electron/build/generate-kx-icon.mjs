/**
 * Gera o icone do KX (Kairos Tecnologia) com ampulheta em SVG,
 * renderiza via sharp e converte para .ico multi-res.
 *
 * Substitui o generate-icon.mjs (que usava composicao simples emerald).
 * Inspirado no logo oficial: circulo azul + KX dourado/azul + ampulheta cristal.
 */

import sharp from "sharp";
import pngToIco from "png-to-ico";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SVG_PATH = join(__dirname, "kx-logo.svg");
const PNG_PATH = join(__dirname, "icon.png");
const ICO_PATH = join(__dirname, "icon.ico");

/** SVG do logo: 1024x1024, viewBox para escalonar. */
const SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <!-- Gradiente do circulo externo (azul royal) -->
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="50%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#0a1a4a"/>
    </linearGradient>

    <!-- Gradiente do fundo interno (navy escuro) -->
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="60%" stop-color="#0a1a4a"/>
      <stop offset="100%" stop-color="#000814"/>
    </radialGradient>

    <!-- Gradiente dourado metalico (letras e ampulheta) -->
    <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="30%" stop-color="#fbbf24"/>
      <stop offset="60%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>

    <linearGradient id="goldBright" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="50%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>

    <!-- Ampulheta de cristal: gradiente que simula reflexo -->
    <linearGradient id="glass" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#dbeafe" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#60a5fa" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#1e40af" stop-opacity="0.7"/>
    </linearGradient>

    <!-- Areia dourada da ampulheta -->
    <linearGradient id="sand" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>

    <!-- Brilho/glow no centro -->
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#fbbf24" stop-opacity="0"/>
    </radialGradient>

    <!-- Filtro glow para o KX -->
    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Anel externo azul royal -->
  <circle cx="512" cy="512" r="500" fill="url(#ringGrad)" stroke="#fbbf24" stroke-width="6"/>

  <!-- Fundo interno navy -->
  <circle cx="512" cy="512" r="430" fill="url(#bgGrad)"/>

  <!-- Circuitos decorativos (linhas tech) -->
  <g stroke="#3b82f6" stroke-width="2" fill="none" opacity="0.5">
    <path d="M 100 300 L 200 300 L 220 280 L 280 280"/>
    <circle cx="100" cy="300" r="6" fill="#3b82f6" opacity="0.8"/>
    <circle cx="280" cy="280" r="4" fill="#3b82f6" opacity="0.8"/>

    <path d="M 924 700 L 824 700 L 804 720 L 744 720"/>
    <circle cx="924" cy="700" r="6" fill="#3b82f6" opacity="0.8"/>
    <circle cx="744" cy="720" r="4" fill="#3b82f6" opacity="0.8"/>

    <path d="M 120 700 L 180 700 L 200 680"/>
    <circle cx="120" cy="700" r="5" fill="#60a5fa" opacity="0.7"/>
    <circle cx="200" cy="680" r="3" fill="#60a5fa" opacity="0.7"/>

    <path d="M 904 320 L 844 320 L 824 340"/>
    <circle cx="904" cy="320" r="5" fill="#60a5fa" opacity="0.7"/>
    <circle cx="824" cy="340" r="3" fill="#60a5fa" opacity="0.7"/>
  </g>

  <!-- Glow dourado no centro -->
  <circle cx="512" cy="512" r="320" fill="url(#glow)"/>

  <!-- ===== LETRAS K e X estilizadas (monograma) ===== -->
  <!-- Letra K dourada (atras) -->
  <g filter="url(#glowFilter)">
    <path d="M 240 200
             L 320 200
             L 320 380
             L 460 200
             L 560 200
             L 400 410
             L 580 820
             L 480 820
             L 360 540
             L 320 590
             L 320 820
             L 240 820
             Z"
          fill="url(#gold)" stroke="#92400e" stroke-width="4" stroke-linejoin="round"/>
  </g>

  <!-- Letra X azul royal (frente, sobreposta) -->
  <g filter="url(#glowFilter)">
    <path d="M 480 200
             L 580 200
             L 660 360
             L 740 200
             L 840 200
             L 720 440
             L 840 680
             L 740 680
             L 660 510
             L 580 680
             L 480 680
             L 600 440
             Z"
          fill="#3b82f6" stroke="#1e3a8a" stroke-width="4" stroke-linejoin="round"
          opacity="0.85"/>
  </g>

  <!-- ===== AMPULHETA de cristal no centro ===== -->
  <g>
    <!-- Capsula superior (bola) -->
    <ellipse cx="512" cy="380" rx="110" ry="130" fill="url(#glass)" stroke="#fbbf24" stroke-width="5"/>
    <!-- Capsula inferior (bola) -->
    <ellipse cx="512" cy="644" rx="110" ry="130" fill="url(#glass)" stroke="#fbbf24" stroke-width="5"/>

    <!-- Hastes laterais (topo e base) -->
    <rect x="402" y="200" width="220" height="20" fill="url(#goldBright)" stroke="#92400e" stroke-width="3" rx="4"/>
    <rect x="402" y="804" width="220" height="20" fill="url(#goldBright)" stroke="#92400e" stroke-width="3" rx="4"/>

    <!-- Pesco�o (conexao) -->
    <path d="M 470 510 L 460 525 L 512 530 L 564 525 L 554 510 Z" fill="url(#gold)" stroke="#92400e" stroke-width="2"/>

    <!-- Areia superior (descendo) -->
    <path d="M 412 380
             Q 512 460 612 380
             L 612 320
             Q 512 380 412 320
             Z"
          fill="url(#sand)"/>
    <!-- Cone de areia descendo -->
    <path d="M 480 480 L 544 480 L 530 510 L 494 510 Z" fill="url(#sand)" opacity="0.9"/>

    <!-- Areia inferior (acumulada) -->
    <path d="M 412 644
             Q 512 600 612 644
             L 612 720
             Q 512 760 412 720
             Z"
          fill="url(#sand)"/>
    <!-- Picos de areia acumulada -->
    <path d="M 450 644 Q 480 620 512 640 Q 544 620 574 644 L 574 660 L 450 660 Z" fill="url(#sand)"/>

    <!-- Reflexo/brilho na capsula superior -->
    <ellipse cx="475" cy="335" rx="25" ry="45" fill="#ffffff" opacity="0.35"/>
    <!-- Reflexo na capsula inferior -->
    <ellipse cx="475" cy="600" rx="25" ry="45" fill="#ffffff" opacity="0.35"/>
  </g>
</svg>`;

async function main() {
  await mkdir(__dirname, { recursive: true });

  // Salva SVG
  await writeFile(SVG_PATH, SVG, "utf8");
  console.log("OK  SVG salvo:", SVG_PATH);

  // SVG -> PNG 1024x1024
  const pngBuffer = await sharp(Buffer.from(SVG))
    .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await writeFile(PNG_PATH, pngBuffer);
  console.log("OK  PNG salvo:", PNG_PATH, `(${pngBuffer.length} bytes)`);

  // PNG -> ICO multi-res (16, 32, 48, 64, 128, 256)
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = await Promise.all(
    sizes.map(async (size) => {
      return await sharp(Buffer.from(SVG))
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    })
  );
  const icoBuffer = await pngToIco(pngBuffers);
  await writeFile(ICO_PATH, icoBuffer);
  console.log("OK  ICO salvo:", ICO_PATH, `(${icoBuffer.length} bytes, sizes: ${sizes.join(",")})`);

  console.log("\nPronto! Icones gerados em apps/electron/build/");
  console.log("  - icon.png  (1024x1024)");
  console.log("  - icon.ico  (multi-res 16..256)");
}

main().catch((err) => {
  console.error("ERRO:", err);
  process.exit(1);
});
