import { describe, expect, it } from "vitest";

import { formatMoney, fromMillions, money } from "./money";

describe("money", () => {
  it("aceita inteiros e recusa frações", () => {
    expect(money(1500)).toBe(1500);
    expect(() => money(1.5)).toThrow(RangeError);
  });

  it("converte milhões para milhares", () => {
    expect(fromMillions(1.5)).toBe(1500);
    expect(fromMillions(0.25)).toBe(250);
  });

  it("formata em pt-BR", () => {
    expect(formatMoney(1500)).toBe("€ 1,5 mi");
    expect(formatMoney(800)).toBe("€ 800 mil");
    expect(formatMoney(-2000)).toBe("-€ 2 mi");
    expect(formatMoney(120_000)).toBe("€ 120 mi");
    expect(formatMoney(0)).toBe("€ 0");
  });
});
