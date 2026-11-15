"use client";

import { formatMoney } from "@engine";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ClubBadge } from "@/components/club-badge";
import type { ClubSummary } from "@/lib/catalog.server";
import { usePlanStore } from "@/lib/plan-store";
import { useHydrated } from "@/lib/use-hydrated";
import { t } from "@/messages";

/** Busca sem diferenciar acentos e maiúsculas: "gremio" acha "Grêmio". */
function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function ClubPicker({ clubs }: { clubs: ClubSummary[] }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const hasPlan = usePlanStore((s) => s.plan !== null);
  const startPlan = usePlanStore((s) => s.startPlan);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return q ? clubs.filter((c) => normalize(`${c.name} ${c.shortName}`).includes(q)) : clubs;
  }, [clubs, query]);

  function choose(club: ClubSummary) {
    startPlan(club.id, { mode: "preset", amount: club.presetBudget });
    router.push("/orcamento");
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="relative block">
        <span className="sr-only">{t.club.search}</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.club.search}
          className="h-11 w-full rounded-md border bg-card pr-3 pl-9 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </label>

      {hydrated && hasPlan ? <p className="text-sm text-muted-foreground">{t.club.replaceWarning}</p> : null}

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">{t.club.empty}</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {filtered.map((club) => (
            <li key={club.id}>
              <button
                type="button"
                onClick={() => choose(club)}
                className="flex min-h-16 w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <ClubBadge shortName={club.shortName} color={club.color} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{club.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {club.players} {t.club.players} · {formatMoney(club.squadValue)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
