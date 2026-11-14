import type { Position } from "../../../engine/catalog";

/**
 * Rótulos de posição do Transfermarkt (versões .com e .com.br) para as nossas posições.
 * Os rótulos em português ainda precisam ser conferidos nas páginas reais.
 */
const MAP: Record<string, Position> = {
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
  // .com.br (português) — a conferir
  goleiro: "GK",
  zagueiro: "CB",
  "lateral esq.": "LB",
  "lateral esquerdo": "LB",
  "lateral dir.": "RB",
  "lateral direito": "RB",
  volante: "DM",
  "meia central": "CM",
  "meio-campo": "CM",
  "meia ofensivo": "AM",
  "meia esquerda": "LW",
  "meia direita": "RW",
  "ponta esquerda": "LW",
  "ponta direita": "RW",
  "seg. atacante": "ST",
  "segundo atacante": "ST",
  centroavante: "ST",
};

export function mapPosition(label: string): Position | null {
  return MAP[label.trim().toLowerCase()] ?? null;
}
