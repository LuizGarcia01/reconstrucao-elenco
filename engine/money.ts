/**
 * Dinheiro é sempre inteiro, em milhares de euros (1 = € 1 mil).
 * Nunca ponto flutuante: somar extrato com float acumula erro.
 */
export type Money = number;

export function money(thousands: number): Money {
  if (!Number.isInteger(thousands)) {
    throw new RangeError(`Valor em dinheiro precisa ser inteiro (milhares de euros): ${thousands}`);
  }
  return thousands;
}

/** Converte milhões (como o usuário digita) para milhares, arredondando. */
export function fromMillions(millions: number): Money {
  return Math.round(millions * 1000);
}

/** Formata para exibição: 1500 -> "€ 1,5 mi"; 800 -> "€ 800 mil". */
export function formatMoney(value: Money): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1000) {
    const millions = abs / 1000;
    const text = millions.toLocaleString("pt-BR", { maximumFractionDigits: millions >= 100 ? 0 : 1 });
    return `${sign}€ ${text} mi`;
  }
  return `${sign}€ ${abs.toLocaleString("pt-BR")} mil`;
}
