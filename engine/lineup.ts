/**
 * XI: formações, encaixe por posição, escalação automática e validação.
 * O multiplicador de encaixe é o da spec (seção 7) e é usado também pela simulação.
 */
import { SECTOR_OF, type Position } from "./catalog";
import type { Money } from "./money";
import { isForeign, resultingSquad, type Catalog, type Lineup, type Plan, type SquadMember } from "./plan";

export interface Slot {
  id: string;
  position: Position;
  /** Posição no campo, em % (x da esquerda, y de cima; o gol fica embaixo). */
  x: number;
  y: number;
}

export interface Formation {
  id: string;
  label: string;
  slots: Slot[];
}

const gk: Slot = { id: "gk", position: "GK", x: 50, y: 92 };

export const FORMATIONS: Formation[] = [
  {
    id: "433",
    label: "4-3-3",
    slots: [
      gk,
      { id: "lb", position: "LB", x: 12, y: 72 },
      { id: "cb1", position: "CB", x: 36, y: 76 },
      { id: "cb2", position: "CB", x: 64, y: 76 },
      { id: "rb", position: "RB", x: 88, y: 72 },
      { id: "dm", position: "DM", x: 50, y: 58 },
      { id: "cm1", position: "CM", x: 27, y: 46 },
      { id: "cm2", position: "CM", x: 73, y: 46 },
      { id: "lw", position: "LW", x: 15, y: 22 },
      { id: "st", position: "ST", x: 50, y: 14 },
      { id: "rw", position: "RW", x: 85, y: 22 },
    ],
  },
  {
    id: "442",
    label: "4-4-2",
    slots: [
      gk,
      { id: "lb", position: "LB", x: 12, y: 72 },
      { id: "cb1", position: "CB", x: 36, y: 76 },
      { id: "cb2", position: "CB", x: 64, y: 76 },
      { id: "rb", position: "RB", x: 88, y: 72 },
      { id: "lm", position: "LW", x: 12, y: 44 },
      { id: "cm1", position: "CM", x: 37, y: 50 },
      { id: "cm2", position: "CM", x: 63, y: 50 },
      { id: "rm", position: "RW", x: 88, y: 44 },
      { id: "st1", position: "ST", x: 35, y: 16 },
      { id: "st2", position: "ST", x: 65, y: 16 },
    ],
  },
  {
    id: "4231",
    label: "4-2-3-1",
    slots: [
      gk,
      { id: "lb", position: "LB", x: 12, y: 72 },
      { id: "cb1", position: "CB", x: 36, y: 76 },
      { id: "cb2", position: "CB", x: 64, y: 76 },
      { id: "rb", position: "RB", x: 88, y: 72 },
      { id: "dm1", position: "DM", x: 35, y: 58 },
      { id: "dm2", position: "DM", x: 65, y: 58 },
      { id: "lw", position: "LW", x: 15, y: 34 },
      { id: "am", position: "AM", x: 50, y: 36 },
      { id: "rw", position: "RW", x: 85, y: 34 },
      { id: "st", position: "ST", x: 50, y: 14 },
    ],
  },
  {
    id: "352",
    label: "3-5-2",
    slots: [
      gk,
      { id: "cb1", position: "CB", x: 25, y: 76 },
      { id: "cb2", position: "CB", x: 50, y: 78 },
      { id: "cb3", position: "CB", x: 75, y: 76 },
      { id: "lwb", position: "LB", x: 10, y: 48 },
      { id: "dm", position: "DM", x: 50, y: 58 },
      { id: "cm1", position: "CM", x: 30, y: 42 },
      { id: "cm2", position: "CM", x: 70, y: 42 },
      { id: "rwb", position: "RB", x: 90, y: 48 },
      { id: "st1", position: "ST", x: 35, y: 16 },
      { id: "st2", position: "ST", x: 65, y: 16 },
    ],
  },
];

export function formationById(id: string): Formation {
  return FORMATIONS.find((f) => f.id === id) ?? FORMATIONS[0];
}

/** Posições vizinhas: jogam ali com pouca perda (lado oposto, faixa ao lado). */
const NEIGHBORS: Record<Position, Position[]> = {
  GK: [],
  CB: ["DM", "LB", "RB"],
  LB: ["RB", "CB", "LW"],
  RB: ["LB", "CB", "RW"],
  DM: ["CM", "CB"],
  CM: ["DM", "AM"],
  AM: ["CM", "LW", "RW", "ST"],
  LW: ["RW", "AM", "ST", "LB"],
  RW: ["LW", "AM", "ST", "RB"],
  ST: ["AM", "LW", "RW"],
};

export const FIT = { natural: 1, secondary: 0.95, neighbor: 0.88, otherSector: 0.75, goalkeeperSwap: 0.4 } as const;

/** Multiplicador sobre o overall de um jogador jogando numa posição. */
export function positionFit(player: Pick<SquadMember, "position" | "secondaryPositions">, slot: Position): number {
  if (player.position === slot) return FIT.natural;
  if ((player.position === "GK") !== (slot === "GK")) return FIT.goalkeeperSwap;
  if (player.secondaryPositions.includes(slot)) return FIT.secondary;
  if (NEIGHBORS[player.position].includes(slot)) return FIT.neighbor;
  if (SECTOR_OF[player.position] === SECTOR_OF[slot]) return FIT.neighbor;
  return FIT.otherSector;
}

export const BENCH_SIZE = 9;
export const MIN_BENCH = 5;

/**
 * Escalação automática: preenche cada vaga com o melhor encaixe (overall x encaixe),
 * começando pelas vagas mais difíceis (goleiro, depois laterais e pontas).
 * Quem chega no meio do ano só entra se faltar opção.
 */
export function autoLineup(
  members: SquadMember[],
  formationId: string,
  foreign?: { limit: number | null; isForeign: (m: SquadMember) => boolean },
): Lineup {
  const formation = formationById(formationId);
  const used = new Set<string>();
  const starters: Record<string, string | null> = {};
  const order = [...formation.slots].sort((a, b) => scarcity(a.position) - scarcity(b.position));
  const score = (m: SquadMember, pos: Position) => m.overall * positionFit(m, pos) - (m.arrival === "mid_season" ? 15 : 0);

  for (const slot of order) {
    const best = members
      .filter((m) => !used.has(m.id))
      .sort((a, b) => score(b, slot.position) - score(a, slot.position))[0];
    starters[slot.id] = best ? best.id : null;
    if (best) used.add(best.id);
  }

  // Banco: um goleiro reserva primeiro, depois os melhores restantes,
  // sem passar do limite de estrangeiros relacionados (quando informado).
  const rest = members.filter((m) => !used.has(m.id)).sort((a, b) => b.overall - a.overall);
  const backupGk = rest.find((m) => m.position === "GK");
  const candidates = [...(backupGk ? [backupGk] : []), ...rest.filter((m) => m !== backupGk)];
  let foreignCount = foreign ? members.filter((m) => used.has(m.id) && foreign.isForeign(m)).length : 0;
  const bench: string[] = [];
  for (const m of candidates) {
    if (bench.length >= BENCH_SIZE) break;
    if (foreign && foreign.limit !== null && foreign.isForeign(m)) {
      if (foreignCount >= foreign.limit) continue;
      foreignCount++;
    }
    bench.push(m.id);
  }

  return { formation: formation.id, starters, bench };
}

function scarcity(pos: Position): number {
  return ({ GK: 0, LB: 1, RB: 1, LW: 2, RW: 2, ST: 3, CB: 4, DM: 5, AM: 5, CM: 6 } as const)[pos];
}

/** Remove do XI quem saiu do elenco e garante a forma certa para a formação. */
export function sanitizeLineup(lineup: Lineup, members: SquadMember[]): Lineup {
  const ids = new Set(members.map((m) => m.id));
  const formation = formationById(lineup.formation);
  const seen = new Set<string>();
  const keep = (id: string | null | undefined) => {
    if (!id || !ids.has(id) || seen.has(id)) return null;
    seen.add(id);
    return id;
  };
  const starters = Object.fromEntries(formation.slots.map((s) => [s.id, keep(lineup.starters[s.id])]));
  const bench = lineup.bench.map(keep).filter((x): x is string => x !== null).slice(0, BENCH_SIZE);
  return { formation: formation.id, starters, bench };
}

/** Troca a formação mantendo quem já estava escalado, nas vagas que mais combinam. */
export function changeFormation(lineup: Lineup, members: SquadMember[], formationId: string): Lineup {
  const byId = new Map(members.map((m) => [m.id, m]));
  const current = Object.values(lineup.starters).filter((x): x is string => !!x).map((id) => byId.get(id)!).filter(Boolean);
  const auto = autoLineup(current, formationId);
  return { ...auto, bench: lineup.bench };
}

export type LineupIssueCode = "empty_slot" | "short_bench" | "no_goalkeeper_in_goal" | "out_of_position" | "foreigners_over_limit" | "mid_season_starter";

export interface LineupIssue {
  level: "error" | "warning";
  code: LineupIssueCode;
  slotId?: string;
  playerId?: string;
  detail?: string;
}

export interface LineupSummary {
  formation: Formation;
  /** Força média do XI já com o encaixe de posição. */
  strength: number;
  value: Money;
  foreigners: number;
  foreignLimit: number | null;
  issues: LineupIssue[];
}

export function summarizeLineup(plan: Plan, catalog: Catalog, lineup: Lineup): LineupSummary {
  const members = resultingSquad(plan, catalog);
  const byId = new Map(members.map((m) => [m.id, m]));
  const formation = formationById(lineup.formation);
  const club = catalog.clubs.get(plan.clubId);
  const league = club ? catalog.leagues.get(club.leagueId) : undefined;
  const country = league?.country ?? "BR";
  const issues: LineupIssue[] = [];

  let total = 0;
  let value = 0;
  let filled = 0;
  for (const slot of formation.slots) {
    const m = lineup.starters[slot.id] ? byId.get(lineup.starters[slot.id]!) : undefined;
    if (!m) {
      issues.push({ level: "error", code: "empty_slot", slotId: slot.id });
      continue;
    }
    filled++;
    const fit = positionFit(m, slot.position);
    total += m.overall * fit;
    value += m.marketValue;
    if (slot.position === "GK" && m.position !== "GK") {
      issues.push({ level: "error", code: "no_goalkeeper_in_goal", slotId: slot.id, playerId: m.id });
    } else if (fit < 1) {
      issues.push({ level: "warning", code: "out_of_position", slotId: slot.id, playerId: m.id });
    }
    if (m.arrival === "mid_season") issues.push({ level: "warning", code: "mid_season_starter", playerId: m.id });
  }

  const bench = lineup.bench.filter((id) => byId.has(id));
  if (bench.length < MIN_BENCH) {
    issues.push({ level: "error", code: "short_bench", detail: `${bench.length}/${MIN_BENCH}` });
  }

  const matchday = [...Object.values(lineup.starters), ...bench].filter((id): id is string => !!id && byId.has(id));
  const foreigners = matchday.filter((id) => isForeign(byId.get(id)!.nationalities, country)).length;
  const foreignLimit = league?.foreignLimit ?? null;
  if (foreignLimit !== null && foreigners > foreignLimit) {
    issues.push({ level: "warning", code: "foreigners_over_limit", detail: `${foreigners}/${foreignLimit}` });
  }

  return {
    formation,
    strength: filled ? Math.round((total / filled) * 10) / 10 : 0,
    value,
    foreigners,
    foreignLimit,
    issues,
  };
}

/** Troca dois lugares do XI: vaga do campo, banco ou fora (não relacionado). */
export type Place = { kind: "slot"; slotId: string } | { kind: "bench"; index: number } | { kind: "out"; playerId: string };

export function playerAt(lineup: Lineup, place: Place): string | null {
  if (place.kind === "slot") return lineup.starters[place.slotId] ?? null;
  if (place.kind === "bench") return lineup.bench[place.index] ?? null;
  return place.playerId;
}

/**
 * Troca o conteúdo de dois lugares. Um lugar de banco com índice = tamanho do banco
 * é uma vaga nova no fim; um lugar "out" é um jogador não relacionado.
 */
/** Tira o jogador de um lugar do XI ou do banco (fica não relacionado). */
export function removeFromLineup(lineup: Lineup, place: Place): Lineup {
  if (place.kind === "slot") return { ...lineup, starters: { ...lineup.starters, [place.slotId]: null } };
  if (place.kind === "bench") return { ...lineup, bench: lineup.bench.filter((_, i) => i !== place.index) };
  return lineup;
}

/** Escalação automática respeitando o limite de estrangeiros do clube do plano. */
export function autoLineupFor(plan: Plan, catalog: Catalog, formationId: string): Lineup {
  const club = catalog.clubs.get(plan.clubId);
  const league = club ? catalog.leagues.get(club.leagueId) : undefined;
  const country = league?.country ?? "BR";
  return autoLineup(resultingSquad(plan, catalog), formationId, {
    limit: league?.foreignLimit ?? null,
    isForeign: (m) => isForeign(m.nationalities, country),
  });
}

export function swapPlaces(lineup: Lineup, a: Place, b: Place): Lineup {
  const pa = playerAt(lineup, a);
  const pb = playerAt(lineup, b);
  const starters = { ...lineup.starters };
  const bench: (string | null)[] = [...lineup.bench];
  const put = (place: Place, id: string | null) => {
    if (place.kind === "slot") starters[place.slotId] = id;
    else if (place.kind === "bench") bench[place.index] = id;
  };
  put(a, pb);
  put(b, pa);
  return { ...lineup, starters, bench: bench.filter((x): x is string => !!x).slice(0, BENCH_SIZE) };
}
