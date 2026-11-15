// Todo texto de interface passa por aqui, para a tradução futura não exigir reescrita.
export const ptBR = {
  app: {
    name: "Reconstrução de Elenco",
    description:
      "Escolha seu clube, decida quem fica, quem sai e quem chega, monte o XI e simule a temporada.",
  },
  home: {
    headline: "Reconstrua o elenco do seu time.",
    lead: "Venda, contrate, suba garotos da base e veja onde seu time termina o campeonato.",
    start: "Começar",
    soon: "Em construção",
    steps: [
      { title: "Escolha o clube", body: "Comece pelo Brasileirão e defina o orçamento da janela." },
      { title: "Mexa no elenco", body: "Quem fica, quem é vendido, quem chega e quem sobe da base." },
      { title: "Simule e compartilhe", body: "Monte o XI, simule a temporada e mande o plano para os amigos." },
    ],
  },
  theme: { toggle: "Alternar tema claro e escuro" },
} as const;

export type Messages = typeof ptBR;
