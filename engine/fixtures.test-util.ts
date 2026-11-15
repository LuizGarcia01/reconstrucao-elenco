// Catálogo de teste com dados inventados, para exercitar as regras do motor.
import { SNAPSHOT_VERSION, type Player, type Position, type Snapshot } from "./catalog";
import { buildCatalog } from "./plan";

let seq = 0;
export function player(clubId: string | null, position: Position, over: Partial<Player> = {}): Player {
  seq += 1;
  return {
    id: `t:${clubId ?? "livre"}-${seq}`,
    name: `Jogador ${seq}`,
    shortName: `J${seq}`,
    birthDate: "1998-01-01",
    nationalities: ["BR"],
    position,
    secondaryPositions: [],
    foot: "right",
    clubId,
    marketValue: 1000,
    contractUntil: "2029-12-31",
    loanFromClubId: null,
    ...over,
  };
}

/** Elenco de 18: 2 GK, 6 DEF, 6 MID, 4 ATT. */
export function squad(clubId: string): Player[] {
  const positions: Position[] = ["GK", "GK", "CB", "CB", "CB", "LB", "RB", "RB", "DM", "DM", "CM", "CM", "AM", "AM", "LW", "RW", "ST", "ST"];
  return positions.map((pos) => player(clubId, pos));
}

export function makeCatalog(extra: Player[] = []) {
  const snapshot: Snapshot = {
    version: SNAPSHOT_VERSION,
    season: "2026",
    source: "teste",
    generatedAt: "2026-11-15T00:00:00Z",
    leagues: [{ id: "br-a", name: "Liga Teste", country: "BR", tier: 1, foreignLimit: 2 }],
    clubs: [
      { id: "casa", name: "Casa", shortName: "CAS", leagueId: "br-a", color: "#006437" },
      { id: "fora", name: "Fora", shortName: "FOR", leagueId: "br-a", color: "#cc0000" },
    ],
    players: [...squad("casa"), ...squad("fora"), ...extra],
  };
  return buildCatalog(snapshot);
}
