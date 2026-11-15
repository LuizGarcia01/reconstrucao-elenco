/**
 * Salário anual estimado, em milhares de euros. O Transfermarkt não traz salários,
 * então esta é uma regra NOSSA, a calibrar: piso de € 60 mil por ano mais 18% do valor de mercado.
 * Ex.: € 1 mi -> € 240 mil/ano; € 10 mi -> € 1,86 mi/ano.
 */
import type { Money } from "./money";

export const SALARY_FLOOR: Money = 60;
export const SALARY_RATE = 0.18;

export function estimatedSalary(marketValue: Money): Money {
  return Math.round(SALARY_FLOOR + SALARY_RATE * Math.max(0, marketValue));
}
