# PRD — Kairos PI

**Versão:** 1.0
**Tipo:** Aplicativo Desktop para Windows
**Base:** Fork do **Pi Agent** (`@earendil-works/pi-coding-agent`) open source — repo `appfbj-stack/kairos-pi`
**Objetivo:** transformar o Pi em um agente de computador geral, controlado principalmente por uma interface de chat extremamente simples.

---

## 1. Visão do produto

O Kairos Desktop Alves será um agente de IA instalado diretamente no computador do usuário.

O objetivo é permitir que uma pessoa controle e utilize o computador através de linguagem natural, sem precisar saber operar individualmente Excel, Word, PDF, gerenciadores de arquivos ou outras ferramentas.

O usuário simplesmente diz o que deseja:

> "Crie uma pasta chamada Clientes 2026."

> "Pegue esses PDFs e coloque os dados em uma planilha."

> "Crie um relatório no Word usando essa planilha."

> "Organize meus arquivos de Downloads."

> "Crie uma imagem para divulgar essa promoção."

O Kairos deverá interpretar a solicitação, escolher as ferramentas adequadas, executar a tarefa e apresentar o resultado.

### Princípio principal

O usuário não escolhe a ferramenta.

O usuário informa o resultado que deseja.

O Kairos decide como realizar a tarefa.

---

## 2. Objetivo principal

Criar um agente desktop:

```
Chat → entendimento → planejamento → ferramentas → execução → resultado
```

O aplicativo deve ser:

- simples;
- rápido;
- objetivo;
- intuitivo;
- modular;
- extensível;
- seguro;
- capaz de trabalhar com arquivos locais;
- preparado para futuras extensões.

---

## 3. Interface

A interface inicial deve ser minimalista.

Não criar um dashboard cheio de menus.

A tela principal deve ser praticamente um chat.

```
┌─────────────────────────────────────────┐
│ KAIROS DESKTOP ALVES              ⚙️     │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│        O que você quer fazer?            │
│                                         │
│                                         │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│ 📎  Digite uma tarefa...             ➤ │
└─────────────────────────────────────────┘
```

### Elementos

- Logo Kairos.
- Nome Kairos Desktop Alves.
- Área de conversa.
- Campo de texto.
- Botão para anexar arquivos.
- Botão enviar.
- Indicador de execução.
- Configurações.

### Não criar inicialmente

- dashboards complexos;
- dezenas de menus;
- telas específicas para cada ferramenta;
- configurações desnecessárias.

---

## 4. Anexos

O usuário deverá conseguir anexar:

- .xlsx
- .xls
- .csv
- .pdf
- .docx
- .doc
- .txt
- .jpg
- .jpeg
- .png
- .webp
- .mp4
- outros formatos suportados.

O Kairos deve identificar automaticamente o tipo do arquivo.

**Exemplo:**

Usuário:
```
[relatorio.pdf]
"Pegue os dados desse PDF e coloque na planilha abaixo."
[estoque.xlsx]
```

O agente deve compreender que precisa trabalhar com os dois arquivos.

---

## 5. Sistema de ferramentas

O Pi deve continuar sendo o núcleo do agente.

**Não reconstruir o sistema de agentes existente.**

Utilizar as ferramentas e extensões disponíveis no projeto.

Criar uma arquitetura modular para novas ferramentas.

### Estrutura conceitual

```
Kairos
│
└── Pi Agent
      │
      ├── File Tools
      ├── Shell
      ├── Editor
      ├── Document Tools
      ├── Spreadsheet Tools
      ├── PDF Tools
      ├── Image Tools
      ├── Browser Tools
      └── Extensions
```

---

## 6. Arquivos e pastas

O Kairos deverá trabalhar com o sistema de arquivos local.

### Operações

- criar pasta;
- criar arquivo;
- abrir arquivo;
- ler arquivo;
- editar arquivo;
- copiar;
- mover;
- renomear;
- excluir;
- procurar;
- organizar;
- compactar;
- descompactar;
- criar estrutura de pastas;
- identificar arquivos duplicados.

**Exemplo:**

> "Crie uma pasta Clientes 2026 dentro de Documentos e crie uma pasta para cada cliente."

---

## 7. Planilhas

Criar suporte robusto para:

- Excel;
- XLSX;
- XLS;
- CSV.

O Kairos deverá conseguir:

- criar planilhas;
- abrir planilhas;
- ler planilhas;
- preencher células;
- alterar células;
- criar fórmulas;
- corrigir fórmulas;
- formatar células;
- criar tabelas;
- filtrar;
- ordenar;
- remover duplicados;
- criar gráficos;
- criar relatórios;
- importar dados;
- exportar dados.

**Exemplo:**

> "Pegue os dados desses PDFs e coloque nas colunas Nome, CPF, Telefone e Valor."

---

## 8. PDF

Suporte para:

- leitura;
- extração de texto;
- extração de tabelas;
- criação;
- conversão;
- combinação;
- divisão;
- organização;
- geração de relatórios.

**Exemplo:**

> "Pegue todos os PDFs dessa pasta e extraia os valores para uma planilha."

---

## 9. Word / documentos

Suporte para documentos:

- criar;
- editar;
- formatar;
- preencher;
- converter;
- gerar relatórios.

**Exemplo:**

> "Crie um relatório em Word usando os dados dessa planilha."

---

## 10. Imagens

O Kairos deve possuir uma arquitetura preparada para ferramentas de imagem.

**Exemplo:**

> "Crie uma imagem de divulgação para uma promoção."

Se houver um provedor de geração de imagens configurado, utilizar esse provedor.

Também permitir:

- redimensionamento;
- conversão;
- compressão;
- organização;
- processamento de imagens através de ferramentas locais.

---

## 11. Vídeos

Preparar suporte para tarefas como:

- conversão;
- corte;
- alteração de formato;
- extração de áudio;
- organização;
- renomeação;
- processamento em lote.

Quando apropriado, utilizar ferramentas locais como FFmpeg.

**Exemplo:**

> "Converta todos esses vídeos para MP4 e coloque na pasta Vídeos Prontos."

---

## 12. Navegador

Criar arquitetura para futura integração com navegador.

O agente poderá posteriormente:

- abrir páginas;
- pesquisar;
- baixar arquivos;
- fazer upload;
- preencher formulários;
- navegar em sites.

A implementação deve ser modular.

---

## 13. Execução de tarefas

O Kairos deve conseguir realizar tarefas compostas.

**Exemplo:**

> "Pegue todos os PDFs da pasta Downloads, extraia os nomes e valores, crie uma planilha e salve em Documentos/Relatórios."

O agente deverá interpretar:

1. localizar PDFs
2. ler PDFs
3. extrair informações
4. criar planilha
5. preencher planilha
6. salvar arquivo
7. informar conclusão

---

## 14. Indicador de atividade

Durante uma tarefa longa, mostrar ao usuário o que está acontecendo.

**Exemplo:**

```
Kairos está trabalhando...

📂 Localizando arquivos
📄 Lendo 18 PDFs
📊 Criando planilha
✏️ Preenchendo dados
💾 Salvando arquivo

████████████████░░░ 80%
```

Não mostrar informações técnicas excessivas.

O objetivo é transmitir segurança e transparência.

---

## 15. Resultado

Quando terminar:

```
✅ Tarefa concluída.

Foram processados 18 arquivos.

Arquivos criados:

📊 relatorio.xlsx
📄 resumo.docx

[ Abrir arquivos ]
```

---

## 16. Confirmação de ações perigosas

O Kairos deve solicitar confirmação antes de ações potencialmente destrutivas.

**Exemplo:**

```
⚠️ Encontrei 327 arquivos que serão excluídos.

Deseja continuar?

[Cancelar]  [Continuar]
```

Aplicar especialmente para:

- exclusão de arquivos;
- sobrescrever arquivos importantes;
- comandos potencialmente destrutivos;
- ações administrativas;
- alterações irreversíveis.

---

## 17. Banco de dados

Utilizar SQLite local.

Os dados devem permanecer no computador do usuário.

**Banco:** `kairos.db`

Armazenar:

- conversas;
- histórico;
- configurações;
- preferências;
- tarefas;
- logs;
- extensões instaladas;
- informações locais necessárias ao funcionamento.

**Não utilizar PostgreSQL para o funcionamento local.**

---

## 18. Privacidade

O Kairos deve priorizar dados locais.

Arquivos do usuário não devem ser enviados para servidores externos sem necessidade.

Quando uma tarefa precisar utilizar uma API de IA externa, deixar isso claro na arquitetura e nas configurações.

Preparar suporte para:

- OpenRouter;
- OpenAI;
- MiniMax;
- outros provedores;
- modelos locais futuramente.

---

## 19. Sistema de extensões

Esse é um ponto fundamental.

O Kairos deve manter o sistema de extensões do Pi e permitir adicionar novas capacidades sem modificar o núcleo.

**Exemplo:**

```
extensions/
│
├── kairos-spreadsheets
├── kairos-pdf
├── kairos-documents
├── kairos-images
├── kairos-video
├── kairos-browser
└── kairos-office
```

Cada extensão deverá:

- registrar suas ferramentas;
- informar ao agente suas capacidades;
- possuir configuração própria;
- poder ser ativada/desativada;
- ser atualizável.

---

## 20. Skills

Criar suporte para Skills.

**Exemplo:**

```
skills/
├── planilhas
├── documentos
├── pdf
├── organizacao-arquivos
├── videos
└── imagens
```

As Skills devem ensinar ao agente como executar corretamente tarefas específicas.

---

## 21. Modelo de IA

Criar uma camada de configuração de modelos.

Inicialmente suportar:

- OpenRouter;
- OpenAI;
- MiniMax.

Possibilidade futura:

- Ollama;
- modelos locais;
- outros provedores.

O usuário poderá selecionar o provedor e modelo nas configurações.

---

## 22. Sistema de créditos

Preparar o aplicativo para futuramente trabalhar com o modelo comercial:

```
Kairos Desktop
      ↓
Kairos API
      ↓
Sistema de créditos
      ↓
Gateway de IA
      ↓
Modelo
```

Porém, o aplicativo deve continuar funcionando localmente para as tarefas que não dependem de IA externa.

---

## 23. Licenciamento

Preparar o aplicativo para integração futura com um servidor de licenças.

A licença poderá controlar:

- cliente;
- plano;
- validade;
- dispositivo;
- status;
- créditos.

O servidor de licença ficará separado do banco SQLite local.

---

## 24. Atualização automática

Criar estrutura para o aplicativo verificar novas versões.

```
Kairos instalado
       ↓
Verifica versão
       ↓
Nova versão?
       ↓
Sim
       ↓
Download
       ↓
Instala atualização
```

O usuário deve poder escolher:

- atualizar automaticamente;
- perguntar antes de atualizar.

---

## 25. Instalação

Criar instalador Windows:

```
Kairos-Desktop-Alves-Setup.exe
```

O instalador deve:

- instalar o aplicativo;
- criar atalhos;
- configurar diretórios;
- instalar dependências necessárias;
- criar banco SQLite;
- iniciar o Kairos.

O usuário comum não deve precisar abrir terminal para instalar.

---

## 26. Identidade visual

Alterar a identidade do projeto para:

**Nome:** Kairos Desktop Alves

Alterar:

- nome do aplicativo;
- logo;
- ícone;
- textos;
- splash;
- informações da aplicação.

Não alterar radicalmente as cores inicialmente.

A identidade visual será refinada posteriormente.

---

## 27. Arquitetura

**Não reescrever o Pi. Usar o fork como base.**

```
┌──────────────────────────────┐
│       KAIROS DESKTOP         │
├──────────────────────────────┤
│       Chat Interface         │
├──────────────────────────────┤
│         Pi Agent             │
├──────────────────────────────┤
│ Tools / Extensions / Skills   │
├──────────────────────────────┤
│        Windows OS            │
├──────────────────────────────┤
│          SQLite              │
└──────────────────────────────┘
```

---

## 28. Requisitos de segurança

O agente nunca deve executar automaticamente ações altamente destrutivas sem confirmação.

Implementar:

- permissões;
- confirmação;
- logs;
- limite de ferramentas;
- isolamento quando possível;
- identificação da ferramenta utilizada;
- possibilidade de interromper execução.

**Botão:**

```
⏹️ Parar execução
```

deve estar disponível durante tarefas longas.

---

## 29. Experiência desejada

O Kairos deve parecer menos com um software tradicional e mais com:

> um funcionário digital que sabe usar o computador.

O usuário não precisa conhecer:

- Excel;
- PowerShell;
- Python;
- PDF;
- Word;
- comandos;
- scripts.

Ele simplesmente explica o que precisa.

---

## 30. Exemplos de tarefas

**Arquivos**

> "Organize minha pasta Downloads."

**Excel**

> "Crie uma planilha de controle de vendas."

**PDF → Excel**

> "Pegue os dados desses PDFs e coloque na planilha."

**Excel → Word**

> "Crie um relatório em Word com os dados dessa planilha."

**Arquivos**

> "Crie uma pasta para cada cliente."

**Vídeos**

> "Converta esses vídeos para MP4."

**Imagens**

> "Crie uma imagem para divulgação."

**Tarefa complexa**

> "Pegue os PDFs dessa pasta, extraia os valores, coloque tudo em uma planilha, faça um gráfico e gere um relatório em PDF."

O Kairos deve ser capaz de decompor a tarefa e utilizar múltiplas ferramentas.

---

## 31. O que NÃO fazer inicialmente

Não transformar o projeto em um sistema complexo.

Evitar inicialmente:

- CRM;
- calendário;
- ERP;
- painel empresarial;
- dezenas de menus;
- sistema de usuários complexo;
- sincronização obrigatória;
- banco de dados remoto obrigatório.

**O foco inicial é: AGENTE DE COMPUTADOR.**

---

## 32. MVP

A primeira versão funcional deve possuir:

### Interface
- Chat;
- anexar arquivo;
- histórico;
- configurações.

### Agente
- Pi Agent;
- execução de ferramentas;
- memória básica.

### Computador
- arquivos;
- pastas;
- terminal;
- execução de comandos.

### Documentos
- PDF;
- Word;
- Excel/CSV.

### Sistema
- SQLite;
- instalador Windows;
- logs;
- confirmação de ações perigosas.

---

## 33. Critério de sucesso

O MVP será considerado funcional quando um usuário sem conhecimento técnico conseguir abrir o Kairos e executar tarefas como:

> "Crie uma pasta chamada Empresa."

> "Pegue essa planilha e organize os dados."

> "Leia esse PDF e coloque os dados na planilha."

> "Crie um documento Word."

> "Converta esses arquivos."

> "Organize meus arquivos."

sem precisar saber qual programa, ferramenta ou comando deve ser utilizado.

---

## 34. Instrução principal para a MiniMax

> **IMPORTANTE:**
>
> Você receberá um fork do repositório original do Pi Agent.
>
> **Não recrie o agente do zero.**
> **Não substitua desnecessariamente a arquitetura existente.**
>
> Primeiro analise completamente o código-fonte, arquitetura, ferramentas, extensões, sistema de Skills, runtime, interface e sistema de pacotes existentes.
>
> Depois adapte o projeto para criar o Kairos Desktop Alves.

### Prioridades

1. Preservar o funcionamento do Pi Agent.
2. Criar uma interface de chat minimalista.
3. Transformar o aplicativo em um agente desktop para Windows.
4. Integrar ferramentas de arquivos, pastas e documentos.
5. Criar suporte robusto para planilhas.
6. Criar suporte para PDF e Word.
7. Criar arquitetura de extensões.
8. Utilizar SQLite local.
9. Criar instalador Windows.
10. Preparar arquitetura para licença, créditos e atualizações futuras.
11. Não adicionar complexidade desnecessária.
12. Não remover funcionalidades importantes do Pi sem justificativa.
13. Manter a licença e os avisos de copyright do projeto original.
14. Documentar todas as modificações realizadas.

### Resultado esperado

Um aplicativo Windows chamado:

```
KAIROS DESKTOP ALVES
```

com uma interface extremamente simples:

> "O que você quer que eu faça?"

O usuário conversa com o Kairos e o agente utiliza as ferramentas disponíveis para trabalhar diretamente no computador.

### Princípio do produto

> **VOCÊ PEDE. O KAIROS FAZ.**

---
