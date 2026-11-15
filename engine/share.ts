/**
 * Formato compacto do plano para o link de compartilhar.
 * Só guarda o que difere do padrão; ids do Transfermarkt viram números.
 * Ao abrir, ids que não existem mais no catálogo são ignorados.
 */
import { POSITIONS, type Position } from "./catalog";
import { formationById } from "./lineup";
import { estimatedSalary } from "./salary";
import {
  newPlan,
  type BudgetMode,
  type CustomPlayer,
  type Decision,
  type Lineup,
  type Plan,
  type Signing,
  type Catalog,
} from "./plan";

export const SHARE_VERSION = 1;

const MODES: BudgetMode[] = ["preset", "custom", "unlimited", "zero"];
const KINDS = { keep: "k", renew: "r", sell: "s", loan_out: "l", release: "d", retire: "a" } as const;

type Ref = number | string; // número = tm:<n>; "x<i>" = jogador criado i; outro texto = id cru

export interface SharedPlan {
  v: typeof SHARE_VERSION;
  c: string;
  b: [number, number];
  d?: [Ref, string, number?][];
  s?: [Ref, number, number, 1?][];
  x?: [string, number, number, 0 | 1][];
  l?: [string, (Ref | null)[], Ref[]];
}

function toRef(id: string, custom: CustomPlayer[]): Ref {
  const m = id.match(/^tm:(\d+)$/);
  if (m) return Number(m[1]);
  const i = custom.findIndex((c) => c.id === id);
  return i >= 0 ? `x${i}` : id;
}

function fromRef(ref: Ref, customIds: string[]): string {
  if (typeof ref === "number") return `tm:${ref}`;
  const m = ref.match(/^x(\d+)$/);
  return m ? (customIds[Number(m[1])] ?? ref) : ref;
}

export function encodePlan(plan: Plan): SharedPlan {
  const out: SharedPlan = { v: SHARE_VERSION, c: plan.clubId, b: [MODES.indexOf(plan.budget.mode), plan.budget.amount] };
  const cp = plan.customPlayers;
  // Ordem fixa por id: o mesmo plano gera sempre o mesmo texto (e a mesma semente).
  const d = Object.entries(plan.decisions)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, dec]): [Ref, string, number?] => {
    const ref = toRef(id, cp);
    if (dec.kind === "keep") return dec.renewal ? [ref, KINDS.renew, dec.renewal.salary] : [ref, KINDS.keep];
    if (dec.kind === "sell") return [ref, KINDS.sell, dec.fee];
    return [ref, KINDS[dec.kind]];
  });
  if (d.length) out.d = d;
  if (plan.signings.length) {
    out.s = plan.signings.map((s) => {
      const row: [Ref, number, number, 1?] = [toRef(s.playerId, cp), s.fee, s.salary];
      if (s.arrival === "mid_season") row.push(1);
      return row;
    });
  }
  if (cp.length) out.x = cp.map((c) => [c.name, POSITIONS.indexOf(c.position), c.marketValue, c.origin === "youth" ? 1 : 0]);
  if (plan.lineup) {
    const f = formationById(plan.lineup.formation);
    out.l = [
      f.id,
      f.slots.map((slot) => (plan.lineup!.starters[slot.id] ? toRef(plan.lineup!.starters[slot.id]!, cp) : null)),
      plan.lineup.bench.map((id) => toRef(id, cp)),
    ];
  }
  return out;
}

/** Monta o plano a partir do formato compacto. Lança erro se o formato for inválido. */
export function decodePlan(data: unknown): Plan {
  const s = data as SharedPlan;
  if (!s || s.v !== SHARE_VERSION || typeof s.c !== "string" || !Array.isArray(s.b)) {
    throw new Error("link de plano inválido");
  }
  const mode = MODES[s.b[0]] ?? "preset";
  const plan = newPlan(s.c, { mode, amount: Math.max(0, Math.round(Number(s.b[1]) || 0)) });

  const customIds = (s.x ?? []).map((_, i) => `custom:link${i}`);
  plan.customPlayers = (s.x ?? []).map(([name, pos, value, youth], i) => ({
    id: customIds[i],
    name: String(name).slice(0, 40),
    position: (POSITIONS[pos] ?? "ST") as Position,
    marketValue: Math.max(0, Math.round(Number(value) || 0)),
    salary: estimatedSalary(Math.max(0, Math.round(Number(value) || 0))),
    origin: youth ? "youth" : "created",
  }));

  for (const [ref, kind, n] of s.d ?? []) {
    const id = fromRef(ref, customIds);
    const amount = Math.max(0, Math.round(Number(n) || 0));
    const decision: Decision | null =
      kind === KINDS.keep
        ? { kind: "keep" }
        : kind === KINDS.renew
          ? { kind: "keep", renewal: { until: "2028-12-31", salary: amount } }
          : kind === KINDS.sell
            ? { kind: "sell", fee: amount }
            : kind === KINDS.loan_out
              ? { kind: "loan_out" }
              : kind === KINDS.release
                ? { kind: "release" }
                : kind === KINDS.retire
                  ? { kind: "retire" }
                  : null;
    if (decision) plan.decisions[id] = decision;
  }

  plan.signings = (s.s ?? []).map(
    ([ref, fee, salary, mid]): Signing => ({
      playerId: fromRef(ref, customIds),
      fee: Math.max(0, Math.round(Number(fee) || 0)),
      salary: Math.max(0, Math.round(Number(salary) || 0)),
      arrival: mid ? "mid_season" : "window",
    }),
  );

  if (s.l) {
    const f = formationById(String(s.l[0]));
    const starters = Object.fromEntries(
      f.slots.map((slot, i) => [slot.id, s.l![1][i] != null ? fromRef(s.l![1][i]!, customIds) : null]),
    );
    const lineup: Lineup = { formation: f.id, starters, bench: (s.l[2] ?? []).map((r) => fromRef(r, customIds)) };
    plan.lineup = lineup;
  }
  return plan;
}

/**
 * Limpa um plano vindo de link contra o catálogo atual: clube inexistente invalida;
 * decisões fora do elenco e contratações de ids que não existem mais são descartadas.
 */
export function sanitizeSharedPlan(plan: Plan, catalog: Catalog): Plan | null {
  if (!catalog.clubs.has(plan.clubId)) return null;
  const own = new Set((catalog.squads.get(plan.clubId) ?? []).map((p) => p.id));
  const decisions = Object.fromEntries(Object.entries(plan.decisions).filter(([id]) => own.has(id)));
  const seen = new Set<string>();
  const signings = plan.signings.filter((s) => {
    const ok = catalog.players.has(s.playerId) && !own.has(s.playerId) && !seen.has(s.playerId);
    seen.add(s.playerId);
    return ok;
  });
  return { ...plan, decisions, signings };
}
