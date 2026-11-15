import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import type { Snapshot } from "./catalog";
import { makeCatalog } from "./fixtures.test-util";
import { buildCatalog, newPlan } from "./plan";
import { createRng } from "./rng";
import {
  expectedGoals,
  planSeed,
  poisson,
  roundRobin,
  simulateLeague,
  simulateMany,
  tableAfter,
  teamStrength,
} from "./sim";
import { renewAllExpiring } from "./squad-view";
import { autoLineup } from "./lineup";
import { resultingSquad } from "./plan";

describe("roundRobin", () => {
  it("20 clubes: 38 rodadas, 10 jogos por rodada, cada par se enfrenta em casa e fora", () => {
    const teams = Array.from({ length: 20 }, (_, i) => `c${i}`);
    const rounds = roundRobin(teams);
    expect(rounds).toHaveLength(38);
    for (const r of rounds) {
      expect(r).toHaveLength(10);
      expect(new Set(r.flat()).size).toBe(20);
    }
    const pairs = new Set(rounds.flat().map(([h, a]) => `${h}>${a}`));
    expect(pairs.size).toBe(380);
  });
});

describe("poisson", () => {
  it("tem a média certa", () => {
    const rng = createRng(1);
    const n = 20_000;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += poisson(rng, 1.4);
    expect(sum / n).toBeGreaterThan(1.35);
    expect(sum / n).toBeLessThan(1.45);
  });
});

describe("partida", () => {
  it("mandante e time mais forte esperam mais gols", () => {
    const igual = { defense: 70, midfield: 70, attack: 70, overall: 70 };
    const forte = { defense: 78, midfield: 78, attack: 78, overall: 78 };
    const [h, a] = expectedGoals(igual, igual);
    expect(h).toBeGreaterThan(a);
    const [hf, af] = expectedGoals(forte, igual);
    expect(hf).toBeGreaterThan(h);
    expect(af).toBeLessThan(a);
  });
});

describe("teamStrength", () => {
  it("cai com jogador fora de posição", () => {
    const cat = makeCatalog();
    const members = resultingSquad(newPlan("casa", { mode: "unlimited", amount: 0 }), cat);
    const l = autoLineup(members, "433");
    const st = members.find((m) => m.position === "ST")!;
    const ruim = { ...l, starters: { ...l.starters, gk: st.id } };
    expect(teamStrength(ruim, members).defense).toBeLessThan(teamStrength(l, members).defense);
  });
});

const snapshot = JSON.parse(readFileSync("data/snapshot.json", "utf-8")) as Snapshot;
const catalog = buildCatalog(snapshot);

describe("liga com o retrato real", () => {
  it("o mesmo plano gera sempre a mesma tabela final", () => {
    const plan = newPlan("gremio", { mode: "unlimited", amount: 0 });
    const a = simulateLeague(plan, catalog);
    const b = simulateLeague(plan, catalog);
    expect(a.table).toEqual(b.table);
    expect(planSeed(plan)).toBe(planSeed(structuredClone(plan)));
  });

  it("tabela fecha: 38 jogos por clube, pontos e saldo consistentes, rodada a rodada chega na final", () => {
    const r = simulateLeague(newPlan("santos", { mode: "unlimited", amount: 0 }), catalog);
    expect(r.table).toHaveLength(20);
    for (const row of r.table) {
      expect(row.played).toBe(38);
      expect(row.won + row.drawn + row.lost).toBe(38);
      expect(row.points).toBe(row.won * 3 + row.drawn);
    }
    expect(r.table.reduce((s, x) => s + x.goalsFor, 0)).toBe(r.table.reduce((s, x) => s + x.goalsAgainst, 0));
    expect(tableAfter(r, 38)).toEqual(r.table);
    expect(tableAfter(r, 1).every((x) => x.played === 1)).toBe(true);
  });

  it("calibragem: o clube mais forte fica no topo na maioria das 100 temporadas, mas não em todas", () => {
    const plan = newPlan("palmeiras", { mode: "unlimited", amount: 0 });
    plan.decisions = renewAllExpiring(plan, catalog);
    const m = simulateMany(plan, catalog, 42, 100);
    expect(m.continentalPct).toBeGreaterThan(60);
    expect(m.titlePct).toBeGreaterThan(10);
    expect(m.titlePct).toBeLessThan(70);
    expect(m.relegationPct).toBe(0);
  });

  it("reforçar o time melhora a posição média", () => {
    const base = newPlan("gremio", { mode: "unlimited", amount: 0 });
    base.decisions = renewAllExpiring(base, catalog);
    const caros = [...snapshot.players]
      .filter((p) => p.clubId !== "gremio")
      .sort((a, b) => b.marketValue - a.marketValue)
      .slice(0, 6);
    const reforcado = { ...base, signings: caros.map((p) => ({ playerId: p.id, fee: p.marketValue, salary: 0, arrival: "window" as const })) };
    const antes = simulateMany(base, catalog, 7, 100).avgPosition;
    const depois = simulateMany(reforcado, catalog, 7, 100).avgPosition;
    expect(depois).toBeLessThan(antes);
  });

  it("100 temporadas rodam rápido (alvo: menos de 5 s num celular intermediário)", () => {
    const t0 = performance.now();
    simulateMany(newPlan("bahia", { mode: "unlimited", amount: 0 }), catalog, 1, 100);
    expect(performance.now() - t0).toBeLessThan(1000);
  });
});
