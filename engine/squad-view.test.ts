import { describe, expect, it } from "vitest";

import { makeCatalog, player } from "./fixtures.test-util";
import { newPlan, resultingSquad } from "./plan";
import { renewAllExpiring, squadCounts, squadRows } from "./squad-view";
import { validatePlan } from "./validate";

describe("squadRows", () => {
  it("ordena por setor e marca quem sai", () => {
    const cat = makeCatalog();
    const plan = newPlan("casa", { mode: "unlimited", amount: 0 });
    const vendido = cat.squads.get("casa")![4];
    plan.decisions[vendido.id] = { kind: "sell", fee: 1000 };
    const rows = squadRows(plan, cat);
    expect(rows[0].sector).toBe("GK");
    expect(rows.at(-1)!.sector).toBe("ATT");
    expect(rows.find((r) => r.player.id === vendido.id)?.leaving).toBe("sold");
  });
});

describe("renewAllExpiring", () => {
  it("renova só quem vence e ainda não decidiu, e tira o aviso", () => {
    const vence1 = player("casa", "GK", { contractUntil: "2026-12-31" });
    const vence2 = player("casa", "ST", { contractUntil: "2026-06-30" });
    const vendidoVencendo = player("casa", "CB", { contractUntil: "2026-12-31" });
    const cat = makeCatalog([vence1, vence2, vendidoVencendo]);
    const plan = newPlan("casa", { mode: "unlimited", amount: 0 });
    plan.decisions[vendidoVencendo.id] = { kind: "release" };

    const batch = renewAllExpiring(plan, cat);
    expect(Object.keys(batch).sort()).toEqual([vence1.id, vence2.id].sort());

    Object.assign(plan.decisions, batch);
    expect(validatePlan(plan, cat).map((i) => i.code)).not.toContain("expiring_without_renewal");
    expect(resultingSquad(plan, cat).map((m) => m.id)).toEqual(expect.arrayContaining([vence1.id, vence2.id]));
  });
});

describe("squadCounts", () => {
  it("conta quem fica, sai e chega", () => {
    const cat = makeCatalog();
    const plan = newPlan("casa", { mode: "unlimited", amount: 0 });
    plan.decisions[cat.squads.get("casa")![0].id] = { kind: "loan_out" };
    plan.signings.push({ playerId: cat.squads.get("fora")![0].id, fee: 0, salary: 1, arrival: "window" });
    expect(squadCounts(plan, cat)).toEqual({ staying: 17, leaving: 1, arriving: 1 });
  });
});
