import { describe, expect, it } from "vitest";

import { mapPosition } from "./positions";

describe("mapPosition", () => {
  it("converte os rótulos do .com.br", () => {
    expect(mapPosition("Goleiro")).toBe("GK");
    expect(mapPosition("Lateral Esq.")).toBe("LB");
    expect(mapPosition("Ponta-Direita")).toBe("RW");
    expect(mapPosition("Seg. Atacante")).toBe("ST");
    expect(mapPosition(" Volante ")).toBe("DM");
  });

  it("converte os rótulos do .com", () => {
    expect(mapPosition("Centre-Forward")).toBe("ST");
  });

  it("devolve null para rótulo desconhecido, sem chutar", () => {
    expect(mapPosition("Líbero")).toBeNull();
  });
});
