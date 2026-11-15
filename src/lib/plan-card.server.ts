import "server-only";

import {
  autoLineupFor,
  balanceSheet,
  formatMoney,
  formationById,
  resultingSquad,
  sanitizeLineup,
  sanitizeSharedPlan,
  simulateLeague,
  type Plan,
} from "@engine";

import { catalog } from "@/lib/catalog.server";
import { unpackPlan } from "@/lib/share-link";

export interface PlanCardData {
  club: { name: string; shortName: string; color: string };
  formation: string;
  lines: { name: string; overall: number }[][]; // linhas do campo, do ataque para o gol
  arrivals: { name: string; fee: string }[];
  departures: { name: string; detail: string }[];
  cash: string;
  result: { position: number; points: number } | null;
}

/** Decodifica o link e monta os dados do card. null se o link for inválido. */
export async function planCardFromPacked(packed: string | undefined, withResult: boolean): Promise<{ plan: Plan; card: PlanCardData } | null> {
  if (!packed || packed.length > 6000) return null;
  let plan: Plan | null;
  try {
    plan = sanitizeSharedPlan(await unpackPlan(packed), catalog);
  } catch {
    return null;
  }
  if (!plan) return null;
  const club = catalog.clubs.get(plan.clubId)!;
  const members = resultingSquad(plan, catalog);
  const lineup = plan.lineup ? sanitizeLineup(plan.lineup, members) : autoLineupFor(plan, catalog, "433");
  const byId = new Map(members.map((m) => [m.id, m]));
  const formation = formationById(lineup.formation);

  // Agrupa as vagas em linhas do campo: alturas a até 7 pontos de distância formam a mesma linha.
  const slots = [...formation.slots].sort((a, b) => a.y - b.y);
  const lines: { name: string; overall: number }[][] = [];
  let current: { x: number; name: string; overall: number }[] = [];
  let lastY = -100;
  for (const slot of slots) {
    if (slot.y - lastY > 7 && current.length) {
      lines.push(current.sort((a, b) => a.x - b.x).map(({ name, overall }) => ({ name, overall })));
      current = [];
    }
    const m = lineup.starters[slot.id] ? byId.get(lineup.starters[slot.id]!) : undefined;
    current.push({ x: slot.x, name: m ? lastName(m.name) : "—", overall: m?.overall ?? 0 });
    lastY = slot.y;
  }
  if (current.length) lines.push(current.sort((a, b) => a.x - b.x).map(({ name, overall }) => ({ name, overall })));

  const b = balanceSheet(plan, catalog);
  const departureLabel: Record<string, string> = {
    sold: "vendido", loaned_out: "emprestado", released: "dispensado", retired: "aposentou", contract_expired: "fim de contrato",
  };
  const card: PlanCardData = {
    club: { name: club.name, shortName: club.shortName, color: club.color },
    formation: formation.label,
    lines,
    arrivals: [
      ...b.purchases.map((l) => ({ name: l.name, fee: formatMoney(l.amount) })),
      ...b.freeArrivals.map((l) => ({ name: l.name, fee: "€ 0" })),
    ],
    departures: [
      ...b.sales.map((l) => ({ name: l.name, detail: formatMoney(l.amount) })),
      ...b.freeDepartures.map((l) => ({ name: l.name, detail: departureLabel[l.detail ?? ""] ?? "" })),
    ],
    cash: b.cash.limited ? formatMoney(b.cash.balance) : "sem teto",
    result: null,
  };
  if (withResult) {
    const r = simulateLeague(plan, catalog);
    card.result = { position: r.position, points: r.table[r.position - 1].points };
  }
  return { plan, card };
}

function lastName(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name;
}
