import { describe, expect, it } from "vitest";

import { mapPosition } from "./positions";

describe("mapPosition", () => {
  it("converte rótulos em inglês e português", () => {
    expect(mapPosition("Goalkeeper")).toBe("GK");
    expect(mapPosition("Centre-Forward")).toBe("ST");
    expect(mapPosition("Zagueiro")).toBe("CB");
    expect(mapPosition(" Volante ")).toBe("DM");
  });

  it("devolve null para rótulo desconhecido, sem chutar", () => {
    expect(mapPosition("Líbero")).toBeNull();
  });
});
