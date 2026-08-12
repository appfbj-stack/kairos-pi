# ADR-0001: Modelado no Pi Agent, não forkado

- **Status:** Aceito
- **Data:** 2026-08-12
- **Decisor:** Fernando Borges (Pastor) + Mavis

## Contexto

O PRD do Kairós Desktop Alves cita o Pi Agent como núcleo arquitetural. Existem 3 caminhos:

1. **Forkar** o Pi Agent inteiro (`@earendil-works/pi-coding-agent`) e customizar lá dentro.
2. **Embedar** o Pi como lib via SDK e construir a app Electron ao redor.
3. **Reescrever do zero** sem usar nada do Pi, só usando como referência conceitual.

## Decisão

**Caminho 2 — embedar o Pi como lib via SDK.**

O `packages/agent` deste monorepo importa `@earendil-works/pi-coding-agent` e `@earendil-works/pi-ai` como dependências normais, e estende via a extensions API oficial.

## Consequências

### Positivas

- Zero manutenção de fork: upgrades do upstream chegam via `pnpm update`.
- Não violamos a licença do Pi (MIT) — uso normal, sem redistribute de código modificado.
- A `extensions/pi-git-commands` que veio no repo vira referência documental viva, não código de produção.
- Extensões prontas do catálogo Pi (5.604 packages) entram como deps npm normais.

### Negativas

- Dependência do roadmap upstream: mudanças breaking no Pi podem exigir adaptação.
- Não podemos modificar o Pi Agent em si; só estender via API pública.

### Neutras

- A estrutura interna do `packages/agent` espelha a do Pi para facilidade cognitiva (Agent, loop, tools, permissions).

## Alternativas rejeitadas

- **Fork:** aumenta superfície de manutenção, sem ganho claro pro MVP.
- **Reescrever do zero:** viola o princípio do PRD de "preservar a estrutura do Pi" e atrasa o MVP em meses.
