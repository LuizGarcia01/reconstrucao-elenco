"use client";

import { buildCatalog, type Catalog, type Club, type Snapshot } from "@engine";
import { useEffect, useState } from "react";

type State = { status: "loading" } | { status: "error" } | { status: "ready"; catalog: Catalog };

// Uma única carga por sessão do navegador, compartilhada entre elenco e mercado.
let pending: Promise<Catalog> | null = null;
function loadCatalog(): Promise<Catalog> {
  pending ??= fetch("/dados/catalogo")
    .then((r) => (r.ok ? (r.json() as Promise<Snapshot>) : Promise.reject(new Error(String(r.status)))))
    .then(buildCatalog)
    .catch((err) => {
      pending = null; // permite tentar de novo
      throw err;
    });
  return pending;
}

export function useCatalog(enabled: boolean): State {
  const [state, setState] = useState<State>({ status: "loading" });
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadCatalog()
      .then((catalog) => !cancelled && setState({ status: "ready", catalog }))
      .catch(() => !cancelled && setState({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return state;
}

export function clubOf(catalog: Catalog, clubId: string | undefined): Club | undefined {
  return clubId ? catalog.clubs.get(clubId) : undefined;
}
