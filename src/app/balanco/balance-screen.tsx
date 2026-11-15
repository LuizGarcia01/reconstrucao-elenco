"use client";

import { balanceSheet, formatMoney, type BalanceLine, type Catalog, type Sector } from "@engine";
import Link from "next/link";

import { ClubBadge } from "@/components/club-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clubOf, useCatalog } from "@/lib/club-data";
import { usePlanStore } from "@/lib/plan-store";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { t } from "@/messages";

const SECTORS: Sector[] = ["GK", "DEF", "MID", "ATT"];

export function BalanceScreen() {
  const hydrated = useHydrated();
  const plan = usePlanStore((s) => s.plan);
  const state = useCatalog(hydrated && plan !== null);

  if (!hydrated || (plan && state.status === "loading")) {
    return <div className="mt-6 h-96 animate-pulse rounded-xl bg-muted" aria-busy />;
  }
  const catalog = state.status === "ready" ? state.catalog : null;
  const club = catalog && plan ? clubOf(catalog, plan.clubId) : undefined;
  if (!plan || !catalog || !club) {
    return (
      <div className="flex flex-col items-start gap-4 py-10">
        <p className="text-muted-foreground">{t.squad.noPlan}</p>
        <Button asChild>
          <Link href="/clube">{t.squad.chooseClub}</Link>
        </Button>
      </div>
    );
  }

  const b = balanceSheet(plan, catalog);
  const maxSector = Math.max(1, ...SECTORS.map((s) => b.payroll.bySector[s]));

  return (
    <main className="flex flex-col gap-5 py-5">
      <div className="flex items-center gap-3">
        <ClubBadge shortName={club.shortName} color={club.color} />
        <h1 className="text-2xl font-bold tracking-tight">{club.name}</h1>
      </div>

      <Card className="gap-3">
        <Row label={t.balance.initial} value={b.cash.limited ? formatMoney(b.cash.initial) : "—"} />
        <Row label={t.balance.raised} value={`+ ${formatMoney(b.cash.raised)}`} tone="pos" />
        <Row label={t.balance.spent} value={`− ${formatMoney(b.cash.spent)}`} tone="neg" />
        <div className="border-t pt-3">
          <Row
            label={t.balance.balance}
            value={formatMoney(b.cash.balance)}
            strong
            tone={b.cash.balance < 0 && b.cash.limited ? "neg" : undefined}
          />
        </div>
        {!b.cash.limited ? <p className="text-xs text-muted-foreground">{t.balance.unlimited}</p> : null}
      </Card>

      <LineList title={t.balance.sales} lines={b.sales} catalog={catalog} sign="+" />
      <LineList title={t.balance.purchases} lines={b.purchases} catalog={catalog} sign="−" />
      <LineList title={t.balance.freeArrivals} lines={b.freeArrivals} catalog={catalog} />
      <LineList title={t.balance.freeDepartures} lines={b.freeDepartures} catalog={catalog} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{t.balance.payroll}</h2>
        <Card className="gap-3">
          <Row label={t.balance.payrollBefore} value={formatMoney(b.payrollBefore)} />
          <Row label={t.balance.payrollAfter} value={formatMoney(b.payroll.total)} strong />
          <ul className="flex flex-col gap-2 pt-1">
            {SECTORS.map((s) => (
              <li key={s} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span>{t.squad.sectors[s]}</span>
                  <span className="tabular-nums">{formatMoney(b.payroll.bySector[s])}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(b.payroll.bySector[s] / maxSector) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">{t.balance.payrollHint}</p>
        </Card>
      </section>

      <Button asChild variant="outline" className="self-start">
        <Link href="/elenco">{t.balance.back}</Link>
      </Button>
    </main>
  );
}

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "pos" | "neg" }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={cn("text-sm", strong ? "font-semibold" : "text-muted-foreground")}>{label}</span>
      <span
        className={cn(
          "tabular-nums",
          strong ? "text-xl font-bold" : "font-medium",
          tone === "pos" && "text-primary",
          tone === "neg" && "text-destructive",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function LineList({ title, lines, catalog, sign }: { title: string; lines: BalanceLine[]; catalog: Catalog; sign?: "+" | "−" }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title} · {lines.length}
      </h2>
      {lines.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.balance.none}</p>
      ) : (
        <ul className="flex flex-col divide-y rounded-xl border bg-card">
          {lines.map((l) => {
            const club = l.clubId ? catalog.clubs.get(l.clubId) : undefined;
            return (
              <li key={l.id} className="flex min-h-14 items-center gap-3 px-3 py-2">
                {club ? (
                  <ClubBadge shortName={club.shortName} color={club.color} className="size-8 text-[9px]" />
                ) : (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold">
                    {t.squad.positions[l.position]}
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{l.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {t.squad.positions[l.position]}
                    {l.detail ? ` · ${t.balance.detail[l.detail]}` : ""}
                  </span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">{sign ? `${sign} ${formatMoney(l.amount)}` : "€ 0"}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
