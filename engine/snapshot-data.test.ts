// Confere o retrato real versionado em data/snapshot.json.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { validateSnapshot, type Snapshot } from "./catalog";
import { presetBudget } from "./finance";
import { buildCatalog, newPlan } from "./plan";
import { validatePlan } from "./validate";

const snapshot = JSON.parse(readFileSync("data/snapshot.json", "utf-8")) as Snapshot;
const catalog = buildCatalog(snapshot);

describe("retrato da Série A", () => {
  it("é íntegro e tem 20 clubes", () => {
    expect(validateSnapshot(snapshot)).toEqual([]);
    expect(snapshot.clubs).toHaveLength(20);
  });

  it("todo clube tem goleiro, orçamento sugerido e um plano padrão sem ids inválidos", () => {
    for (const club of snapshot.clubs) {
      const squad = catalog.squads.get(club.id) ?? [];
      expect(squad.some((p) => p.position === "GK"), club.name).toBe(true);
      const budget = presetBudget(club.id, catalog);
      expect(budget, club.name).toBeGreaterThan(0);
      const codes = validatePlan(newPlan(club.id, { mode: "preset", amount: budget }), catalog).map((i) => i.code);
      expect(codes, club.name).not.toContain("unknown_player");
      expect(codes, club.name).not.toContain("decision_not_in_squad");
    }
  });
});
