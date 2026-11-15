import { describe, expect, it } from "vitest";

import { makeCatalog, player } from "./fixtures.test-util";
import { newPlan } from "./plan";
import { canSimulate, validatePlan } from "./validate";

const codes = (issues: { code: string }[]) => issues.map((i) => i.code);

describe("validatePlan", () => {
  it("plano padrão (todos ficam) é válido", () => {
    const cat = makeCatalog();
    const issues = validatePlan(newPlan("casa", { mode: "custom", amount: 0 }), cat);
    expect(canSimulate(issues)).toBe(true);
  });

  it("caixa zero bloqueia contratação paga sem venda que a cubra, e libera depois da venda", () => {
    const cat = makeCatalog();
    const plan = newPlan("casa", { mode: "zero", amount: 0 });
    const alvo = cat.squads.get("fora")![3];
    plan.signings.push({ playerId: alvo.id, fee: 2000, salary: 300, arrival: "window" });
    expect(codes(validatePlan(plan, cat))).toContain("over_budget");

    plan.decisions[cat.squads.get("casa")![5].id] = { kind: "sell", fee: 2000 };
    expect(codes(validatePlan(plan, cat))).not.toContain("over_budget");
  });

  it("sem teto nunca acusa estouro", () => {
    const cat = makeCatalog();
    const plan = newPlan("casa", { mode: "unlimited", amount: 0 });
    plan.signings.push({ playerId: cat.squads.get("fora")![3].id, fee: 999_999, salary: 1, arrival: "window" });
    expect(codes(validatePlan(plan, cat))).not.toContain("over_budget");
  });

  it("acusa contratação repetida, do próprio elenco e de id inexistente", () => {
    const cat = makeCatalog();
    const plan = newPlan("casa", { mode: "unlimited", amount: 0 });
    const alvo = cat.squads.get("fora")![3].id;
    plan.signings.push(
      { playerId: alvo, fee: 0, salary: 1, arrival: "window" },
      { playerId: alvo, fee: 0, salary: 1, arrival: "window" },
      { playerId: cat.squads.get("casa")![0].id, fee: 0, salary: 1, arrival: "window" },
      { playerId: "tm:nao-existe", fee: 0, salary: 1, arrival: "window" },
    );
    expect(codes(validatePlan(plan, cat))).toEqual(
      expect.arrayContaining(["duplicate_signing", "signing_own_player", "unknown_player"]),
    );
  });

  it("exige 16 jogadores e pelo menos um goleiro", () => {
    const cat = makeCatalog();
    const plan = newPlan("casa", { mode: "unlimited", amount: 0 });
    for (const p of cat.squads.get("casa")!.filter((p) => p.position === "GK")) {
      plan.decisions[p.id] = { kind: "release" };
    }
    plan.decisions[cat.squads.get("casa")![5].id] = { kind: "release" };
    const issues = validatePlan(plan, cat);
    expect(codes(issues)).toEqual(expect.arrayContaining(["not_enough_players", "no_goalkeeper"]));
    expect(canSimulate(issues)).toBe(false);
  });

  it("avisa contrato vencendo sem renovação e estrangeiros acima do limite, sem bloquear", () => {
    const extra = [
      player("casa", "ST", { contractUntil: "2026-12-31" }),
      player("casa", "ST", { nationalities: ["AR"] }),
      player("casa", "ST", { nationalities: ["UY"] }),
      player("casa", "ST", { nationalities: ["PY", "BR"] }), // tem nacionalidade brasileira: não conta
      player("casa", "ST", { nationalities: ["CO"] }),
    ];
    const cat = makeCatalog(extra);
    const issues = validatePlan(newPlan("casa", { mode: "unlimited", amount: 0 }), cat);
    expect(codes(issues)).toEqual(expect.arrayContaining(["expiring_without_renewal", "foreigners_over_matchday_limit"]));
    expect(issues.find((i) => i.code === "foreigners_over_matchday_limit")?.detail).toBe("3/2");
    expect(canSimulate(issues)).toBe(true);
  });
});
