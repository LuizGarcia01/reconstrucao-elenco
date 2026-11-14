/**
 * Gera data/snapshot.json a partir de uma fonte.
 * Uso: npm run snapshot -- --source=transfermarkt --season=2026
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { validateSnapshot } from "../engine/catalog";
import { transfermarkt } from "./sources/transfermarkt";
import type { SnapshotSource } from "./sources/types";

const SOURCES: Record<string, SnapshotSource> = { transfermarkt };

function arg(name: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

async function main() {
  const sourceId = arg("source", "transfermarkt");
  const season = arg("season", "2026");
  const source = SOURCES[sourceId];
  if (!source) throw new Error(`Fonte desconhecida: ${sourceId}`);

  const snapshot = await source.build({ season });
  const report = (source as { lastReport?: { warnings: string[]; missingClubs: string[] } }).lastReport;
  if (report) {
    for (const w of report.warnings) console.warn(`aviso: ${w}`);
    if (report.missingClubs.length > 0) {
      console.warn(`faltam ${report.missingClubs.length} clube(s): ${report.missingClubs.join(", ")}`);
    }
  }
  const issues = validateSnapshot(snapshot);
  if (issues.length > 0) {
    for (const i of issues.slice(0, 50)) console.error(`${i.path}: ${i.message}`);
    throw new Error(`Retrato inválido: ${issues.length} problema(s). Nada foi gravado.`);
  }

  const out = resolve("data/snapshot.json");
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(snapshot, null, 2) + "\n");
  console.log(
    `Gravado ${out}: ${snapshot.clubs.length} clubes, ${snapshot.players.length} jogadores.`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
