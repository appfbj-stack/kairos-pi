# @kairos/extension-video

Kairós video tools — extensão que adiciona 4 tools de vídeo ao agente Kairós Desktop Alves.

## Tools expostas

| Tool | O que faz | Destrutiva? |
|---|---|---|
| `video:convert` | Converte vídeo para outro formato (mp4, webm, mov, mkv, avi) com controle de qualidade CRF | ⚠️ sim |
| `video:trim` | Corta trecho do vídeo (start + duration) | ⚠️ sim |
| `video:probe` | Lê metadados (duração, codec, resolução, fps, bitrate) | ❌ não |
| `video:audio` | Extrai trilha de áudio (mp3, wav, aac, flac, ogg) | ⚠️ sim |

## Stack

- `ffmpeg-static` — binário ffmpeg empacotado, sem dependência externa
- `fluent-ffmpeg` — wrapper amigável em cima do ffmpeg

## Como o agente usa

Quando o usuário fala **"Converta esses vídeos para MP4"**, o agente:

1. Entende a intenção
2. Localiza a tool `video:convert` no ToolRegistry
3. Pede confirmação (via `pi-nolo`) porque é destrutiva
4. Executa via ffmpeg
5. Retorna o caminho do arquivo gerado

## Como adicionar a extensão ao agent

```ts
import { Agent } from "@kairos/agent";
import kairosVideo from "@kairos/extension-video";

const agent = new Agent("...", config);
registerExtension(agent.tools, kairosVideo);
```

## Próximos passos

- Adicionar `video:thumbnail` — extrai frame de um vídeo
- Adicionar `video:gif` — converte trecho em GIF animado
- Adicionar `video:concat` — junta vários vídeos
