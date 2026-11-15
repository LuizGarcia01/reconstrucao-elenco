import { describe, expect, it } from "vitest";

import { balanceSheet } from "./balance";
import { computeCash } from "./finance";
import { makeCatalog, player } from "./fixtures.test-util";
import { newPlan } from "./plan";

describe("balanceSheet", () => {
  it("separa vendas, compras, chegadas e saídas sem valor, e os totais batem com o caixa", () => {
    const livre = player(null, "CB", { marketValue: 800 });
    const cat = makeCatalog([livre]);
    const casa = cat.squads.get("casa")!;
    const fora = cat.squads.get("fora")!;
    const plan = newPlan("casa", { mode: "custom", amount: 5000 });
    plan.decisions[casa[0].id] = { kind: "sell", fee: 3000 };
    plan.decisions[casa[1].id] = { kind: "sell", fee: 0 }; // venda por zero conta como saída sem valor
    plan.decisions[casa[2].id] = { kind: "loan_out" };
    plan.signings.push(
      { playerId: fora[3].id, fee: 4000, salary: 500, arrival: "window" },
      { playerId: livre.id, fee: 0, salary: 200, arrival: "window" },
    );
    plan.customPlayers.push({ id: "custom:1", name: "Garoto", position: "ST", marketValue: 0, salary: 60, origin: "youth" });

    const b = balanceSheet(plan, cat);
    expect(b.sales.map((l) => l.amount)).toEqual([3000]);
    expect(b.purchases.map((l) => l.amount)).toEqual([4000]);
    expect(b.freeArrivals.map((l) => l.detail).sort()).toEqual(["free", "youth"]);
    expect(b.freeDepartures.map((l) => l.detail).sort()).toEqual(["loaned_out", "sold"]);

    const cash = computeCash(plan, cat);
    expect(b.cash).toEqual(cash);
    const sum = (xs: { amount: number }[]) => xs.reduce((s, x) => s + x.amount, 0);
    expect(sum(b.sales)).toBe(cash.raised);
    expect(sum(b.purchases)).toBe(cash.spent);
    expect(cash.initial + sum(b.sales) - sum(b.purchases)).toBe(cash.balance);
  });
});
