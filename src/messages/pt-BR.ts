// Todo texto de interface passa por aqui, para a tradução futura não exigir reescrita.
export const ptBR = {
  app: {
    name: "Reconstrução de Elenco",
    description:
      "Escolha seu clube, decida quem fica, quem sai e quem chega, monte o XI e simule a temporada.",
  },
  common: {
    back: "Voltar",
    continue: "Continuar",
    perYear: "/ano",
  },
  home: {
    headline: "Reconstrua o elenco do seu time.",
    lead: "Venda, contrate, suba garotos da base e veja onde seu time termina o campeonato.",
    start: "Começar",
    continuePlan: "Continuar plano",
    newPlan: "Começar outro plano",
    steps: [
      { title: "Escolha o clube", body: "Comece pelo Brasileirão e defina o orçamento da janela." },
      { title: "Mexa no elenco", body: "Quem fica, quem é vendido, quem chega e quem sobe da base." },
      { title: "Simule e compartilhe", body: "Monte o XI, simule a temporada e mande o plano para os amigos." },
    ],
  },
  club: {
    title: "Escolha o clube",
    lead: "Elencos de 2026. Você monta a janela para a temporada 2027.",
    search: "Buscar clube",
    empty: "Nenhum clube com esse nome.",
    players: "jogadores",
    squadValue: "Valor do elenco",
    replaceWarning: "Escolher um clube começa um plano novo e substitui o plano atual.",
  },
  budget: {
    title: "Orçamento da janela",
    lead: "Quanto você tem para gastar em contratações. Vendas sempre somam ao caixa.",
    modes: {
      preset: {
        title: "Sugerido",
        body: "Um valor proporcional ao tamanho do elenco do clube.",
      },
      custom: {
        title: "Outro valor",
        body: "Você define quanto o clube tem, em milhões de euros.",
      },
      unlimited: {
        title: "Sem teto",
        body: "Nada é bloqueado; o jogo só mostra o saldo. Bom para sonhar.",
      },
      zero: {
        title: "Caixa zero",
        body: "Começa sem dinheiro: só contrata depois de vender.",
      },
    },
    customLabel: "Valor em milhões de euros",
    customInvalid: "Digite um valor entre 0 e 2.000.",
    confirm: "Ir para o elenco",
    noPlan: "Escolha um clube primeiro.",
    chooseClub: "Escolher clube",
  },
  squad: {
    title: "Elenco",
    soon: "A tela do elenco chega na próxima etapa. Seu plano já está salvo neste aparelho.",
    club: "Clube",
    budget: "Orçamento",
    unlimited: "Sem teto",
    changeBudget: "Mudar orçamento",
    changeClub: "Trocar de clube",
  },
  theme: { toggle: "Alternar tema claro e escuro" },
} as const;

export type Messages = typeof ptBR;
