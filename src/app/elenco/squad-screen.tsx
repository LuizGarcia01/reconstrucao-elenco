"use client";

import { renewAllExpiring, squadRows, type Sector, type SquadRow } from "@engine";
import { AlertTriangle, ReceiptText, RotateCcw, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ClubBadge } from "@/components/club-badge";
import { Button } from "@/components/ui/button";
import { clubOf, useCatalog } from "@/lib/club-data";
import { usePlanStore } from "@/lib/plan-store";
import { useHydrated } from "@/lib/use-hydrated";
import { t } from "@/messages";

import { Arrivals } from "./arrivals";
import { CashBar } from "./cash-bar";
import { PlayerRow } from "./player-row";
import { PlayerSheet } from "./player-sheet";

const SECTORS: Sector[] = ["GK", "DEF", "MID", "ATT"];

export function SquadScreen() {
  const hydrated = useHydrated();
  const plan = usePlanStore((s) => s.plan);
  const canUndo = usePlanStore((s) => s.history.length > 0);
  const undo = usePlanStore((s) => s.undo);
  const setDecisions = usePlanStore((s) => s.setDecisions);
  const club = useCatalog(hydrated && plan !== null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmRelease, setConfirmRelease] = useState(false);

  const rows = useMemo(
    () => (plan && club.status === "ready" ? squadRows(plan, club.catalog) : []),
    [plan, club],
  );

  if (!hydrated || (plan && club.status === "loading")) {
    return <div className="mt-6 h-96 animate-pulse rounded-xl bg-muted" aria-busy />;
  }
  const clubInfo = plan && club.status === "ready" ? clubOf(club.catalog, plan.clubId) : undefined;
  if (!plan || club.status === "error" || (club.status === "ready" && !clubInfo)) {
    return (
      <div className="flex flex-col items-start gap-4 py-10">
        <p className="text-muted-foreground">{t.squad.noPlan}</p>
        <Button asChild>
          <Link href="/clube">{t.squad.chooseClub}</Link>
        </Button>
      </div>
    );
  }
  if (club.status !== "ready" || !clubInfo) return null;

  const { catalog } = club;
  const expiring = rows.filter((r) => r.contract === "expired" && r.decision.kind === "keep" && !r.decision.renewal);
  const open = rows.find((r) => r.player.id === openId) ?? null;

  function releaseAll() {
    setDecisions(Object.fromEntries(rows.map((r) => [r.player.id, { kind: "release" as const }])));
    setConfirmRelease(false);
  }

  return (
    <>
      <main className="flex flex-col gap-5 py-5 pb-44">
        <div className="flex items-center gap-3">
          <ClubBadge shortName={clubInfo.shortName} color={clubInfo.color} />
          <h1 className="flex-1 text-2xl font-bold tracking-tight">{clubInfo.name}</h1>
        </div>

        {expiring.length > 0 ? (
          <div className="flex flex-col gap-3 rounded-xl border border-highlight/60 bg-highlight/10 p-4">
            <p className="flex gap-2 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-highlight" />
              {t.squad.expiringBanner(expiring.length)}
            </p>
            <Button variant="secondary" className="self-start" onClick={() => setDecisions(renewAllExpiring(plan, catalog))}>
              {t.squad.renewAll}
            </Button>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="h-11">
            <Link href="/balanco">
              <ReceiptText />
              {t.balance.open}
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="h-11" onClick={undo} disabled={!canUndo}>
            <RotateCcw />
            {t.squad.undo}
          </Button>
          {confirmRelease ? (
            <>
              <Button variant="destructive" size="sm" className="h-11" onClick={releaseAll}>
                {t.squad.releaseAllConfirm}
              </Button>
              <Button variant="ghost" size="sm" className="h-11" onClick={() => setConfirmRelease(false)}>
                {t.squad.cancel}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" className="h-11" onClick={() => setConfirmRelease(true)}>
              <Users />
              {t.squad.releaseAll}
            </Button>
          )}
        </div>

        {SECTORS.map((sector) => {
          const list = rows.filter((r) => r.sector === sector);
          if (list.length === 0) return null;
          return (
            <section key={sector} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                {t.squad.sectors[sector]} · {list.filter((r) => !r.leaving).length}
              </h2>
              <ul className="flex flex-col gap-2">
                {list.map((row: SquadRow) => (
                  <li key={row.player.id}>
                    <PlayerRow row={row} onOpen={() => setOpenId(row.player.id)} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        <Arrivals plan={plan} catalog={catalog} />
      </main>

      <PlayerSheet row={open} onClose={() => setOpenId(null)} />
      <CashBar plan={plan} catalog={catalog} action={{ href: "/mercado", label: t.squad.market }} />
    </>
  );
}
