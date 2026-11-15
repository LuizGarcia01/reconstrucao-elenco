import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // O motor é TypeScript puro: sem React, sem Next, sem aleatoriedade sem semente.
    files: ["engine/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: ["react", "react-*", "next", "next/*", "@/*"] },
      ],
      "no-restricted-properties": [
        "error",
        { object: "Math", property: "random", message: "Use createRng(seed) de engine/rng." },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "coverage/**"]),
]);
