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
