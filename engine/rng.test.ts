import { describe, expect, it } from "vitest";

import { createRng, hashSeed, randomInt } from "./rng";

describe("createRng", () => {
  it("gera a mesma sequência para a mesma semente", () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 100 }, a);
    const seqB = Array.from({ length: 100 }, b);
    expect(seqA).toEqual(seqB);
  });

  it("gera sequências diferentes para sementes diferentes", () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
  });

  it("fica sempre em [0, 1)", () => {
    const rng = createRng(7);
    for (let i = 0; i < 10_000; i++) {
      const x = rng();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe("hashSeed", () => {
  it("é estável e sensível ao conteúdo", () => {
    expect(hashSeed("plano")).toBe(hashSeed("plano"));
    expect(hashSeed("plano")).not.toBe(hashSeed("plano2"));
  });
});

describe("randomInt", () => {
  it("respeita os limites, inclusive", () => {
    const rng = createRng(3);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) seen.add(randomInt(rng, 1, 3));
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });
});
