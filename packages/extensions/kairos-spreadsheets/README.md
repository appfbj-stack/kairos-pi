# @kairos/extension-spreadsheets

Kairós spreadsheet tools — extensão para ler, criar, editar e exportar planilhas (xlsx/xls/csv).

## Tools expostas

| Tool | O que faz | Destrutiva? |
|---|---|---|
| `sheets:list` | Lista sheets + dimensões | ❌ não |
| `sheets:read` | Lê células (com range A1 opcional) | ❌ não |
| `sheets:create` | Cria planilha nova | ⚠️ sim |
| `sheets:append` | Adiciona linhas no fim | ⚠️ sim |
| `sheets:export` | Converte para csv/xlsx/json | ⚠️ sim |

## Stack

- **`xlsx` (SheetJS)** — único pacote, cobre leitura e escrita de:
  - Excel moderno (`.xlsx`)
  - Excel legacy (`.xls`)
  - CSV (`.csv`)
  - JSON (com `asJson: true`)

## Segurança

- **Whitelist de paths** via `safety.ts` (mesmo padrão do kairos-files)
- **Tools destrutivas** marcadas com `dangerous: true` → `pi-nolo` pede confirmação
- **Proteção contra overwrite** — `sheets:create` falha se arquivo existir (a menos que `overwrite=true`)

## Exemplos de uso

Quando o usuário fala **"Pegue os dados desse PDF e coloque na planilha"**, o agente:

1. Usa `kairos-pdf-*` (ou `pi-web-access`) pra extrair dados
2. Cria ou abre a planilha via `sheets:create` / `sheets:read`
3. Usa `sheets:append` pra adicionar linhas
4. Retorna confirmação pro usuário

## Próximas evoluções

- `sheets:write` — escrever em células específicas (A1, B2, etc)
- `sheets:formula` — avaliar fórmula e retornar valor
- `sheets:format` — aplicar estilo (bold, cores, formatos de número)
- `sheets:chart` — criar gráficos
- `sheets:dedupe` — remover duplicatas
- `sheets:filter` / `sheets:sort` — filtragem e ordenação
