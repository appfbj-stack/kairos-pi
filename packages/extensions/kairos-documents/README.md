# @kairos/extension-documents

Kairós document tools — extensão para criar e ler arquivos Word .docx.

## Tools expostas

| Tool | O que faz | Destrutiva? |
|---|---|---|
| `docs:create` | Cria .docx a partir de texto. Suporta `# ` (H1), `## ` (H2), `### ` (H3). | ⚠️ sim |
| `docs:create-from-table` | Cria .docx com tabela formatada (header em negrito, bordas). | ⚠️ sim |
| `docs:read` | Lê conteúdo. Por padrão texto puro; `includeHtml=true` preserva formatação. | ❌ não |
| `docs:info` | Metadados: autor, título, datas, contagem de palavras/parágrafos. | ❌ não |

## Stack

- **`docx`** — criar arquivos .docx (text, headings, tables, bordas, shading)
- **`mammoth`** — extrair texto/HTML de .docx
- **`jszip`** — parsear o ZIP interno do .docx para ler `docProps/core.xml` (metadata)

## Marcações suportadas em `docs:create`

- `# Título` → Heading 1
- `## Subtítulo` → Heading 2
- `### Sub-subtítulo` → Heading 3
- Linha vazia → parágrafo vazio
- Linha normal → parágrafo

## Exemplo de uso

Quando o usuário fala **"Crie um relatório em Word com os dados dessa planilha"**, o agente:

1. Lê a planilha via `sheets:read`
2. Chama `docs:create-from-table` com header + rows
3. Retorna o caminho do .docx gerado

## Próximas evoluções

- `docs:append` — adicionar parágrafos a um .docx existente
- `docs:replace` — buscar e substituir texto
- `docs:extract-images` — extrair imagens embutidas
- `docs:styles` — aplicar styles do Word
- `docs:from-html` — converter HTML em .docx
