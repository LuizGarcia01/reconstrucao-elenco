import { describe, expect, it } from "vitest";

import { ageOn, SNAPSHOT_VERSION, validateSnapshot, type Snapshot } from "./catalog";

// Dados de teste: inventados, só para exercitar o validador.
function baseSnapshot(): Snapshot {
  return {
    version: SNAPSHOT_VERSION,
    season: "2026",
    source: "teste",
    generatedAt: "2026-11-14T00:00:00Z",
    leagues: [{ id: "br-a", name: "Liga Teste", country: "BR", tier: 1, foreignLimit: 9 }],
    clubs: [
      { id: "clube-a", name: "Clube A", shortName: "CLA", leagueId: "br-a", color: "#1a8a3c" },
      { id: "clube-b", name: "Clube B", shortName: "CLB", leagueId: "br-a", color: "#cc0000" },
    ],
    players: [
      {
        id: "t:1",
        name: "Jogador Um",
        shortName: "Um",
        birthDate: "2000-05-10",
        nationalities: ["BR"],
        position: "ST",
        secondaryPositions: ["LW"],
        foot: "right",
        clubId: "clube-a",
        marketValue: 5000,
        contractUntil: "2028-12-31",
        loanFromClubId: null,
      },
    ],
  };
}

describe("validateSnapshot", () => {
  it("aceita um retrato íntegro", () => {
    expect(validateSnapshot(baseSnapshot())).toEqual([]);
  });

  it("acusa clube inexistente, id repetido e valor fracionado", () => {
    const s = baseSnapshot();
    s.players.push({ ...s.players[0], clubId: "fantasma", marketValue: 1.5 });
    const paths = validateSnapshot(s).map((i) => i.path);
    expect(paths).toContain("players[1].id");
    expect(paths).toContain("players[1].clubId");
    expect(paths).toContain("players[1].marketValue");
  });

  it("acusa liga inexistente e cor inválida", () => {
    const s = baseSnapshot();
    s.clubs[0] = { ...s.clubs[0], leagueId: "nada", color: "verde" };
    const paths = validateSnapshot(s).map((i) => i.path);
    expect(paths).toEqual(expect.arrayContaining(["clubs[0].leagueId", "clubs[0].color"]));
  });

  it("acusa empréstimo do próprio clube", () => {
    const s = baseSnapshot();
    s.players[0].loanFromClubId = "clube-a";
    expect(validateSnapshot(s).map((i) => i.path)).toContain("players[0].loanFromClubId");
  });
});

describe("ageOn", () => {
  it("conta só aniversários já completados", () => {
    expect(ageOn("2000-05-10", "2026-05-09")).toBe(25);
    expect(ageOn("2000-05-10", "2026-05-10")).toBe(26);
  });
});
