import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  autoLineupFor,
  buildCatalog,
  newPlan,
  planSeed,
  renewAllExpiring,
  sanitizeSharedPlan,
  simulateLeague,
  type Snapshot,
} from "@engine";

import { packPlan, unpackPlan } from "./share-link";

const snapshot = JSON.parse(readFileSync("data/snapshot.json", "utf-8")) as Snapshot;
const catalog = buildCatalog(snapshot);

function richPlan() {
  const plan = newPlan("gremio", { mode: "custom", amount: 25_500 });
  plan.decisions = renewAllExpiring(plan, catalog);
  const own = catalog.squads.get("gremio")!;
  plan.decisions[own[0].id] = { kind: "sell", fee: 4200 };
  plan.decisions[own[1].id] = { kind: "loan_out" };
  plan.decisions[own[2].id] = { kind: "release" };
  const alvos = snapshot.players.filter((p) => p.clubId === "flamengo").slice(0, 3);
  plan.signings = alvos.map((p, i) => ({ playerId: p.id, fee: p.marketValue, salary: 900 + i, arrival: i === 2 ? "mid_season" : "window" }));
  plan.customPlayers = [{ id: "custom:abc", name: "Kauã da Base", position: "GK", marketValue: 0, salary: 60, origin: "youth" }];
  // Ordem das vagas propositalmente embaralhada, como acontece no app.
  const l = autoLineupFor(plan, catalog, "4231");
  plan.lineup = { ...l, starters: Object.fromEntries(Object.entries(l.starters).reverse()) };
  return plan;
}

describe("link do plano", () => {
  it("ida e volta mantém o plano e o resultado da simulação", async () => {
    const plan = richPlan();
    const packed = await packPlan(plan);
    expect(packed).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(packed.length).toBeLessThan(2000);

    const back = await unpackPlan(packed);
    expect(back.clubId).toBe(plan.clubId);
    expect(back.budget).toEqual(plan.budget);
    expect(back.decisions).toEqual(plan.decisions);
    expect(back.signings).toEqual(plan.signings);
    expect(back.customPlayers.map((c) => c.name)).toEqual(["Kauã da Base"]);
    // Mesma tabela final em outro aparelho (ids de jogadores criados mudam, o resto não).
    // Mesma tabela final em outro aparelho, com o plano exatamente como chegou pelo link.
    const a = simulateLeague(plan, catalog);
    const b = simulateLeague(back, catalog);
    expect(planSeed(back)).toBe(planSeed(plan));
    expect(b.table).toEqual(a.table);
  });

  it("ignora ids que não existem mais e recusa clube inexistente", async () => {
    const plan = richPlan();
    plan.signings.push({ playerId: "tm:999999999", fee: 1, salary: 1, arrival: "window" });
    plan.decisions["tm:888888888"] = { kind: "sell", fee: 1 };
    const back = sanitizeSharedPlan(await unpackPlan(await packPlan(plan)), catalog)!;
    expect(back.signings.some((s) => s.playerId === "tm:999999999")).toBe(false);
    expect(back.decisions["tm:888888888"]).toBeUndefined();

    expect(sanitizeSharedPlan({ ...back, clubId: "nao-existe" }, catalog)).toBeNull();
    await expect(unpackPlan("lixo")).rejects.toThrow();
  });
});
