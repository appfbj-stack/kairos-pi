# @kairos/extension-images

Kairós image tools — **processamento local de imagens** usando `sharp` (libvips). Tudo roda no computador do usuário, sem upload pra servidor.

## Tools expostas

| Tool | O que faz | Destrutiva? |
|---|---|---|
| `images:info` | Metadados (largura, altura, formato, channels, EXIF) | ❌ não |
| `images:resize` | Redimensiona (cover, contain, fill, inside, outside) | ⚠️ sim |
| `images:convert` | Converte formato (jpg, png, webp, avif, gif, tiff) | ⚠️ sim |
| `images:compress` | Comprime preservando formato (mozjpeg, webp, avif, png) | ⚠️ sim |
| `images:transform` | rotate, flip, crop (combináveis) | ⚠️ sim |

## Stack

- **`sharp`** — wrapper moderno de libvips. Extremamente rápido (processa JPEG 10× mais rápido que ImageMagick).
  - Bindings nativos pré-compilados (não precisa build no usuário)

## Exemplos de uso

Quando o usuário fala **"Redimensione essa foto pra 800px de largura"**:
- → `images:resize` com `width: 800, fit: "inside"`

Quando fala **"Converta pra WebP"**:
- → `images:convert` com output `.webp`

Quando fala **"Comprime essa imagem"**:
- → `images:compress` com `quality: 70`

## Diferencial arquitetural

- **100% local** — nenhuma imagem sai do PC do usuário (PRD §18 privacidade)
- **Sem dependência do sistema** — `sharp` é self-contained, com binários pré-compilados pra Windows
- **Rápido** — processa 4K JPEG em ~50ms

## Próximas evoluções

- `images:thumbnail` — gera thumbnails em batch com tamanho fixo
- `images:watermark` — adiciona marca d'água
- `images:to-base64` — converte pra data URL
- `images:ocr` — extrai texto (usaria Tesseract.js)
- **Fase 2:** `images:generate` via provider (DALL-E, etc) — exige API key
