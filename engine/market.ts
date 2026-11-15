/**
 * Mercado: jogadores que o clube pode contratar e se cabem no caixa.
 */
import { ageOn, SECTOR_OF, type Player, type Sector } from "./catalog";
import { computeCash, signingDefaults } from "./finance";
import type { Money } from "./money";
import { isForeign, type Catalog, type Plan, type Signing } from "./plan";
import { overallFrom } from "./rating";
import { contractStatus, SEASON_START, type ContractStatus } from "./season";

export interface MarketRow {
  player: Player;
  sector: Sector;
  age: number | null;
  overall: number;
  foreign: boolean;
  contract: ContractStatus;
  defaults: Pick<Signing, "fee" | "salary" | "arrival">;
  signed: boolean;
}

export function marketRows(plan: Plan, catalog: Catalog): MarketRow[] {
  const club = catalog.clubs.get(plan.clubId);
  const country = club ? (catalog.leagues.get(club.leagueId)?.country ?? "BR") : "BR";
  const signed = new Set(plan.signings.map((s) => s.playerId));
  return catalog.snapshot.players
    .filter((p) => p.clubId !== plan.clubId)
    .map((p) => {
      const age = p.birthDate ? ageOn(p.birthDate, SEASON_START) : null;
      return {
        player: p,
        sector: SECTOR_OF[p.position],
        age,
        overall: overallFrom(p.marketValue, age),
        foreign: isForeign(p.nationalities, country),
        contract: contractStatus(p.contractUntil),
        defaults: signingDefaults(p),
        signed: signed.has(p.id),
      };
    });
}

/** Quanto sobra no caixa para gastar. Infinity no modo sem teto. */
export function spendable(plan: Plan, catalog: Catalog): Money {
  const cash = computeCash(plan, catalog);
  return cash.limited ? cash.balance : Number.POSITIVE_INFINITY;
}

/** Uma contratação com esse valor cabe no caixa atual? */
export function canAfford(plan: Plan, catalog: Catalog, fee: Money): boolean {
  return fee <= spendable(plan, catalog);
}
