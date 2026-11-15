/**
 * Simulação da temporada. Tudo com semente: mesmo plano, mesmo campeonato.
 * Números de partida da spec (seção 7), calibrados com o retrato real (ver sim.test.ts).
 */
import { SECTOR_OF, type Player, type Sector } from "./catalog";
import { autoLineup, autoLineupFor, formationById, positionFit, sanitizeLineup } from "./lineup";
import { isForeign, resultingSquad, type Catalog, type Lineup, type Plan, type SquadMember } from "./plan";
import { overallFrom } from "./rating";
import { createRng, hashSeed, type Rng } from "./rng";
import { ageOn } from "./catalog";
import { SEASON_START } from "./season";

export interface TeamStrength {
  defense: number;
  midfield: number;
  attack: number;
  overall: number;
}

/** Quanto o banco pesa em cada setor. */
export const BENCH_WEIGHT = 0.1;
/** Gols esperados de mandante e visitante com forças iguais. */
export const HOME_BASE = 1.45;
export const AWAY_BASE = 1.15;
/** Divisor da diferença de força no expoente: menor = favorito vence mais. */
export const STRENGTH_SCALE = 22;

export const ZONES = { title: 1, continental: 6, relegation: 4 } as const;

/** Força por setor de um XI. Quem chega no meio do ano vale metade (joga meio campeonato). */
export function teamStrength(lineup: Lineup, members: SquadMember[]): TeamStrength {
  const byId = new Map(members.map((m) => [m.id, m]));
  const formation = formationById(lineup.formation);
  const bench = lineup.bench.map((id) => byId.get(id)).filter((m): m is SquadMember => !!m);
  const benchAvg = bench.length ? bench.reduce((s, m) => s + m.overall, 0) / bench.length : 40;

  const sums: Record<"defense" | "midfield" | "attack", number[]> = { defense: [], midfield: [], attack: [] };
  for (const slot of formation.slots) {
    const id = lineup.starters[slot.id];
    const m = id ? byId.get(id) : undefined;
    let value = m ? m.overall * positionFit(m, slot.position) : 30; // vaga vazia pesa muito
    if (m?.arrival === "mid_season") value = (value + benchAvg) / 2;
    sums[sectorGroup(SECTOR_OF[slot.position])].push(value);
  }
  const mix = (xs: number[]) => {
    const starters = xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 40;
    return (1 - BENCH_WEIGHT) * starters + BENCH_WEIGHT * benchAvg;
  };
  const defense = mix(sums.defense);
  const midfield = mix(sums.midfield);
  const attack = mix(sums.attack);
  return { defense, midfield, attack, overall: (defense + midfield + attack) / 3 };
}

function sectorGroup(s: Sector): "defense" | "midfield" | "attack" {
  return s === "GK" || s === "DEF" ? "defense" : s === "MID" ? "midfield" : "attack";
}

/** Sorteio de Poisson (Knuth): bom para médias pequenas como gols. */
export function poisson(rng: Rng, lambda: number): number {
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > limit);
  return k - 1;
}

export interface MatchResult {
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
}

export function expectedGoals(home: TeamStrength, away: TeamStrength): [number, number] {
  const h = HOME_BASE * Math.exp((home.attack + home.midfield - away.defense - away.midfield) / STRENGTH_SCALE / 2);
  const a = AWAY_BASE * Math.exp((away.attack + away.midfield - home.defense - home.midfield) / STRENGTH_SCALE / 2);
  return [h, a];
}

export function simulateMatch(homeId: string, awayId: string, home: TeamStrength, away: TeamStrength, rng: Rng): MatchResult {
  const [lh, la] = expectedGoals(home, away);
  return { home: homeId, away: awayId, homeGoals: poisson(rng, lh), awayGoals: poisson(rng, la) };
}

/** Tabela de turno e returno pelo método do círculo: cada clube joga uma vez por rodada. */
export function roundRobin(teams: string[]): [string, string][][] {
  const list = teams.length % 2 ? [...teams, "__folga__"] : [...teams];
  const n = list.length;
  const rounds: [string, string][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const round: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i];
      const b = list[n - 1 - i];
      if (a === "__folga__" || b === "__folga__") continue;
      round.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(round);
    list.splice(1, 0, list.pop()!);
  }
  const returno = rounds.map((round) => round.map(([a, b]) => [b, a] as [string, string]));
  return [...rounds, ...returno];
}

export interface TableRow {
  clubId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export function sortTable(rows: TableRow[]): TableRow[] {
  return [...rows].sort(
    (a, b) =>
      b.points - a.points ||
      b.won - a.won ||
      b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
      b.goalsFor - a.goalsFor ||
      a.clubId.localeCompare(b.clubId),
  );
}

export interface LeagueResult {
  rounds: MatchResult[][];
  table: TableRow[]; // final, ordenada
  position: number; // do clube do plano (1 = campeão)
}

/** Forças de todos os clubes da liga: o do plano pelo XI escolhido, os outros pelo melhor XI automático. */
export function leagueStrengths(plan: Plan, catalog: Catalog): Map<string, TeamStrength> {
  const club = catalog.clubs.get(plan.clubId);
  if (!club) throw new Error(`clube ${plan.clubId} não existe`);
  const leagueId = club.leagueId;
  const taken = new Set(plan.signings.map((s) => s.playerId));
  const strengths = new Map<string, TeamStrength>();

  const members = resultingSquad(plan, catalog);
  const lineup = plan.lineup ? sanitizeLineup(plan.lineup, members) : autoLineupFor(plan, catalog, "433");
  strengths.set(plan.clubId, teamStrength(lineup, members));

  const league = catalog.leagues.get(leagueId);
  const country = league?.country ?? "BR";
  for (const other of catalog.snapshot.clubs) {
    if (other.leagueId !== leagueId || other.id === plan.clubId) continue;
    // Os rivais perdem quem o usuário contratou; o resto do elenco joga.
    const squad = (catalog.squads.get(other.id) ?? []).filter((p) => !taken.has(p.id)).map(memberOf);
    const l = autoLineup(squad, "433", { limit: league?.foreignLimit ?? null, isForeign: (m) => isForeign(m.nationalities, country) });
    strengths.set(other.id, teamStrength(l, squad));
  }
  return strengths;
}

function memberOf(p: Player): SquadMember {
  return {
    id: p.id,
    name: p.name,
    position: p.position,
    marketValue: p.marketValue,
    salary: 0,
    nationalities: p.nationalities,
    origin: "kept",
    arrival: "window",
    overall: overallFrom(p.marketValue, p.birthDate ? ageOn(p.birthDate, SEASON_START) : null),
    secondaryPositions: p.secondaryPositions,
  };
}

export function simulateLeagueWith(strengths: Map<string, TeamStrength>, focusClubId: string, seed: number): LeagueResult {
  const rng = createRng(seed);
  const teams = [...strengths.keys()].sort();
  const schedule = roundRobin(teams);
  const rows = new Map<string, TableRow>(
    teams.map((id) => [id, { clubId: id, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }]),
  );
  const rounds: MatchResult[][] = [];
  for (const round of schedule) {
    const results = round.map(([h, a]) => simulateMatch(h, a, strengths.get(h)!, strengths.get(a)!, rng));
    for (const r of results) applyResult(rows, r);
    rounds.push(results);
  }
  const table = sortTable([...rows.values()]);
  return { rounds, table, position: table.findIndex((r) => r.clubId === focusClubId) + 1 };
}

function applyResult(rows: Map<string, TableRow>, r: MatchResult) {
  const h = rows.get(r.home)!;
  const a = rows.get(r.away)!;
  h.played++;
  a.played++;
  h.goalsFor += r.homeGoals;
  h.goalsAgainst += r.awayGoals;
  a.goalsFor += r.awayGoals;
  a.goalsAgainst += r.homeGoals;
  if (r.homeGoals > r.awayGoals) {
    h.won++;
    a.lost++;
    h.points += 3;
  } else if (r.homeGoals < r.awayGoals) {
    a.won++;
    h.lost++;
    a.points += 3;
  } else {
    h.drawn++;
    a.drawn++;
    h.points++;
    a.points++;
  }
}

/** Tabela até uma rodada (1..38), para mostrar a temporada rodada a rodada. */
export function tableAfter(result: LeagueResult, round: number): TableRow[] {
  const rows = new Map<string, TableRow>(
    result.table.map((r) => [r.clubId, { clubId: r.clubId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }]),
  );
  for (const results of result.rounds.slice(0, round)) for (const r of results) applyResult(rows, r);
  return sortTable([...rows.values()]);
}

/** Semente do plano: hash das decisões que mudam o resultado. */
export function planSeed(plan: Plan): number {
  return hashSeed(
    JSON.stringify({
      c: plan.clubId,
      d: plan.decisions,
      s: plan.signings,
      x: plan.customPlayers,
      l: plan.lineup ?? null,
    }),
  );
}

export function simulateLeague(plan: Plan, catalog: Catalog, seed = planSeed(plan)): LeagueResult {
  return simulateLeagueWith(leagueStrengths(plan, catalog), plan.clubId, seed);
}

export interface ManySummary {
  runs: number;
  avgPosition: number;
  titlePct: number;
  continentalPct: number;
  relegationPct: number;
  /** positions[i] = quantas vezes terminou em i+1º */
  positions: number[];
}

export function simulateMany(plan: Plan, catalog: Catalog, seed = planSeed(plan), runs = 100): ManySummary {
  const strengths = leagueStrengths(plan, catalog);
  const n = strengths.size;
  const positions = Array.from({ length: n }, () => 0);
  for (let i = 0; i < runs; i++) {
    const { position } = simulateLeagueWith(strengths, plan.clubId, (seed + i + 1) >>> 0);
    positions[position - 1]++;
  }
  const pct = (from: number, to: number) =>
    Math.round((positions.slice(from, to).reduce((s, x) => s + x, 0) / runs) * 1000) / 10;
  return {
    runs,
    avgPosition: Math.round((positions.reduce((s, c, i) => s + c * (i + 1), 0) / runs) * 10) / 10,
    titlePct: pct(0, ZONES.title),
    continentalPct: pct(0, ZONES.continental),
    relegationPct: pct(n - ZONES.relegation, n),
    positions,
  };
}
