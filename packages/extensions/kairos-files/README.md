# @kairos/extension-files

Kairós file system tools — extensão que adiciona operações de arquivo/pasta ao agente, com **whitelist de paths** e **confirmação para ações destrutivas**.

## Tools expostas

| Tool | O que faz | Destrutiva? |
|---|---|---|
| `files:mkdir` | Cria pasta (com `recursive` opcional) | ⚠️ sim |
| `files:list` | Lista conteúdo de diretório (recursivo opcional) | ❌ não |
| `files:read` | Lê arquivo de texto (limite 1MB default) | ❌ não |
| `files:write` | Escreve arquivo (proteção contra overwrite) | ⚠️ sim |
| `files:delete` | Exclui arquivo/diretório | ⚠️ sim (alta) |
| `files:move` | Move/renomeia | ⚠️ sim |
| `files:search` | Procura por nome dentro de uma raiz | ❌ não |

## Segurança

### Whitelist de paths

Toda operação passa pelo guard `safety.ts`. O path é validado em duas camadas:

1. **Path absoluto obrigatório** (rejeita `..`, symlinks maliciosos via `path.resolve`)
2. **Whitelist de diretórios** — só permite operações dentro de:
   - `$HOME` (do usuário)
   - `$HOME/Desktop`, `$HOME/Documents`, `$HOME/Downloads`
   - `$HOME/Pictures`, `$HOME/Videos`, `$HOME/Music`
   - `process.cwd()` (diretório atual)
   - **Mais paths** via env: `KAIROS_ALLOWED_PATHS="C:\Projetos;D:\Trabalhos"`

Tentativa de acesso fora da whitelist lança `PathGuardError`.

### Confirmação de ações destrutivas

Tools marcadas com `dangerous: true` (mkdir, write, delete, move) são interceptadas pelo `pi-nolo` (extensão do catálogo Pi), que **pede confirmação ao usuário ANTES de executar**. A UI mostra um popup e o tool só roda se o usuário aceitar.

## Como o agente usa

Quando o usuário fala **"Crie uma pasta Clientes 2026 dentro de Documentos"**:

1. Agente entende a intenção
2. Localiza `files:mkdir` no ToolRegistry
3. `pi-nolo` vê que é destrutiva → pede confirmação
4. Usuário aceita
5. Tool executa:
   - `safety.ts` valida `$HOME/Documents/Clientes 2026` (dentro da whitelist) ✅
   - `fs.mkdirSync` cria a pasta
6. Retorna sucesso pro agente
7. Agente responde pro usuário

## Próximas evoluções

- Symlink check mais robusto (resolver symlinks antes de validar)
- Whitelist persistida em SQLite (settings table)
- Undo/restore com backup automático antes de delete/write destrutivo
- Detecção de arquivos ocultos / symlinks / hardlinks
