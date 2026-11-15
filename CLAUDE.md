# Instruções para o Claude

- Responda e escreva textos de interface em português do Brasil.
- Regras de jogo só em `engine/` (TypeScript puro). Nada de `Math.random`: use `createRng(seed)`.
- Dinheiro é inteiro em milhares de euros (`engine/money.ts`).
- Texto de interface em `src/messages/pt-BR.ts`.
- Antes de commitar: `npm run check` e `npm run build` passando.
- Dados de jogadores: só fatos (nome, posição, idade, clube, contrato, valor). Sem fotos, escudos ou textos de terceiros.
