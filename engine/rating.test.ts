import { describe, expect, it } from "vitest";

import { OVERALL_MAX, OVERALL_MIN, overallFrom } from "./rating";

describe("overallFrom", () => {
  it("cresce com o valor de mercado", () => {
    expect(overallFrom(500, 27)).toBeLessThan(overallFrom(5000, 27));
    expect(overallFrom(5000, 27)).toBeLessThan(overallFrom(50_000, 27));
  });

  it("dá os valores de referência na idade neutra", () => {
    expect(overallFrom(50, 27)).toBe(40);
    expect(overallFrom(5000, 27)).toBe(62);
    expect(overallFrom(50_000, 27)).toBe(73);
  });

  it("desconta jovem e compensa veterano com o mesmo valor", () => {
    expect(overallFrom(5000, 19)).toBeLessThan(overallFrom(5000, 27));
    expect(overallFrom(5000, 34)).toBeGreaterThan(overallFrom(5000, 27));
  });

  it("fica sempre dentro dos limites", () => {
    expect(overallFrom(0, 17)).toBe(OVERALL_MIN);
    expect(overallFrom(10_000_000, 36)).toBe(OVERALL_MAX);
  });
});
