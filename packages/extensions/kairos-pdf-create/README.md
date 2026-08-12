# @kairos/extension-pdf-create

Kairós PDF creation tools — extensão para **criar e manipular** PDFs a partir do zero. (Leitura de PDF é coberta pelo `pi-web-access` do catálogo Pi.)

## Tools expostas

| Tool | O que faz | Destrutiva? |
|---|---|---|
| `pdf:create` | Cria PDF a partir de texto. Linhas com `# ` viram título. | ⚠️ sim |
| `pdf:create-from-table` | Cria PDF tabular (relatório) a partir de header + rows. | ⚠️ sim |
| `pdf:merge` | Junta múltiplos PDFs preservando formatação. | ⚠️ sim |
| `pdf:info` | Lê metadados (páginas, autor, datas). | ❌ não |

## Stack

- **`pdfkit`** — geração de PDFs do zero (text, fonts, layout)
- **`pdf-lib`** — manipulação de PDFs existentes (merge, info, read metadata)

## Exemplos de uso

Quando o usuário fala **"Gere um relatório em PDF com os dados dessa planilha"**, o agente:

1. Lê a planilha via `sheets:read`
2. Chama `pdf:create-from-table` com header + rows
3. Retorna o caminho do PDF gerado

Quando fala **"Junte esses 3 PDFs"**:

1. Chama `pdf:merge` com os 3 paths em ordem
2. Gera PDF combinado

## Marcações suportadas em `pdf:create`

- `# Título` (H1) — linha começando com `# ` vira título grande
- Linha vazia — espaço
- Linha normal — parágrafo

Para layout rico (tabelas em texto, imagens, etc), use `pdf:create-from-table` ou (futuro) `pdf:create-from-html`.

## Próximas evoluções

- `pdf:create-from-html` — renderiza HTML/CSS em PDF
- `pdf:split` — divide um PDF em páginas
- `pdf:extract-pages` — extrai páginas específicas
- `pdf:watermark` — adiciona marca d'água
