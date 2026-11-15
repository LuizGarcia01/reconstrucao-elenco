import { describe, expect, it } from "vitest";

import { computeCash, computeLedger, computePayroll, presetBudget, signingDefaults } from "./finance";
import { makeCatalog, player } from "./fixtures.test-util";
import { newPlan, resultingSquad, type BudgetMode, type Plan } from "./plan";
import { estimatedSalary } from "./salary";

const MODES: BudgetMode[] = ["preset", "custom", "unlimited", "zero"];

function planWith(mode: BudgetMode, amount = 5000): Plan {
  return newPlan("casa", { mode, amount: mode === "zero" ? 0 : amount });
}

describe("caixa", () => {
  it("é sempre orçamento inicial + soma do extrato, em todos os modos", () => {
    const cat = makeCatalog();
    const [vendido] = cat.squads.get("casa")!;
    const alvo = cat.squads.get("fora")![5];
    for (const mode of MODES) {
      const plan = planWith(mode);
      plan.decisions[vendido.id] = { kind: "sell", fee: 3000 };
      plan.signings.push({ playerId: alvo.id, fee: 2500, salary: 300, arrival: "window" });
      const cash = computeCash(plan, cat);
      const ledgerSum = computeLedger(plan, cat).reduce((s, e) => s + e.amount, 0);
      expect(cash.balance).toBe(cash.initial + ledgerSum);
      expect(cash.raised).toBe(3000);
      expect(cash.spent).toBe(2500);
    }
  });

  it("começa em zero no modo caixa zero e no sem teto, e no valor dado nos outros", () => {
    const cat = makeCatalog();
    expect(computeCash(planWith("zero"), cat).initial).toBe(0);
    expect(computeCash(planWith("unlimited"), cat).initial).toBe(0);
    expect(computeCash(planWith("custom", 7000), cat).initial).toBe(7000);
    expect(computeCash(planWith("unlimited"), cat).limited).toBe(false);
  });

  it("empréstimo, dispensa e aposentadoria não mexem no caixa", () => {
    const cat = makeCatalog();
    const [a, b, c] = cat.squads.get("casa")!;
    const plan = planWith("custom");
    plan.decisions[a.id] = { kind: "loan_out" };
    plan.decisions[b.id] = { kind: "release" };
    plan.decisions[c.id] = { kind: "retire" };
    expect(computeLedger(plan, cat)).toEqual([]);
    expect(resultingSquad(plan, cat)).toHaveLength(15);
  });
});

describe("contratos", () => {
  it("contrato vencido sem renovação sai de graça; renovado fica com o novo salário", () => {
    const vencendo = player("casa", "ST", { contractUntil: "2026-12-31" });
    const cat = makeCatalog([vencendo]);
    const plan = planWith("custom");
    expect(resultingSquad(plan, cat).some((m) => m.id === vencendo.id)).toBe(false);

    plan.decisions[vencendo.id] = { kind: "keep", renewal: { until: "2029-12-31", salary: 999 } };
    const renovado = resultingSquad(plan, cat).find((m) => m.id === vencendo.id);
    expect(renovado?.salary).toBe(999);
  });

  it("contratação: sem clube e contrato vencido custam zero; pré-contrato chega no meio do ano", () => {
    expect(signingDefaults(player(null, "CB", { marketValue: 2000 })).fee).toBe(0);
    expect(signingDefaults(player("fora", "CB", { contractUntil: "2026-12-31" })).fee).toBe(0);
    const pre = signingDefaults(player("fora", "CB", { contractUntil: "2027-06-30" }));
    expect(pre).toMatchObject({ fee: 0, arrival: "mid_season" });
    const normal = signingDefaults(player("fora", "CB", { marketValue: 4000 }));
    expect(normal).toEqual({ fee: 4000, salary: estimatedSalary(4000), arrival: "window" });
  });
});

describe("folha", () => {
  it("soma quem fica e quem chega, por setor, com chegada no meio do ano pela metade", () => {
    const cat = makeCatalog();
    const plan = planWith("unlimited");
    const base = computePayroll(plan, cat);
    expect(base.total).toBe(18 * estimatedSalary(1000));

    const alvo = cat.squads.get("fora")!.find((p) => p.position === "ST")!;
    plan.signings.push({ playerId: alvo.id, fee: 0, salary: 1000, arrival: "mid_season" });
    const after = computePayroll(plan, cat);
    expect(after.total - base.total).toBe(500);
    expect(after.bySector.ATT - base.bySector.ATT).toBe(500);
  });
});

describe("orçamento sugerido", () => {
  it("é 15% do valor do elenco, arredondado para o milhão", () => {
    // 18 jogadores x € 1 mi = € 18 mi -> 15% = € 2,7 mi -> € 3 mi
    expect(presetBudget("casa", makeCatalog())).toBe(3000);
  });
});
