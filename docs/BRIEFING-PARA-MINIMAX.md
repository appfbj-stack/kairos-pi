# BRIEFING — Kairos Desktop Alves (kairos-pi)

**Para:** time MiniMax (desenvolvimento)
**Origem:** Mavis (assistente do Pastor Fernando Borges)
**Data:** 2026-08-12
**Status:** briefing técnico travado. Ler junto com `PRD-v1.0.md` (mesmo diretório).

---

## 0. TL;DR (leia isso primeiro)

- **Nome do produto:** **Kairós Desktop Alves** (app) / **`kairos-pi`** (pacote npm / instalador).
- **Tipo:** agente de IA desktop para Windows, controle por chat.
- **Base técnica:** o repo [`appfbj-stack/kairos-pi`](https://github.com/appfbj-stack/kairos-pi.git) é o ponto de partida. Hoje ele contém uma **extensão do Pi Agent** chamada `pi-git-commands` (fork do `helloHupc/pi-git-commands`). Ela **não é a base do app** — é **referência de como a API do Pi funciona** (loop, comandos, extensões, tools).
- **O que construir:** um agente desktop completo, em TypeScript, com shell Electron, que **usa a estrutura do Pi** como referência arquitetural. O Pi Agent (`@earendil-works/pi-coding-agent`) é o **modelo mental** a seguir — não reescrever do zero, não reinventar o loop.
- **NÃO é fork de Hermes Agent, NÃO é fork de Pi Agent completo.** Projeto greenfield, escrito do zero, **dentro** do repo `appfbj-stack/kairos-pi`. A `pi-git-commands` que está lá é só material de leitura.

---

## 1. Onde trabalhar

| O quê | Onde |
|---|---|
| Repo oficial | `https://github.com/appfbj-stack/kairos-pi` (branch `main`) |
| Pastas a criar | `apps/electron/` (shell), `packages/agent/` (núcleo), `packages/extensions/*` (ferramentas), `docs/` |
| Pasta a manter como referência | `extensions/` (a `pi-git-commands` original — não deletar, é exemplo vivo da API do Pi) |
| Pasta a NÃO usar como base | nada do `extensions/` deve virar código de produção. É só leitura. |
| Documentos de produto | `docs/PRD-v1.0.md` (PRD do Pastor) + `docs/BRIEFING-PARA-MINIMAX.md` (este arquivo) |
| Idioma dos commits/PRs | inglês |
| Idioma da UI | PT-BR (default) |
| Idioma do código/identificadores | inglês |

---

## 2. Arquitetura proposta

```
kairos-pi/
├── extensions/                       ← REFERÊNCIA (manter, não modificar)
│   ├── index.ts                      # exemplo de pi-git-commands
│   └── prompts.ts
│
├── apps/
│   └── electron/                     ← shell desktop (Electron + React + Vite)
│       ├── src/
│       │   ├── main/                 # processo principal
│       │   │   ├── index.ts          # entrypoint Electron
│       │   │   ├── ipc.ts            # bridge Electron ↔ Agent
│       │   │   └── window.ts
│       │   ├── renderer/             # UI React (chat minimalista)
│       │   │   ├── App.tsx
│       │   │   ├── components/
│       │   │   └── i18n/pt-BR.json
│       │   └── preload/
│       └── package.json
│
├── packages/
│   ├── agent/                        ← núcleo (modelado no Pi Agent)
│   │   ├── src/
│   │   │   ├── loop.ts               # loop: user → plan → tool → result → user
│   │   │   ├── tools/
│   │   │   ├── extensions/
│   │   │   ├── llm/
│   │   │   ├── memory/
│   │   │   └── permissions/
│   │   └── package.json
│   │
│   ├── extensions/
│   │   ├── kairos-files/             # criar/mover/copiar/renomear/excluir
│   │   ├── kairos-spreadsheets/      # xlsx/xls/csv
│   │   ├── kairos-pdf/               # ler/criar PDFs
│   │   ├── kairos-documents/         # docx
│   │   ├── kairos-images/            # sharp + geração via provider
│   │   ├── kairos-video/             # ffmpeg wrapper
│   │   └── kairos-browser/           # (fase 2) playwright
│   │
│   └── core/
│       ├── db/                       # better-sqlite3 wrapper
│       ├── i18n/                     # i18next + PT-BR
│       └── logger/
│
├── docs/
│   ├── PRD-v1.0.md
│   ├── BRIEFING-PARA-MINIMAX.md      ← este arquivo
│   ├── ADR/                          # architecture decision records
│   └── CHANGELOG.md
│
├── package.json                      # workspace root (pnpm)
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

**Filosofia:** a estrutura é deliberadamente parecida com a do Pi Agent (`@earendil-works/pi-coding-agent`). Quem estudou o Pi vai reconhecer:
- `packages/agent/src/loop.ts` ≈ `pi-coding-agent` runtime loop
- `packages/agent/src/tools/` ≈ tool registry do Pi
- `packages/agent/src/extensions/` ≈ extension API do Pi
- `packages/agent/src/permissions/` ≈ confirmação destrutiva (seção 28 do PRD)

**A MiniMax deve ler a API do Pi Agent** antes de codar (`https://github.com/earendil-works/pi`), mesmo sem forkear. É referência conceitual.

---

## 3. Stack travado

| Camada | Escolha | Por que |
|---|---|---|
| Shell desktop | **Electron** | Reusa bem o agente TS/Node, sem bridge. Decidido com Pastor. |
| UI | **React 18 + Vite + Tailwind + Shadcn UI** | Padrão já usado em outros apps do Pastor. |
| Núcleo agente | **TypeScript puro**, modelado no Pi Agent | Preserva a referência arquitetural sem forkear. |
| Banco | **better-sqlite3** | Sync, rápido, sem native build pesado. |
| Planilhas | exceljs (xlsx) + xlsx-stream-reader (xls) + papaparse (csv) | Maduros. |
| PDF leitura | pdf-parse + pdfjs-dist | Texto + tabelas. |
| PDF criação | pdfkit | Leve, sem browser embutido. |
| Word | docx | Padrão de mercado. |
| Imagens | sharp | Processamento local rápido. |
| Vídeos | ffmpeg-static | Binário empacotado, sem dep do sistema. |
| Browser (fase 2) | playwright | Robusto. |
| Empacotamento | electron-builder | Gera `.exe` instalador. |
| Auto-update | electron-updater | Integrado ao electron-builder. |
| Testes | vitest + @testing-library/react + playwright | Padrão moderno TS. |
| Monorepo | pnpm workspaces | Leve, rápido, sem npm/yarn. |
| Linter/Format | eslint + prettier + tsc strict | Padrão. |

---

## 4. Como o agente conversa com a UI

A UI manda comandos via IPC pro processo Electron, que delega pro `agent`. Padrão:

```ts
// renderer → preload → main → agent
ipcMain.handle('chat:send', async (_e, msg) => {
  return agent.handle(msg, { sessionId, userId });
});

// agent → main → renderer (eventos)
agent.on('progress', (step) => mainWindow.webContents.send('chat:progress', step));
agent.on('tool:call', (tool) => mainWindow.webContents.send('chat:tool', tool));
agent.on('message', (msg) => mainWindow.webContents.send('chat:message', msg));
agent.on('done', () => mainWindow.webContents.send('chat:done'));
```

O `agent` expõe:
- `handle(message, ctx) → AsyncIterable<AgentEvent>`
- `registerExtension(ext)`
- `registerTool(tool)`
- `stop(sessionId)` (botão ⏹ Parar execução)
- `confirmDangerous(action) → Promise<boolean>` (popup no renderer)

---

## 5. Sistema de extensões (referência: Pi Agent)

Cada extensão em `packages/extensions/kairos-*/` é um pacote TS com:

```ts
export default {
  name: 'kairos-spreadsheets',
  version: '0.1.0',
  tools: [
    {
      name: 'spreadsheet:read',
      description: 'Lê células de um arquivo .xlsx/.xls/.csv',
      inputSchema: { ...zod },
      execute: async (input, ctx) => { ... },
      dangerous: false,
    },
    ...
  ],
  skills: ['skills/spreadsheet/SKILL.md'],
  config: { defaultSheet: 'Plan1' },
};
```

A `extensions/pi-git-commands` (no root) é mantida como **exemplo canônico** de como uma extensão se parece. Não compila nem roda no produto — é só referência de leitura.

---

## 6. Sprints sugeridos (MiniMax pode ajustar)

### Sprint 0 — Fundação (bloqueante)
- [ ] Ler e estudar a API do `@earendil-works/pi-coding-agent`.
- [ ] Decidir workspace layout (pnpm workspaces, conforme seção 2).
- [ ] Setup: `package.json` root, `tsconfig.base.json`, ESLint, Prettier.
- [ ] Hello world: Electron abre janela com "Kairós Desktop Alves" no título.
- [ ] ADR-001: confirmar a abordagem "modelado no Pi, não forkado".

### Sprint 1 — Agente mínimo
- [ ] `packages/agent/src/loop.ts`: loop básico user → LLM → user.
- [ ] Suporte a 3 providers: OpenRouter, OpenAI, MiniMax.
- [ ] Persistência de conversa em SQLite (`kairos.db`).
- [ ] Chat UI funcional: input, histórico, indicador "digitando...".
- [ ] Botão ⏹ Parar execução funciona.

### Sprint 2 — Tools de arquivo + Sheets
- [ ] `kairos-files`: criar/mover/copiar/renomear/excluir/listar.
- [ ] `kairos-spreadsheets`: ler/criar/editar xlsx/csv.
- [ ] Confirmação para ações destrutivas (popup).
- [ ] Anexos de arquivo no chat.

### Sprint 3 — PDF + Word
- [ ] `kairos-pdf`: ler texto, ler tabelas, criar PDFs.
- [ ] `kairos-documents`: criar/editar .docx.
- [ ] Tarefa composta: "Leia esses PDFs e gere uma planilha" funciona ponta a ponta.

### Sprint 4 — Imagens + Vídeo
- [ ] `kairos-images`: redimensionar, converter, geração via provider.
- [ ] `kairos-video`: wrapper ffmpeg (conversão, corte).

### Sprint 5 — Empacotamento
- [ ] electron-builder → `Kairos-Desktop-Alves-Setup.exe`.
- [ ] Ícone, splash, identidade visual (Kairós).
- [ ] Auto-update opcional.
- [ ] Smoke test Windows 10 + 11.

### Fase 2 (depois do MVP)
- Browser (playwright).
- Servidor de licença.
- Gateway de IA + créditos.
- Multi-idioma (EN, ES).

---

## 7. Decisões já travadas (não voltar a perguntar)

1. **Base:** o repo `appfbj-stack/kairos-pi`. A `extensions/pi-git-commands` é referência, não código de produção.
2. **Stack:** Electron + React + Vite + Tailwind + Shadcn. TypeScript estrito.
3. **Linguagem do agente:** TypeScript / Node.
4. **Nome do pacote:** `kairos-pi`.
5. **Nome do app:** Kairós Desktop Alves.
6. **NÃO é fork de Hermes.** NÃO é fork de Pi Agent completo.
7. **Extensões de referência no repo:** manter, não deletar, não modificar.

---

## 8. Dúvidas que ainda vão surgir (não bloqueiam Sprint 0)

| # | Pergunta | Quando travar |
|---|---|---|
| Q1 | i18n só PT-BR ou bilíngue? | Sprint 1 |
| Q2 | Onde fica `kairos.db` por padrão? | Sprint 1 |
| Q3 | Como usuário configura API key na primeira execução? | Sprint 1 |
| Q4 | Comportamento sem internet? | Sprint 1 |
| Q5 | Servidor de licença no MVP ou fase 2? | Sprint 5 |
| Q6 | Auto-update obrigatório? | Sprint 5 |
| Q7 | Paleta de cores definitiva (atualmente slate-900 + emerald-500 + amber-500, do profile antigo) | Sprint 0 |

Quando chegar a hora, voltar pro Pastor via Mavis.

---

## 9. Restrições inegociáveis

1. **Preservar a estrutura conceitual do Pi** (loop, tools, extensions) — é a referência, mesmo sem forkear.
2. **Não criar dashboards complexos.** A interface é o chat. Ponto.
3. **Não usar cloud obrigatório.** Tudo que é arquivo/banco fica local.
4. **Confirmação para ações destrutivas** (rm, format, del, overwrite) — popup antes de executar.
5. **i18n PT-BR desde o dia 1.** Toda string em arquivo de tradução.
6. **Testes para tools críticas** (arquivo, planilha, PDF, Word).
7. **Conventional Commits em inglês** (`feat:`, `fix:`, etc.).
8. **PRs pequenos** (<500 linhas). PRs grandes precisam de aprovação antes.
9. **Documentar** toda decisão arquitetural em `docs/ADR/`.
10. **Demo gravada (Loom ou similar)** ao final de cada sprint, pro Pastor validar.

---

## 10. Quem é o Pastor (contexto pra MiniMax)

- **Fernando Borges**, pastor, lidera uma rede de igrejas.
- Trabalha com LLMs como ferramenta de desenvolvimento — **não escreve código diretamente**. PRDs em PT-BR, valida o resultado.
- Aprova pushes/deploys após demo.
- Prefere respostas claras, com seções numeradas, sem enrolação.
- O briefing foi escrito por Mavis (eu), assistente dele. Dúvidas técnicas voltam por aqui.

---

## 11. Referências

- PRD: `docs/PRD-v1.0.md`
- Repo de trabalho: https://github.com/appfbj-stack/kairos-pi
- Extensão de referência (Pi): `extensions/pi-git-commands` (dentro do repo)
- API do Pi Agent: https://github.com/earendil-works/pi (referência conceitual, NÃO fork)
- Padrão visual do ecossistema Kairós: skill `kairos-frontend` (Shadcn UI + Tailwind)

---

## 12. API do Pi Agent — referência oficial (lida pelo Pastor em https://pi.dev/docs/latest)

A MiniMax **deve ler essas páginas antes de codar a Sprint 0**. Cada link abaixo diz exatamente o que extrair:

### 12.1 Quickstart
→ https://pi.dev/docs/latest/quickstart
- Como rodar o Pi pela primeira vez.
- Como autenticar com providers (Anthropic, OpenAI, OpenRouter).

### 12.2 Extensions (essencial)
→ https://pi.dev/docs/latest/extensions
- **API TypeScript** para tools, slash commands, events, custom UI.
- A `extensions/pi-git-commands` no nosso repo é um exemplo real de extensão. Compare com a doc.

### 12.3 Skills (essencial)
→ https://pi.dev/docs/latest/skills
- Agent Skills = capacidades reutilizáveis sob demanda.
- Será a base do nosso `packages/extensions/kairos-*/skills/`.

### 12.4 Pi Packages (essencial)
→ https://pi.dev/docs/latest/packages
- Como bundlar e compartilhar extensões + skills + prompts + themes.
- É o padrão de empacotamento que vamos seguir.

### 12.5 SDK — o que destrava o Electron (CRUCIAL)
→ https://pi.dev/docs/latest/sdk
- **Embedar o Pi como lib dentro de uma aplicação Node.js.**
- É exatamente o que precisamos pra rodar o Pi dentro do processo main do Electron, sem CLI.
- O agente expõe uma API que a UI chama via IPC.

### 12.6 RPC Mode (alternativa ao SDK)
→ https://pi.dev/docs/latest/rpc
- Roda o Pi como subprocesso e conversa via stdin/stdout JSONL.
- Mais leve que o SDK, mas exige processo separado e bridge.
- Decidir entre SDK e RPC na Sprint 0 (recomendação: **SDK**, é mais limpo).

### 12.7 JSON Event Stream Mode
→ https://pi.dev/docs/latest/json
- Print mode com eventos estruturados.
- Útil pra logging e auditoria.

### 12.8 Session Format
→ https://pi.dev/docs/latest/session-format
- Formato JSONL das sessões do Pi.
- Base do nosso `kairos.db` (SQLite vai persistir conversas no mesmo formato conceitual).

### 12.9 Providers
→ https://pi.dev/docs/latest/providers
- Setup de Anthropic / OpenAI / outros providers.
- **Para o MVP, queremos suportar: OpenRouter, OpenAI, MiniMax.** Estudar como adicionar providers custom.

### 12.10 Custom Providers
→ https://pi.dev/docs/latest/custom-provider
- Como implementar APIs customizadas e fluxos OAuth.
- Vai ser necessário pra integrar o **MiniMax provider** e o **gateway de IA Kairos** (fase 2).

### 12.11 Security
→ https://pi.dev/docs/latest/security
- Confiança de projeto, sandbox, vulnerabilidades.
- **Mapeia direto com a seção 28 do PRD** (confirmação de ações destrutivas, permissões, logs).

### 12.12 TUI Components
→ https://pi.dev/docs/latest/tui
- Componentes de terminal pra extensões.
- Útil se a MiniMax quiser reaproveitar algo na UI (improvável, mas vale conhecer).

### 12.13 Development
→ https://pi.dev/docs/latest/development
- Setup local, estrutura do projeto, debug.

---

## 13. Catálogo de extensões prontas do Pi (instalar, não escrever)

**Regra de ouro:** antes de escrever qualquer extensão custom, a MiniMax **deve verificar se já existe um pi-package que resolve o problema**. O catálogo oficial tem 5.604 packages — e crescendo. Listei aqui as que **casam diretamente com coisas do PRD**. Cada uma é instalada com `pi install npm:<pacote>` (ou direto no `package.json` quando embed via SDK).

### 13.1 Pacotes que JÁ RESOLVEM problemas do PRD

| Pi Package | Downloads | O que faz | Casa com seção do PRD |
|---|---|---|---|
| **`pi-mcp-adapter`** | 354K/mês | Adapter do Model Context Protocol (MCP). Conecta o Pi a QUALQUER servidor MCP do ecossistema — automaticamente herda milhares de tools. | §5 (ferramentas), §12 (browser) |
| **`pi-web-access`** | 222K/mês | Web search, fetch de URL, clone de repos, **extração de PDF**, YouTube, vídeo local. | §8 (PDF leitura), §10, §11, §12 |
| **`pi-nolo`** | recente | **No-YOLO mode**: gate de write/edit/bash atrás de confirmação + allowlist de comandos seguros. | §16, §28 (confirmação destrutiva) — **ESSENCIAL** |
| **`@vigolium/piolium`** | 479K/mês | Auditoria de segurança multi-fase com sub-agents isolados. | §28 (segurança) |
| **`pi-condense`** | recente | Sumariza tool calls, comprime saídas, recupera sob demanda. | §14 (indicador de atividade), contexto |
| **`pi-cc-extensions`** | 12K/mês | UI estilo Claude Code, inspeção de contexto. | §3 (UI) — referência de layout |
| **`pi-rtk-optimizer`** | 13K/mês | Otimiza comandos e comprime output. | §14, performance |
| **`@reddb-io/red-skills-dev`** | 13K/mês | Engineering skills (TDD, diagnose, graph-aware). | §20 (skills) |
| **`opencode-codebase-index`** | 13K/mês | Semantic search com embeddings, call-graph. | Bonus para entender código do usuário |
| **`pi-scientific-skills`** | novo | 157 skills científicas. | Bonus (pode ser removido) |
| **`@danypops/pi-tickets`** | novo | Integração com GitHub/GitLab/Jira. | Bonus (não prioridade) |

### 13.2 Decisão de arquitetura: SDK + extensions via `package.json`

Como vamos rodar o Pi via **SDK** (Sprint 0, seção 12.5), as extensões prontas entram como **dependências npm normais** no `package.json`, e o Pi as carrega automaticamente na inicialização. Nada de `pi install` CLI — é tudo no manifesto.

```jsonc
// packages/agent/package.json
{
  "dependencies": {
    "@earendil-works/pi-coding-agent": "*",
    "pi-mcp-adapter": "*",
    "pi-web-access": "*",
    "pi-nolo": "*",
    "pi-condense": "*",
    "@reddb-io/red-skills-dev": "*"
  }
}
```

### 13.3 O que AINDA precisa ser escrito do zero (custom)

| Extensão | Por que não tem pronta | Esforço |
|---|---|---|
| `kairos-files` | File system operations precisam ser bem restritas (whitelist de paths, confirmação destrutiva) — o `pi-nolo` cobre parte, mas precisa de camada Kairos por cima. | Médio |
| `kairos-spreadsheets` | Excel/xls/csv. Não vi package oficial. | Médio |
| `kairos-pdf-create` | `pi-web-access` extrai texto de PDF, mas **criar** PDF precisa de tool própria. | Médio |
| `kairos-documents` | Word .docx (criar/editar). Não tem package oficial. | Médio |
| `kairos-images` | Processamento local (sharp) + geração via provider. | Médio |
| `kairos-video` | Wrapper ffmpeg (conversão, corte). | Pequeno |

### 13.4 Onde achar mais packages

- **Catálogo oficial:** https://pi.dev/packages (5.604 packages, com filtro por tipo e busca)
- **Busca no npm:** `https://www.npmjs.com/search?q=pi-extension` ou `pi-` no nome
- **GitHub:** `https://github.com/earendil-works/pi` (packages oficiais da Earendil)

A MiniMax **deve checar o catálogo antes de CADA nova feature** que parece única. Se já existe, instala e customiza.

---

## 14. Resumo do mapeamento "Pi → Kairós"

| Conceito do Pi | Onde fica no Kairós |
|---|---|
| Extensions API | `packages/agent/src/extensions/` (registry) + `packages/extensions/kairos-*/` (custom) |
| Extensions prontas (catálogo §13) | `package.json` do `packages/agent` como deps npm |
| Skills | `packages/extensions/kairos-*/skills/` (custom) + `@reddb-io/red-skills-dev` (pronto) |
| Pi Packages | Cada `packages/extensions/kairos-*` é um pi-package publicável |
| SDK | Entrypoint do agente em `packages/agent/src/index.ts` — UI Electron consome via IPC |
| Session Format (JSONL) | Persistido em SQLite (`kairos.db`), exportável como JSONL |
| Providers | `packages/agent/src/llm/providers/` — 3 providers MVP (OpenRouter, OpenAI, MiniMax) |
| Custom Providers | `packages/agent/src/llm/providers/MiniMax.ts` + `KairosGateway.ts` (fase 2) |
| Security model | **`pi-nolo`** (confirmação) + `packages/agent/src/permissions/` (UI popup custom) |
| Compaction | **`pi-condense`** (pronto) + customizações se necessário |
| MCP | **`pi-mcp-adapter`** (pronto) — abre o ecossistema MCP inteiro |
| Web/PDF leitura | **`pi-web-access`** (pronto) — cobre §8 do PRD |
| TUI Components | (não aplicável, mas a doc serve de referência conceitual) |

---

**Próximo passo:** Sprint 0 — ler (a) `extensions/pi-git-commands` no repo, (b) seção 12.5 (SDK) e 12.2 (Extensions) da doc do Pi, (c) instalar as 6 deps da §13.2, (d) montar o workspace, (e) hello world Electron.
