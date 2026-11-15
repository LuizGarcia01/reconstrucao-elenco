/**
 * Força (overall) é uma regra NOSSA, derivada de fatos (valor de mercado e idade).
 * Não copiamos nota de nenhum jogo ou site.
 *
 * Calibrada na etapa 8 com o retrato da Série A:
 * - base logarítmica no valor: € 100 mil = 45, € 1 mi = 58, € 5 mi = 67, € 30 mi = 77;
 * - só garotos abaixo de 21 anos perdem pontos (o valor deles embute potencial);
 * - veteranos acima de 30 ganham pontos (o valor deles cai com a idade, não a bola).
 */
import type { Money } from "./money";

export const OVERALL_MIN = 40;
export const OVERALL_MAX = 92;

export function overallFrom(marketValue: Money, age: number | null): number {
  const value = Math.max(marketValue, 50);
  let overall = 45 + 13 * Math.log10(value / 100);
  if (age !== null) {
    if (age < 21) overall -= Math.min(21 - age, 4) * 1.25;
    if (age > 30) overall += Math.min(age - 30, 6) * 1.5;
  }
  return Math.round(Math.min(OVERALL_MAX, Math.max(OVERALL_MIN, overall)));
}
