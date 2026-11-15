"use client";

import { formatMoney, type Catalog, type Plan } from "@engine";
import { X } from "lucide-react";

import { ClubBadge } from "@/components/club-badge";
import { Button } from "@/components/ui/button";
import { usePlanStore } from "@/lib/plan-store";
import { t } from "@/messages";

/** Quem chega: contratações, garotos da base e jogadores criados. */
export function Arrivals({ plan, catalog }: { plan: Plan; catalog: Catalog }) {
  const removeSigning = usePlanStore((s) => s.removeSigning);
  const removeCustom = usePlanStore((s) => s.removeCustomPlayer);
  const total = plan.signings.length + plan.customPlayers.length;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {t.squad.arrivalsTitle} · {total}
      </h2>
      {total === 0 ? <p className="text-sm text-muted-foreground">{t.squad.arrivalsEmpty}</p> : null}
      <ul className="flex flex-col gap-2">
        {plan.signings.map((s) => {
          const p = catalog.players.get(s.playerId);
          if (!p) return null;
          const from = p.clubId ? catalog.clubs.get(p.clubId) : undefined;
          return (
            <li key={s.playerId} className="flex min-h-16 items-center gap-3 rounded-xl border bg-card p-3">
              {from ? <ClubBadge shortName={from.shortName} color={from.color} /> : <span className="size-11" />}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{p.name}</span>
                <span className="truncate text-sm text-muted-foreground">
                  {t.squad.positions[p.position]} · {formatMoney(s.fee)}
                  {s.arrival === "mid_season" ? ` · ${t.squad.midSeason}` : ""}
                </span>
              </span>
              <Button variant="ghost" size="icon" aria-label={`${t.squad.remove} ${p.name}`} onClick={() => removeSigning(s.playerId)}>
                <X />
              </Button>
            </li>
          );
        })}
        {plan.customPlayers.map((c) => (
          <li key={c.id} className="flex min-h-16 items-center gap-3 rounded-xl border bg-card p-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
              {c.origin === "youth" ? t.squad.youth : t.squad.created}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{c.name}</span>
              <span className="truncate text-sm text-muted-foreground">
                {t.squad.positions[c.position]} · {formatMoney(c.marketValue)}
              </span>
            </span>
            <Button variant="ghost" size="icon" aria-label={`${t.squad.remove} ${c.name}`} onClick={() => removeCustom(c.id)}>
              <X />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
