import { describe, expect, it } from "vitest";

import { OVERALL_MAX, OVERALL_MIN, overallFrom } from "./rating";

describe("overallFrom", () => {
  it("cresce com o valor de mercado", () => {
    expect(overallFrom(500, 27)).toBeLessThan(overallFrom(5000, 27));
    expect(overallFrom(5000, 27)).toBeLessThan(overallFrom(50_000, 27));
  });

  it("dá os valores de referência na idade neutra", () => {
    expect(overallFrom(100, 27)).toBe(45);
    expect(overallFrom(1000, 27)).toBe(58);
    expect(overallFrom(5000, 27)).toBe(67);
    expect(overallFrom(30_000, 27)).toBe(77);
  });

  it("não pune quem já tem 21 anos; desconta garotos e compensa veteranos", () => {
    expect(overallFrom(38_000, 21)).toBeGreaterThan(overallFrom(30_000, 26)); // valor maior, força maior
    expect(overallFrom(5000, 18)).toBeLessThan(overallFrom(5000, 27));
    expect(overallFrom(5000, 34)).toBeGreaterThan(overallFrom(5000, 27));
  });

  it("fica sempre dentro dos limites", () => {
    expect(overallFrom(0, 17)).toBe(OVERALL_MIN);
    expect(overallFrom(100_000_000, 36)).toBe(OVERALL_MAX);
  });
});
