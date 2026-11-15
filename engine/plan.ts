/**
 * O plano é o que o usuário decidiu na janela. Só decisões ficam gravadas;
 * extrato, caixa e folha são sempre calculados a partir delas (nunca guardados).
 */
import { ageOn, type Club, type League, type Player, type Position, type Snapshot } from "./catalog";
import type { Money } from "./money";
import { estimatedSalary } from "./salary";
import { overallFrom } from "./rating";
import { contractStatus, GAME_SEASON, SEASON_START } from "./season";

export const PLAN_SCHEMA_VERSION = 1;

export type BudgetMode = "preset" | "custom" | "unlimited" | "zero";

export interface Budget {
  mode: BudgetMode;
  /** Usado em "preset" e "custom". Em "zero" é sempre 0; em "unlimited" é ignorado. */
  amount: Money;
}

export type Decision =
  | { kind: "keep"; renewal?: { until: string; salary: Money } }
  | { kind: "sell"; fee: Money }
  | { kind: "loan_out" }
  | { kind: "release" }
  | { kind: "retire" };

export interface Signing {
  playerId: string;
  fee: Money;
  salary: Money; // anual
  arrival: "window" | "mid_season";
}

export interface CustomPlayer {
  id: string; // "custom:..."
  name: string;
  position: Position;
  marketValue: Money;
  salary: Money;
  origin: "youth" | "created";
}

export interface Plan {
  schemaVersion: typeof PLAN_SCHEMA_VERSION;
  season: typeof GAME_SEASON;
  clubId: string;
  budget: Budget;
  /** Só jogadores com decisão diferente do padrão ("fica") aparecem aqui. */
  decisions: Record<string, Decision>;
  signings: Signing[];
  customPlayers: CustomPlayer[];
  /** XI e reservas. Ausente até o usuário abrir a tela do XI. */
  lineup?: Lineup;
}

export interface Lineup {
  formation: string; // id em FORMATIONS
  /** slotId -> playerId (ou null se vazio) */
  starters: Record<string, string | null>;
  bench: string[];
}

export function newPlan(clubId: string, budget: Budget): Plan {
  return {
    schemaVersion: PLAN_SCHEMA_VERSION,
    season: GAME_SEASON,
    clubId,
    budget,
    decisions: {},
    signings: [],
    customPlayers: [],
  };
}

/** Índices do retrato para consultas rápidas. */
export interface Catalog {
  snapshot: Snapshot;
  players: Map<string, Player>;
  clubs: Map<string, Club>;
  leagues: Map<string, League>;
  squads: Map<string, Player[]>;
}

export function buildCatalog(snapshot: Snapshot): Catalog {
  const squads = new Map<string, Player[]>();
  for (const p of snapshot.players) {
    if (p.clubId === null) continue;
    const list = squads.get(p.clubId) ?? [];
    list.push(p);
    squads.set(p.clubId, list);
  }
  return {
    snapshot,
    players: new Map(snapshot.players.map((p) => [p.id, p])),
    clubs: new Map(snapshot.clubs.map((c) => [c.id, c])),
    leagues: new Map(snapshot.leagues.map((l) => [l.id, l])),
    squads,
  };
}

export function decisionFor(plan: Plan, playerId: string): Decision {
  return plan.decisions[playerId] ?? { kind: "keep" };
}

/** Por que um jogador do elenco atual não fica (ou null se fica). */
export type DepartureReason = "sold" | "loaned_out" | "released" | "retired" | "contract_expired";

export function departureReason(plan: Plan, player: Player): DepartureReason | null {
  const d = decisionFor(plan, player.id);
  switch (d.kind) {
    case "sell":
      return "sold";
    case "loan_out":
      return "loaned_out";
    case "release":
      return "released";
    case "retire":
      return "retired";
    case "keep":
      // Contrato vencido sem renovação: sai sem valor.
      return contractStatus(player.contractUntil) === "expired" && !d.renewal ? "contract_expired" : null;
  }
}

/** Uma linha do elenco resultante do plano. */
export interface SquadMember {
  id: string;
  name: string;
  position: Position;
  marketValue: Money;
  salary: Money; // anual
  nationalities: string[];
  origin: "kept" | "signed" | "youth" | "created";
  arrival: "window" | "mid_season";
  overall: number;
  secondaryPositions: Position[];
}

function overallOf(p: Player): number {
  return overallFrom(p.marketValue, p.birthDate ? ageOn(p.birthDate, SEASON_START) : null);
}

export function salaryOf(plan: Plan, player: Player): Money {
  const d = decisionFor(plan, player.id);
  if (d.kind === "keep" && d.renewal) return d.renewal.salary;
  return estimatedSalary(player.marketValue);
}

/** Elenco depois das decisões: quem fica, quem chega e quem foi criado ou subiu da base. */
export function resultingSquad(plan: Plan, catalog: Catalog): SquadMember[] {
  const squad: SquadMember[] = [];
  for (const p of catalog.squads.get(plan.clubId) ?? []) {
    if (departureReason(plan, p) !== null) continue;
    squad.push({
      id: p.id,
      name: p.name,
      position: p.position,
      marketValue: p.marketValue,
      salary: salaryOf(plan, p),
      nationalities: p.nationalities,
      origin: "kept",
      arrival: "window",
      overall: overallOf(p),
      secondaryPositions: p.secondaryPositions,
    });
  }
  for (const s of plan.signings) {
    const p = catalog.players.get(s.playerId);
    if (!p) continue; // id que não existe mais: validatePlan acusa
    squad.push({
      id: p.id,
      name: p.name,
      position: p.position,
      marketValue: p.marketValue,
      salary: s.salary,
      nationalities: p.nationalities,
      origin: "signed",
      arrival: s.arrival,
      overall: overallOf(p),
      secondaryPositions: p.secondaryPositions,
    });
  }
  for (const c of plan.customPlayers) {
    squad.push({
      id: c.id,
      name: c.name,
      position: c.position,
      marketValue: c.marketValue,
      salary: c.salary,
      nationalities: [],
      origin: c.origin,
      arrival: "window",
      overall: overallFrom(c.marketValue, null),
      secondaryPositions: [],
    });
  }
  return squad;
}

/** Estrangeiro é quem não tem a nacionalidade do país da liga. */
export function isForeign(nationalities: string[], leagueCountry: string): boolean {
  return nationalities.length > 0 && !nationalities.includes(leagueCountry);
}
