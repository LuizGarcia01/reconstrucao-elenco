/**
 * Força (overall) é uma regra NOSSA, derivada de fatos (valor de mercado e idade).
 * Não copiamos nota de nenhum jogo ou site.
 *
 * Valores de partida, a calibrar na etapa 8:
 * - base logarítmica no valor: € 50 mil ≈ 40, € 5 mi ≈ 62, € 50 mi ≈ 73;
 * - jovens têm valor inflado por potencial, então perdem pontos;
 * - veteranos têm valor deflacionado pela idade, então ganham pontos.
 */
import type { Money } from "./money";

export const OVERALL_MIN = 40;
export const OVERALL_MAX = 92;

export function overallFrom(marketValue: Money, age: number | null): number {
  const value = Math.max(marketValue, 50);
  let overall = 40 + 11 * Math.log10(value / 50);
  if (age !== null) {
    if (age < 23) overall -= (23 - age) * 1.5;
    if (age > 30) overall += Math.min(age - 30, 6) * 1.5;
  }
  return Math.round(Math.min(OVERALL_MAX, Math.max(OVERALL_MIN, overall)));
}
