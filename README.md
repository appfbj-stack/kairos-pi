# Kairós Desktop Alves

> **Você pede. O Kairós faz.**

Agente de IA desktop para Windows, controlado por linguagem natural. Usuário leigo fala, o agente usa o computador por ele (arquivos, planilhas, PDFs, Word, imagens, vídeo, web).

## Estado atual

**Sprint 0 — Fundação.** Esqueleto de monorepo criado. App Electron abre a janela "Kairós Desktop Alves" com UI de chat minimalista. Sem loop LLM ainda — vem na Sprint 1.

## Stack

- **Shell:** Electron 33 + React 18 + Vite 5 + Tailwind 3
- **Agente:** TypeScript / Node, modelado no [Pi Agent](https://github.com/earendil-works/pi) (sem fork)
- **Workspace:** pnpm 10 + Node 24
- **Banco:** better-sqlite3 (SQLite local)
- **i18n:** i18next com PT-BR como default
- **Logger:** pino

## Estrutura

```
kairos-pi/
├── apps/electron/         # Shell desktop (Electron + React)
├── packages/agent/        # Núcleo (modelado no Pi Agent)
├── packages/core/         # DB, i18n, logger
├── docs/                  # PRD, briefing, ADRs
├── extensions/            # REFERÊNCIA — pi-git-commands original (não roda)
├── package.json           # workspace root
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Setup local

```bash
# Requer Node 24+ e pnpm 10+
nvm use 24            # ou nvm-windows
corepack enable       # se pnpm não estiver instalado
pnpm install
pnpm dev              # abre o Electron + Vite
```

## Documentos de produto

- [PRD-v1.0.md](docs/PRD-v1.0.md) — visão, requisitos, MVP
- [BRIEFING-PARA-MINIMAX.md](docs/BRIEFING-PARA-MINIMAX.md) — briefing técnico pro time
- [ADR/0001-modelado-no-pi-nao-forkado.md](docs/ADR/0001-modelado-no-pi-nao-forkado.md) — decisão arquitetural

## Princípios

1. Preservar a estrutura conceitual do Pi Agent.
2. Não criar dashboards complexos — a interface é o chat.
3. Tudo local (arquivos, banco). Nuvem só quando o usuário pedir.
4. Confirmação para ações destrutivas.
5. i18n PT-BR desde o dia 1.
