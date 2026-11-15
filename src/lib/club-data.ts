"use client";

import { buildCatalog, SNAPSHOT_VERSION, type Catalog, type Club, type League, type Player } from "@engine";
import { useEffect, useState } from "react";

export interface ClubData {
  league: League;
  club: Club;
  players: Player[];
}

type State = { status: "loading" } | { status: "error" } | { status: "ready"; data: ClubData; catalog: Catalog };

/** Baixa o elenco do clube e monta um catálogo só com ele (suficiente para as regras do elenco). */
export function useClubCatalog(clubId: string | undefined): State {
  const [state, setState] = useState<{ id: string; value: State } | null>(null);

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    fetch(`/dados/clube/${encodeURIComponent(clubId)}`)
      .then((r) => (r.ok ? (r.json() as Promise<ClubData>) : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (cancelled) return;
        const catalog = buildCatalog({
          version: SNAPSHOT_VERSION,
          season: "",
          source: "",
          generatedAt: "",
          leagues: [data.league],
          clubs: [data.club],
          players: data.players,
        });
        setState({ id: clubId, value: { status: "ready", data, catalog } });
      })
      .catch(() => !cancelled && setState({ id: clubId, value: { status: "error" } }));
    return () => {
      cancelled = true;
    };
  }, [clubId]);

  if (!clubId || !state || state.id !== clubId) return { status: "loading" };
  return state.value;
}
