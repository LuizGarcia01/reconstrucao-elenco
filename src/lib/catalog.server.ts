import "server-only";

import { buildCatalog, presetBudget, type Snapshot } from "@engine";

import snapshotJson from "../../data/snapshot.json";

/** Catálogo carregado só no servidor: o navegador recebe apenas os resumos de que cada tela precisa. */
export const catalog = buildCatalog(snapshotJson as Snapshot);

export interface ClubSummary {
  id: string;
  name: string;
  shortName: string;
  color: string;
  players: number;
  squadValue: number; // milhares de euros
  presetBudget: number; // milhares de euros
}

export function clubSummaries(): ClubSummary[] {
  return catalog.snapshot.clubs
    .map((c) => {
      const squad = catalog.squads.get(c.id) ?? [];
      return {
        id: c.id,
        name: c.name,
        shortName: c.shortName,
        color: c.color,
        players: squad.length,
        squadValue: squad.reduce((s, p) => s + p.marketValue, 0),
        presetBudget: presetBudget(c.id, catalog),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export const LEAGUE_NAME = catalog.snapshot.leagues[0]?.name ?? "";
