# Reconstrução de Elenco

Simulador de janela de transferências: escolha um clube, decida quem fica, quem sai e quem chega, monte o XI e simule a temporada.

## Stack

- Next.js (App Router) + TypeScript, deploy na Vercel
- Tailwind CSS v4 + componentes no padrão shadcn/ui (`src/components/ui`)
- Tema claro e escuro com `next-themes`
- Motor do jogo em TypeScript puro (`engine/`), testado com Vitest

## Rodando

```bash
npm install
npm run dev      # http://localhost:3000
npm run check    # lint + typecheck + testes
npm run build
```

Node 22 ou mais novo (`.nvmrc`).

## Estrutura

```
engine/          regras do jogo: dinheiro, sementes, caixa, simulação (sem React, sem Next)
src/app/         rotas do Next.js
src/components/  componentes de interface
src/messages/    todo texto de interface (pt-BR)
```

## Regras do projeto

- Toda regra de jogo fica em `engine/`. Componentes só exibem e disparam ações.
- O ESLint bloqueia `Math.random` e imports de React/Next dentro de `engine/`.
- Dinheiro é inteiro, em milhares de euros.
- Texto de interface vai em `src/messages/`, nunca solto no componente.
- Alvos de toque com pelo menos 44 px; projeto pensado primeiro para 360 px de largura.

## Atualizando os dados (Transfermarkt)

O site do Transfermarkt tem verificação anti-robô e o projeto não a contorna. Os dados vêm de páginas salvas no navegador:

1. Abra cada página de elenco listada em `scripts/sources/transfermarkt/urls-2026.txt`.
2. Salve com Ctrl+S como "Página da web, somente HTML" em `data/raw/transfermarkt/2026/` (o nome do arquivo não importa).
3. Rode `npm run snapshot`. O comando avisa quais clubes faltam e qualquer posição ou país sem mapa.

`data/raw/` não é versionado. O retrato gerado (`data/snapshot.json`) é versionado: ele vai inteiro para o navegador de quem joga, então não há o que esconder, e assim o build não depende das páginas salvas.

### Temporada

O retrato usa os elencos da Série A **2026** (no Transfermarkt, `saison_id/2025`). O jogo trata esses elencos como o ponto de partida da janela para **2027**. Os clubes rebaixados em 2026 continuam no jogo.
