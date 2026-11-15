/**
 * Dinheiro da janela. Regras:
 * - caixa = orçamento inicial + soma do extrato (vendas entram, compras saem);
 * - na fase 1 a folha é informativa: aparece no balanço, não sai do caixa.
 */
import { SECTOR_OF, type Player, type Sector } from "./catalog";
import type { Money } from "./money";
import { departureReason, decisionFor, resultingSquad, type Catalog, type Plan, type Signing } from "./plan";
import { estimatedSalary } from "./salary";
import { contractStatus } from "./season";

export type LedgerType = "transfer_in" | "transfer_out";

export interface LedgerEntry {
  type: LedgerType;
  amount: Money; // positivo entra, negativo sai
  playerId: string;
}

export function computeLedger(plan: Plan, catalog: Catalog): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  for (const p of catalog.squads.get(plan.clubId) ?? []) {
    const d = decisionFor(plan, p.id);
    if (d.kind === "sell" && d.fee > 0) entries.push({ type: "transfer_out", amount: d.fee, playerId: p.id });
  }
  for (const s of plan.signings) {
    if (s.fee > 0) entries.push({ type: "transfer_in", amount: -s.fee, playerId: s.playerId });
  }
  return entries;
}

export interface CashSummary {
  initial: Money;
  raised: Money; // vendas
  spent: Money; // compras (positivo)
  balance: Money; // initial + raised - spent; em "sem teto", initial é 0
  limited: boolean; // false no modo "sem teto"
}

export function computeCash(plan: Plan, catalog: Catalog): CashSummary {
  const ledger = computeLedger(plan, catalog);
  const raised = ledger.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0);
  const spent = -ledger.filter((e) => e.amount < 0).reduce((s, e) => s + e.amount, 0);
  const limited = plan.budget.mode !== "unlimited";
  const initial = plan.budget.mode === "preset" || plan.budget.mode === "custom" ? plan.budget.amount : 0;
  return { initial, raised, spent, balance: initial + raised - spent, limited };
}

export interface Payroll {
  total: Money; // anual
  bySector: Record<Sector, Money>;
}

/** Folha anual: quem fica e quem chega; quem chega no meio do ano conta metade. */
export function computePayroll(plan: Plan, catalog: Catalog): Payroll {
  const bySector: Record<Sector, Money> = { GK: 0, DEF: 0, MID: 0, ATT: 0 };
  for (const m of resultingSquad(plan, catalog)) {
    const cost = m.arrival === "mid_season" ? Math.round(m.salary / 2) : m.salary;
    bySector[SECTOR_OF[m.position]] += cost;
  }
  const total = bySector.GK + bySector.DEF + bySector.MID + bySector.ATT;
  return { total, bySector };
}

/** Orçamento sugerido: 15% do valor do elenco, arredondado para o milhão. Regra nossa, a calibrar. */
export function presetBudget(clubId: string, catalog: Catalog): Money {
  const value = (catalog.squads.get(clubId) ?? []).reduce((s, p) => s + p.marketValue, 0);
  return Math.round((value * 0.15) / 1000) * 1000;
}

/** Valores padrão ao contratar um jogador de outro clube (ou sem clube). */
export function signingDefaults(player: Player): Pick<Signing, "fee" | "salary" | "arrival"> {
  const status = contractStatus(player.contractUntil);
  const free = player.clubId === null || status === "expired" || status === "pre_contract";
  return {
    fee: free ? 0 : player.marketValue,
    salary: estimatedSalary(player.marketValue),
    arrival: status === "pre_contract" && player.clubId !== null ? "mid_season" : "window",
  };
}

/** Contador para o resumo do elenco. */
export function departuresCount(plan: Plan, catalog: Catalog): number {
  return (catalog.squads.get(plan.clubId) ?? []).filter((p) => departureReason(plan, p) !== null).length;
}
