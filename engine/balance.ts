/**
 * Balanço da janela: o que entrou, o que saiu, quem chegou e saiu sem dinheiro, e a folha.
 * Os totais vêm do mesmo extrato do caixa, então sempre batem com a barra de caixa.
 */
import type { Position } from "./catalog";
import { computeCash, computeLedger, computePayroll, type CashSummary, type Payroll } from "./finance";
import type { Money } from "./money";
import { departureReason, type Catalog, type DepartureReason, type Plan } from "./plan";
import { estimatedSalary } from "./salary";

export interface BalanceLine {
  id: string;
  name: string;
  position: Position;
  /** Clube de origem (chegadas) ou nada (saídas). */
  clubId: string | null;
  amount: Money;
  detail?: DepartureReason | "free" | "pre_contract" | "youth" | "created";
}

export interface BalanceSheet {
  cash: CashSummary;
  sales: BalanceLine[];
  purchases: BalanceLine[];
  freeArrivals: BalanceLine[];
  freeDepartures: BalanceLine[];
  payroll: Payroll;
  /** Folha do elenco atual inteiro, antes da janela, para comparar. */
  payrollBefore: Money;
}

export function balanceSheet(plan: Plan, catalog: Catalog): BalanceSheet {
  const ledger = computeLedger(plan, catalog);
  const sales: BalanceLine[] = [];
  const purchases: BalanceLine[] = [];
  const freeArrivals: BalanceLine[] = [];
  const freeDepartures: BalanceLine[] = [];

  for (const e of ledger) {
    const p = catalog.players.get(e.playerId);
    if (!p) continue;
    const line = { id: p.id, name: p.name, position: p.position, clubId: p.clubId, amount: Math.abs(e.amount) };
    (e.type === "transfer_out" ? sales : purchases).push(line);
  }

  for (const p of catalog.squads.get(plan.clubId) ?? []) {
    const reason = departureReason(plan, p);
    const sold = reason === "sold" && ledger.some((e) => e.playerId === p.id);
    if (reason && !sold) {
      freeDepartures.push({ id: p.id, name: p.name, position: p.position, clubId: null, amount: 0, detail: reason });
    }
  }

  for (const s of plan.signings) {
    if (s.fee > 0) continue;
    const p = catalog.players.get(s.playerId);
    if (!p) continue;
    freeArrivals.push({
      id: p.id,
      name: p.name,
      position: p.position,
      clubId: p.clubId,
      amount: 0,
      detail: s.arrival === "mid_season" ? "pre_contract" : "free",
    });
  }
  for (const c of plan.customPlayers) {
    freeArrivals.push({ id: c.id, name: c.name, position: c.position, clubId: null, amount: 0, detail: c.origin });
  }

  const byAmount = (a: BalanceLine, b: BalanceLine) => b.amount - a.amount;
  return {
    cash: computeCash(plan, catalog),
    sales: sales.sort(byAmount),
    purchases: purchases.sort(byAmount),
    freeArrivals,
    freeDepartures,
    payroll: computePayroll(plan, catalog),
    payrollBefore: (catalog.squads.get(plan.clubId) ?? []).reduce((sum, p) => sum + estimatedSalary(p.marketValue), 0),
  };
}
