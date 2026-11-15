import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["engine/**/*.test.ts", "src/**/*.test.ts", "scripts/**/*.test.ts"],
    environment: "node",
  },
});
