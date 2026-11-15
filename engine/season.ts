/**
 * O retrato traz os elencos de 2026; o jogo monta a janela para 2027.
 */
export const GAME_SEASON = "2027";
export const SEASON_START = "2027-01-01";
/** Quem chega por pré-contrato chega na janela do meio do ano. */
export const MID_SEASON = "2027-07-01";

export type ContractStatus =
  | "expired" // contrato acaba antes de 2027 começar: sai de graça se não renovar
  | "pre_contract" // acaba no 1º semestre de 2027: pode assinar pré-contrato e chegar no meio do ano
  | "running";

export function contractStatus(contractUntil: string | null): ContractStatus {
  // Sem data de contrato: tratamos como vigente, para não liberar jogador de graça por falta de dado.
  if (contractUntil === null) return "running";
  if (contractUntil < SEASON_START) return "expired";
  if (contractUntil < MID_SEASON) return "pre_contract";
  return "running";
}
