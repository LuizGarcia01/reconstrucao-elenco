import type { Position } from "../../../engine/catalog";

/**
 * Rótulos de posição do Transfermarkt para as nossas posições.
 * Os rótulos em português foram conferidos na página de elenco do .com.br (nov/2026).
 */
const MAP: Record<string, Position> = {
  // .com.br (português)
  goleiro: "GK",
  zagueiro: "CB",
  "lateral esq.": "LB",
  "lateral dir.": "RB",
  volante: "DM",
  "meia central": "CM",
  "meia ofensivo": "AM",
  "meia esquerda": "LW",
  "meia direita": "RW",
  "ponta-esquerda": "LW",
  "ponta-direita": "RW",
  "seg. atacante": "ST",
  centroavante: "ST",
  // .com (inglês)
  goalkeeper: "GK",
  "centre-back": "CB",
  "left-back": "LB",
  "right-back": "RB",
  "defensive midfield": "DM",
  "central midfield": "CM",
  "attacking midfield": "AM",
  "left midfield": "LW",
  "right midfield": "RW",
  "left winger": "LW",
  "right winger": "RW",
  "second striker": "ST",
  "centre-forward": "ST",
};

export function mapPosition(label: string): Position | null {
  return MAP[label.trim().toLowerCase()] ?? null;
}
