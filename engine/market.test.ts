import { describe, expect, it } from "vitest";

import { makeCatalog, player } from "./fixtures.test-util";
import { canAfford, marketRows, spendable } from "./market";
import { newPlan } from "./plan";

describe("marketRows", () => {
  it("lista só jogadores de fora do clube e marca quem já foi contratado", () => {
    const livre = player(null, "ST", { marketValue: 2000 });
    const cat = makeCatalog([livre]);
    const plan = newPlan("casa", { mode: "unlimited", amount: 0 });
    plan.signings.push({ playerId: livre.id, fee: 0, salary: 1, arrival: "window" });
    const rows = marketRows(plan, cat);
    expect(rows.every((r) => r.player.clubId !== "casa")).toBe(true);
    expect(rows).toHaveLength(19); // 18 do "fora" + 1 livre
    const r = rows.find((x) => x.player.id === livre.id)!;
    expect(r.signed).toBe(true);
    expect(r.defaults.fee).toBe(0);
  });
});

describe("canAfford", () => {
  it("respeita o caixa nos modos com teto e libera tudo no sem teto", () => {
    const cat = makeCatalog();
    const custom = newPlan("casa", { mode: "custom", amount: 3000 });
    expect(canAfford(custom, cat, 3000)).toBe(true);
    expect(canAfford(custom, cat, 3001)).toBe(false);

    const zero = newPlan("casa", { mode: "zero", amount: 0 });
    expect(canAfford(zero, cat, 1)).toBe(false);
    zero.decisions[cat.squads.get("casa")![3].id] = { kind: "sell", fee: 1500 };
    expect(spendable(zero, cat)).toBe(1500);
    expect(canAfford(zero, cat, 1500)).toBe(true);

    const livre = newPlan("casa", { mode: "unlimited", amount: 0 });
    expect(canAfford(livre, cat, 10_000_000)).toBe(true);
  });
});
