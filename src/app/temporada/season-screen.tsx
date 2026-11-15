"use client";

import {
  autoLineupFor,
  planSeed,
  resultingSquad,
  sanitizeLineup,
  simulateLeague,
  simulateMany,
  summarizeLineup,
  tableAfter,
  validatePlan,
  ZONES,
  type Catalog,
  type LeagueResult,
  type ManySummary,
  type Plan,
} from "@engine";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ClubBadge } from "@/components/club-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clubOf, useCatalog } from "@/lib/club-data";
import { usePlanStore } from "@/lib/plan-store";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { t } from "@/messages";

type Zone = "title" | "continental" | "relegation" | "middle";
function zoneOf(pos: number, n: number): Zone {
  if (pos <= ZONES.title) return "title";
  if (pos <= ZONES.continental) return "continental";
  if (pos > n - ZONES.relegation) return "relegation";
  return "middle";
}

export function SeasonScreen() {
  const hydrated = useHydrated();
  const plan = usePlanStore((s) => s.plan);
  const state = useCatalog(hydrated && plan !== null);

  if (!hydrated || (plan && state.status === "loading")) {
    return <div className="mt-6 h-96 animate-pulse rounded-xl bg-muted" aria-busy />;
  }
  const catalog = state.status === "ready" ? state.catalog : null;
  if (!plan || !catalog || !clubOf(catalog, plan.clubId)) {
    return (
      <div className="flex flex-col items-start gap-4 py-10">
        <p className="text-muted-foreground">{t.squad.noPlan}</p>
        <Button asChild>
          <Link href="/clube">{t.squad.chooseClub}</Link>
        </Button>
      </div>
    );
  }
  return <Season plan={plan} catalog={catalog} />;
}

function Season({ plan, catalog }: { plan: Plan; catalog: Catalog }) {
  const club = catalog.clubs.get(plan.clubId)!;
  const blockers = useMemo(() => {
    const planErrors = validatePlan(plan, catalog).filter((i) => i.level === "error").map((i) => t.squad.issueText[i.code]);
    const members = resultingSquad(plan, catalog);
    const lineup = plan.lineup ? sanitizeLineup(plan.lineup, members) : autoLineupFor(plan, catalog, "433");
    const lineupErrors = summarizeLineup(plan, catalog, lineup)
      .issues.filter((i) => i.level === "error")
      .map((i) => t.lineup.issues[i.code]);
    return [...new Set([...planErrors, ...lineupErrors])];
  }, [plan, catalog]);

  const [stored, setStored] = useState<{ seed: number; league: LeagueResult; many: ManySummary } | null>(null);
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(38);
  // Plano mudou desde a última simulação: o resultado antigo não vale mais.
  const seed = planSeed(plan);
  const result = stored && stored.seed === seed ? stored : null;

  function run() {
    setRunning(true);
    // Deixa a tela mostrar "Simulando…" antes do cálculo (dezenas de ms).
    setTimeout(() => {
      const league = simulateLeague(plan, catalog);
      const many = simulateMany(plan, catalog);
      setStored({ seed, league, many });
      setRound(38);
      setRunning(false);
    }, 30);
  }

  if (blockers.length > 0) {
    return (
      <main className="flex flex-col gap-4 py-6">
        <p className="font-medium">{t.season.blocked}</p>
        <ul className="flex flex-col gap-1 text-sm text-destructive">
          {blockers.map((b) => (
            <li key={b}>• {b}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/elenco">{t.season.goSquad}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/xi">{t.season.goLineup}</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="flex flex-col items-start gap-4 py-6">
        <div className="flex items-center gap-3">
          <ClubBadge shortName={club.shortName} color={club.color} />
          <h1 className="text-2xl font-bold tracking-tight">{club.name}</h1>
        </div>
        <p className="text-muted-foreground">{t.season.lead}</p>
        <Button size="lg" onClick={run} disabled={running}>
          <Play />
          {running ? t.season.calculating : t.season.run}
        </Button>
      </main>
    );
  }

  const { league, many } = result;
  const n = league.table.length;
  const table = round === 38 ? league.table : tableAfter(league, round);
  const finalRow = league.table[league.position - 1];
  const zone = zoneOf(league.position, n);
  const myMatch = league.rounds[round - 1].find((m) => m.home === plan.clubId || m.away === plan.clubId);
  const maxCount = Math.max(...many.positions);

  return (
    <main className="flex flex-col gap-5 py-5">
      <Card className="gap-2">
        <div className="flex items-center gap-3">
          <ClubBadge shortName={club.shortName} color={club.color} />
          <div className="flex flex-col">
            <span className="text-xl font-bold">{t.season.finished(club.name, league.position)}</span>
            <span className="text-sm text-muted-foreground">
              {t.season.points(finalRow.points)} · {finalRow.won}V {finalRow.drawn}E {finalRow.lost}D
            </span>
          </div>
        </div>
        <span
          className={cn(
            "self-start rounded-full px-3 py-1 text-sm font-semibold",
            zone === "title" && "bg-highlight text-neutral-900",
            zone === "continental" && "bg-primary/15 text-primary",
            zone === "relegation" && "bg-destructive/15 text-destructive",
            zone === "middle" && "bg-secondary",
          )}
        >
          {t.season.zones[zone]}
        </span>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label={t.season.prev} disabled={round <= 1} onClick={() => setRound((r) => r - 1)}>
            <ChevronLeft />
          </Button>
          <label className="flex flex-1 flex-col items-center gap-1">
            <span className="text-sm font-semibold tabular-nums">{t.season.round(round)}</span>
            <input type="range" min={1} max={38} value={round} onChange={(e) => setRound(Number(e.target.value))} className="w-full accent-primary" />
          </label>
          <Button variant="outline" size="icon" aria-label={t.season.next} disabled={round >= 38} onClick={() => setRound((r) => r + 1)}>
            <ChevronRight />
          </Button>
        </div>

        {myMatch ? (
          <div className="flex items-center justify-center gap-3 rounded-xl border bg-card p-3 text-sm">
            <span className="text-muted-foreground">{t.season.yourMatch}</span>
            <MatchLine home={myMatch.home} away={myMatch.away} hg={myMatch.homeGoals} ag={myMatch.awayGoals} catalog={catalog} />
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm tabular-nums">
            <thead className="bg-secondary text-xs text-muted-foreground">
              <tr>
                <th className="w-8 py-2 pl-3 text-left">{t.season.table.pos}</th>
                <th className="py-2 text-left">{t.season.table.club}</th>
                <th className="w-8 py-2 text-right">{t.season.table.played}</th>
                <th className="w-10 py-2 text-right">{t.season.table.gd}</th>
                <th className="w-10 py-2 pr-3 text-right">{t.season.table.pts}</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row, i) => {
                const c = catalog.clubs.get(row.clubId)!;
                const z = zoneOf(i + 1, n);
                const mine = row.clubId === plan.clubId;
                return (
                  <tr key={row.clubId} className={cn("border-t", mine && "bg-primary/10 font-semibold")}>
                    <td
                      className={cn(
                        "border-l-4 py-1.5 pl-2",
                        z === "title" && "border-highlight",
                        z === "continental" && "border-primary",
                        z === "relegation" && "border-destructive",
                        z === "middle" && "border-transparent",
                      )}
                    >
                      {i + 1}
                    </td>
                    <td className="py-1.5">
                      <span className="flex items-center gap-2">
                        <ClubBadge shortName={c.shortName} color={c.color} className="size-6 text-[7px] ring-0" />
                        <span className="truncate">{c.name}</span>
                      </span>
                    </td>
                    <td className="py-1.5 text-right">{row.played}</td>
                    <td className="py-1.5 text-right">{row.goalsFor - row.goalsAgainst}</td>
                    <td className="py-1.5 pr-3 text-right font-semibold">{row.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{t.season.many}</h2>
        <div className="grid grid-cols-2 gap-3">
          <Big label={t.season.avgPosition} value={`${many.avgPosition.toFixed(1)}º`} />
          <Big label={t.season.titlePct} value={`${many.titlePct}%`} />
          <Big label={t.season.continentalPct} value={`${many.continentalPct}%`} />
          <Big label={t.season.relegationPct} value={`${many.relegationPct}%`} tone={many.relegationPct > 0 ? "neg" : undefined} />
        </div>
        <Card className="gap-2">
          <span className="text-sm text-muted-foreground">{t.season.distribution}</span>
          <div className="flex h-24 items-end gap-0.5" role="img" aria-label={t.season.distribution}>
            {many.positions.map((count, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-full rounded-t-sm",
                    zoneOf(i + 1, n) === "relegation" ? "bg-destructive/70" : i + 1 <= ZONES.continental ? "bg-primary" : "bg-muted-foreground/40",
                  )}
                  style={{ height: `${(count / maxCount) * 80}px` }}
                  title={`${i + 1}º: ${count}`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>1º</span>
            <span>10º</span>
            <span>20º</span>
          </div>
        </Card>
      </section>

      <Button variant="outline" className="self-start" asChild>
        <Link href="/elenco">{t.season.goSquad}</Link>
      </Button>
    </main>
  );
}

function MatchLine({ home, away, hg, ag, catalog }: { home: string; away: string; hg: number; ag: number; catalog: Catalog }) {
  const h = catalog.clubs.get(home)!;
  const a = catalog.clubs.get(away)!;
  return (
    <span className="flex items-center gap-2 font-semibold tabular-nums">
      <ClubBadge shortName={h.shortName} color={h.color} className="size-7 text-[8px] ring-0" />
      {hg} × {ag}
      <ClubBadge shortName={a.shortName} color={a.color} className="size-7 text-[8px] ring-0" />
    </span>
  );
}

function Big({ label, value, tone }: { label: string; value: string; tone?: "neg" }) {
  return (
    <div className="flex flex-col rounded-xl border bg-card p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-2xl font-bold tabular-nums", tone === "neg" && "text-destructive")}>{value}</span>
    </div>
  );
}
