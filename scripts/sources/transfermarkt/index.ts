/**
 * Adaptador do Transfermarkt a partir de páginas SALVAS NO NAVEGADOR.
 *
 * Não baixamos nada automaticamente: o site tem verificação anti-robô e não a contornamos.
 * Fluxo: abra cada página de elenco (visão detalhada), salve com Ctrl+S como "Página da web, só HTML"
 * em data/raw/transfermarkt/<temporada>/ e rode `npm run snapshot`.
 *
 * Grava só fatos: nome, posição, nascimento, nacionalidade, clube, contrato, valor.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { SNAPSHOT_VERSION, type Player, type Snapshot } from "../../../engine/catalog";
import type { SnapshotSource } from "../types";
import { CLUBS_BR } from "./clubs-br";
import { countryCode } from "./countries";
import { parseSquadPage } from "./parse";

export const RAW_DIR = "data/raw/transfermarkt";

const LEAGUE = {
  id: "br-a",
  name: "Brasileirão Série A",
  country: "BR",
  tier: 1,
  // Estrangeiros relacionados por jogo em 2027 (o jogo simula 2027): 8, pela redução gradual
  // aprovada por CBF e clubes em set/2026. Conferir quando o regulamento de 2027 sair.
  foreignLimit: 8,
};

export interface BuildReport {
  warnings: string[];
  missingClubs: string[];
}

export async function buildFromSavedPages(season: string, report: BuildReport): Promise<Snapshot> {
  const dir = join(RAW_DIR, season);
  const files = (await readdir(dir).catch(() => [] as string[])).filter((f) => /\.html?$/i.test(f));
  if (files.length === 0) throw new Error(`Nenhuma página salva em ${dir}.`);

  const players: Player[] = [];
  const seenClubs = new Set<string>();

  for (const file of files.sort()) {
    const page = parseSquadPage(await readFile(join(dir, file), "utf-8"));
    const club = CLUBS_BR[page.tmClubId];
    if (!club) {
      report.warnings.push(`${file}: clube ${page.tmClubId} fora da Série A configurada; ignorado.`);
      continue;
    }
    if (seenClubs.has(club.id)) {
      report.warnings.push(`${file}: ${club.name} repetido; ignorado.`);
      continue;
    }
    seenClubs.add(club.id);

    for (const p of page.players) {
      if (!p.position) {
        report.warnings.push(`${club.name} / ${p.name}: posição "${p.positionLabel}" sem mapa; ignorado.`);
        continue;
      }
      const unknown = p.nationalityNames.filter((n) => countryCode(n) === null);
      if (unknown.length > 0) {
        report.warnings.push(`${club.name} / ${p.name}: país sem código (${unknown.join(", ")}).`);
      }
      players.push({
        id: `tm:${p.tmId}`,
        name: p.name,
        shortName: p.name,
        birthDate: p.birthDate,
        nationalities: p.nationalities,
        position: p.position,
        secondaryPositions: [],
        foot: p.foot,
        clubId: club.id,
        marketValue: p.marketValue,
        contractUntil: p.contractUntil,
        loanFromClubId: null,
      });
    }
  }

  report.missingClubs = Object.values(CLUBS_BR)
    .filter((c) => !seenClubs.has(c.id))
    .map((c) => c.name);

  return {
    version: SNAPSHOT_VERSION,
    season,
    source: "transfermarkt",
    generatedAt: new Date().toISOString(),
    leagues: [LEAGUE],
    // Só os clubes que têm página salva entram, para nenhum clube ficar sem elenco.
    clubs: Object.values(CLUBS_BR)
      .filter((c) => seenClubs.has(c.id))
      .map((c) => ({ ...c, leagueId: LEAGUE.id })),
    players,
  };
}

export const transfermarkt: SnapshotSource & { lastReport?: BuildReport } = {
  id: "transfermarkt",
  async build({ season }) {
    const report: BuildReport = { warnings: [], missingClubs: [] };
    this.lastReport = report;
    return buildFromSavedPages(season, report);
  },
};
