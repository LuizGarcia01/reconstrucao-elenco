/**
 * Visão do elenco atual para a tela: uma linha por jogador, com o efeito do plano.
 */
import { ageOn, SECTOR_OF, type Player, type Sector } from "./catalog";
import type { Money } from "./money";
import { decisionFor, departureReason, isForeign, salaryOf, type Catalog, type Decision, type DepartureReason, type Plan } from "./plan";
import { overallFrom } from "./rating";
import { estimatedSalary } from "./salary";
import { contractStatus, SEASON_START, type ContractStatus } from "./season";

export interface SquadRow {
  player: Player;
  sector: Sector;
  age: number | null;
  overall: number;
  salary: Money;
  foreign: boolean;
  contract: ContractStatus;
  decision: Decision;
  leaving: DepartureReason | null;
}

const SECTOR_ORDER: Sector[] = ["GK", "DEF", "MID", "ATT"];

export function squadRows(plan: Plan, catalog: Catalog): SquadRow[] {
  const club = catalog.clubs.get(plan.clubId);
  const country = club ? (catalog.leagues.get(club.leagueId)?.country ?? "BR") : "BR";
  const rows = (catalog.squads.get(plan.clubId) ?? []).map((p) => {
    const age = p.birthDate ? ageOn(p.birthDate, SEASON_START) : null;
    return {
      player: p,
      sector: SECTOR_OF[p.position],
      age,
      overall: overallFrom(p.marketValue, age),
      salary: salaryOf(plan, p),
      foreign: isForeign(p.nationalities, country),
      contract: contractStatus(p.contractUntil),
      decision: decisionFor(plan, p.id),
      leaving: departureReason(plan, p),
    };
  });
  return rows.sort(
    (a, b) => SECTOR_ORDER.indexOf(a.sector) - SECTOR_ORDER.indexOf(b.sector) || b.overall - a.overall,
  );
}

/** Renovação padrão: mais 2 temporadas, com o salário estimado. */
export function defaultRenewal(player: Player): { until: string; salary: Money } {
  return { until: "2028-12-31", salary: estimatedSalary(player.marketValue) };
}

/** Decisões para renovar todo mundo cujo contrato vence antes de 2027 e ainda está "fica". */
export function renewAllExpiring(plan: Plan, catalog: Catalog): Record<string, Decision> {
  const out: Record<string, Decision> = {};
  for (const p of catalog.squads.get(plan.clubId) ?? []) {
    const d = decisionFor(plan, p.id);
    if (d.kind === "keep" && !d.renewal && contractStatus(p.contractUntil) === "expired") {
      out[p.id] = { kind: "keep", renewal: defaultRenewal(p) };
    }
  }
  return out;
}

export interface SquadCounts {
  staying: number;
  leaving: number;
  arriving: number;
}

export function squadCounts(plan: Plan, catalog: Catalog): SquadCounts {
  const own = catalog.squads.get(plan.clubId) ?? [];
  const leaving = own.filter((p) => departureReason(plan, p) !== null).length;
  return {
    staying: own.length - leaving,
    leaving,
    arriving: plan.signings.length + plan.customPlayers.length,
  };
}
