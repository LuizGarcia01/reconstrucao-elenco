import { describe, expect, it } from "vitest";

import { makeCatalog, player } from "./fixtures.test-util";
import { autoLineup, autoLineupFor, FIT, removeFromLineup, positionFit, sanitizeLineup, summarizeLineup, swapPlaces } from "./lineup";
import { newPlan, resultingSquad } from "./plan";

const m = (position: Parameters<typeof positionFit>[0]["position"], secondaryPositions: string[] = []) =>
  ({ position, secondaryPositions }) as Parameters<typeof positionFit>[0];

describe("positionFit", () => {
  it("segue a tabela da spec", () => {
    expect(positionFit(m("ST"), "ST")).toBe(FIT.natural);
    expect(positionFit(m("ST", ["LW"]), "LW")).toBe(FIT.secondary);
    expect(positionFit(m("LW"), "RW")).toBe(FIT.neighbor);
    expect(positionFit(m("CM"), "DM")).toBe(FIT.neighbor);
    expect(positionFit(m("CB"), "ST")).toBe(FIT.otherSector);
    expect(positionFit(m("ST"), "GK")).toBe(FIT.goalkeeperSwap);
    expect(positionFit(m("GK"), "CB")).toBe(FIT.goalkeeperSwap);
  });
});

describe("autoLineup", () => {
  it("monta um XI completo, com goleiro no gol e banco com goleiro reserva", () => {
    const cat = makeCatalog();
    const plan = newPlan("casa", { mode: "unlimited", amount: 0 });
    const members = resultingSquad(plan, cat);
    const lineup = autoLineup(members, "433");
    const ids = Object.values(lineup.starters);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(11);
    expect(members.find((x) => x.id === lineup.starters.gk)?.position).toBe("GK");
    expect(lineup.bench).toHaveLength(7); // 18 - 11
    expect(members.find((x) => x.id === lineup.bench[0])?.position).toBe("GK");
    const s = summarizeLineup(plan, cat, lineup);
    expect(s.issues.filter((i) => i.level === "error")).toEqual([]);
  });
});

describe("summarizeLineup", () => {
  it("penaliza fora de posição, exige goleiro no gol e 5 reservas, e conta estrangeiros relacionados", () => {
    const extra = [player("casa", "ST", { nationalities: ["AR"] }), player("casa", "ST", { nationalities: ["UY"] }), player("casa", "ST", { nationalities: ["CO"] })];
    const cat = makeCatalog(extra);
    const plan = newPlan("casa", { mode: "unlimited", amount: 0 });
    const members = resultingSquad(plan, cat);
    const base = autoLineup(members, "433");
    const before = summarizeLineup(plan, cat, base).strength;

    // Atacante no gol: erro e força menor.
    const st = members.find((x) => x.position === "ST")!;
    const wrong = { ...base, starters: { ...base.starters, gk: st.id }, bench: base.bench.slice(0, 3) };
    const s = summarizeLineup(plan, cat, sanitizeLineup(wrong, members));
    const codes = s.issues.map((i) => i.code);
    expect(codes).toContain("no_goalkeeper_in_goal");
    expect(codes).toContain("short_bench");
    expect(s.strength).toBeLessThan(before);

    // Os 3 estrangeiros relacionados passam do limite de 2 do catálogo de teste.
    const comEstrangeiros = { ...base, bench: [...extra.map((p) => p.id), ...base.bench].slice(0, 9) };
    const s2 = summarizeLineup(plan, cat, comEstrangeiros);
    expect(s2.issues.find((i) => i.code === "foreigners_over_limit")?.detail).toBe("3/2");
  });
});

describe("swapPlaces e sanitizeLineup", () => {
  it("troca campo com banco, campo com fora e tira quem saiu do elenco", () => {
    const cat = makeCatalog();
    const plan = newPlan("casa", { mode: "unlimited", amount: 0 });
    const members = resultingSquad(plan, cat);
    const l = autoLineup(members, "433");
    const titular = l.starters.st!;
    const reserva = l.bench[2];

    const a = swapPlaces(l, { kind: "slot", slotId: "st" }, { kind: "bench", index: 2 });
    expect(a.starters.st).toBe(reserva);
    expect(a.bench[2]).toBe(titular);

    const foraId = "t:fora-qualquer";
    const b = swapPlaces(l, { kind: "bench", index: 0 }, { kind: "out", playerId: foraId });
    expect(b.bench).toContain(foraId);

    const c = swapPlaces(l, { kind: "slot", slotId: "st" }, { kind: "bench", index: l.bench.length });
    expect(c.starters.st).toBeNull();
    expect(c.bench.at(-1)).toBe(titular);

    plan.decisions[titular] = { kind: "release" };
    const clean = sanitizeLineup(l, resultingSquad(plan, cat));
    expect(clean.starters.st).toBeNull();
  });
});

describe("autoLineupFor e removeFromLineup", () => {
  it("não relaciona mais estrangeiros que o limite e permite tirar alguém só com toques", () => {
    const extra = ["AR", "UY", "CO", "PY"].map((n) => player("casa", "CM", { nationalities: [n], marketValue: 50 }));
    const cat = makeCatalog(extra);
    const plan = newPlan("casa", { mode: "unlimited", amount: 0 });
    const l = autoLineupFor(plan, cat, "433");
    const s = summarizeLineup(plan, cat, l);
    expect(s.foreigners).toBeLessThanOrEqual(2);

    const menos = removeFromLineup(l, { kind: "bench", index: 0 });
    expect(menos.bench).toHaveLength(l.bench.length - 1);
    const vazio = removeFromLineup(l, { kind: "slot", slotId: "st" });
    expect(vazio.starters.st).toBeNull();
  });
});
