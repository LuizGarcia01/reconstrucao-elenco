"use client";

import {
  autoLineupFor,
  changeFormation,
  removeFromLineup,
  formatMoney,
  FORMATIONS,
  positionFit,
  resultingSquad,
  sanitizeLineup,
  summarizeLineup,
  swapPlaces,
  BENCH_SIZE,
  type Lineup,
  type Place,
  type SquadMember,
} from "@engine";
import { Wand2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clubOf, useCatalog } from "@/lib/club-data";
import { usePlanStore } from "@/lib/plan-store";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { t } from "@/messages";

function samePlace(a: Place | null, b: Place) {
  if (!a || a.kind !== b.kind) return false;
  if (a.kind === "slot" && b.kind === "slot") return a.slotId === b.slotId;
  if (a.kind === "bench" && b.kind === "bench") return a.index === b.index;
  if (a.kind === "out" && b.kind === "out") return a.playerId === b.playerId;
  return false;
}

/** "José Manuel López" -> "López"; nomes de uma palavra ficam inteiros. */
function shortName(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name;
}

export function LineupScreen() {
  const hydrated = useHydrated();
  const plan = usePlanStore((s) => s.plan);
  const setLineup = usePlanStore((s) => s.setLineup);
  const state = useCatalog(hydrated && plan !== null);
  const [selected, setSelected] = useState<Place | null>(null);

  const catalog = state.status === "ready" ? state.catalog : null;
  const members = useMemo(() => (plan && catalog ? resultingSquad(plan, catalog) : []), [plan, catalog]);
  const lineup: Lineup | null = useMemo(() => {
    if (!plan || !catalog) return null;
    return plan.lineup ? sanitizeLineup(plan.lineup, members) : autoLineupFor(plan, catalog, "433");
  }, [plan, catalog, members]);

  if (!hydrated || (plan && state.status === "loading")) {
    return <div className="mt-6 h-96 animate-pulse rounded-xl bg-muted" aria-busy />;
  }
  if (!plan || !catalog || !lineup || !clubOf(catalog, plan.clubId)) {
    return (
      <div className="flex flex-col items-start gap-4 py-10">
        <p className="text-muted-foreground">{t.squad.noPlan}</p>
        <Button asChild>
          <Link href="/clube">{t.squad.chooseClub}</Link>
        </Button>
      </div>
    );
  }

  const byId = new Map(members.map((m) => [m.id, m]));
  const summary = summarizeLineup(plan, catalog, lineup);
  const inLineup = new Set([...Object.values(lineup.starters), ...lineup.bench].filter(Boolean) as string[]);
  const out = members.filter((m) => !inLineup.has(m.id)).sort((a, b) => b.overall - a.overall);
  const selectedId = selected ? playerIn(lineup, selected) : null;

  function tap(place: Place) {
    if (samePlace(selected, place)) return setSelected(null);
    if (!selected) {
      if (playerIn(lineup!, place)) setSelected(place);
      return;
    }
    setLineup(swapPlaces(lineup!, selected, place));
    setSelected(null);
  }

  return (
    <main className="flex flex-col gap-5 py-5">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4" role="radiogroup" aria-label={t.lineup.formation}>
        {FORMATIONS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={lineup.formation === f.id}
            onClick={() => setLineup(changeFormation(lineup, members, f.id))}
            className={cn(
              "h-11 shrink-0 rounded-full border px-4 text-sm font-semibold tabular-nums",
              lineup.formation === f.id ? "border-primary bg-primary text-primary-foreground" : "bg-card",
            )}
          >
            {f.label}
          </button>
        ))}
        <Button variant="outline" className="shrink-0 rounded-full" onClick={() => setLineup(autoLineupFor(plan, catalog, lineup.formation))}>
          <Wand2 />
          {t.lineup.auto}
        </Button>
      </div>

      <div className="flex min-h-11 flex-wrap items-center gap-2">
        <p className="flex-1 text-sm text-muted-foreground" aria-live="polite">
          {selectedId ? t.lineup.selected(byId.get(selectedId)?.name ?? "") : t.lineup.hint}
        </p>
        {selected && selected.kind !== "out" ? (
          <Button
            variant="outline"
            size="sm"
            className="h-11"
            onClick={() => {
              setLineup(removeFromLineup(lineup, selected));
              setSelected(null);
            }}
          >
            {t.lineup.remove}
          </Button>
        ) : null}
        {selected ? (
          <Button variant="ghost" size="sm" className="h-11" onClick={() => setSelected(null)}>
            {t.lineup.cancel}
          </Button>
        ) : null}
      </div>

      {/* Campo */}
      <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl bg-[oklch(0.5_0.12_150)] dark:bg-[oklch(0.35_0.08_150)]">
        <div className="absolute inset-3 rounded-lg border-2 border-white/40" />
        <div className="absolute inset-x-3 top-1/2 border-t-2 border-white/40" />
        <div className="absolute top-1/2 left-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40" />
        <div className="absolute bottom-3 left-1/2 h-[16%] w-1/2 -translate-x-1/2 border-2 border-b-0 border-white/40" />
        {summary.formation.slots.map((slot) => {
          const id = lineup.starters[slot.id];
          const m = id ? byId.get(id) : undefined;
          const fit = m ? positionFit(m, slot.position) : 1;
          const place: Place = { kind: "slot", slotId: slot.id };
          const isSel = samePlace(selected, place);
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => tap(place)}
              aria-label={`${t.squad.positions[slot.position]}: ${m?.name ?? t.lineup.empty}`}
              aria-pressed={isSel}
              className="absolute flex w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 focus-visible:outline-none"
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            >
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-full border-2 text-sm font-bold tabular-nums shadow",
                  m ? "border-white bg-white text-neutral-900" : "border-dashed border-white/80 bg-white/10 text-white",
                  m && fit < 1 && "border-highlight bg-highlight text-neutral-900",
                  m && fit <= 0.4 && "border-destructive bg-destructive text-white",
                  isSel && "ring-4 ring-sky-300",
                )}
              >
                {m ? Math.round(m.overall * fit) : t.squad.positions[slot.position]}
              </span>
              <span className="max-w-full truncate rounded bg-black/45 px-1 text-[11px] leading-tight font-medium text-white">
                {m ? shortName(m.name) : t.squad.positions[slot.position]}
              </span>
            </button>
          );
        })}
      </div>

      <Card className="gap-2">
        <Stat label={t.lineup.strength} value={summary.strength.toFixed(1)} />
        <Stat label={t.lineup.value} value={formatMoney(summary.value)} />
        <Stat
          label={t.lineup.foreigners}
          value={summary.foreignLimit !== null ? `${summary.foreigners}/${summary.foreignLimit}` : String(summary.foreigners)}
          warn={summary.foreignLimit !== null && summary.foreigners > summary.foreignLimit}
        />
        {summary.issues.length > 0 ? (
          <ul className="flex flex-col gap-1 border-t pt-2 text-sm">
            {[...new Set(summary.issues.map((i) => i.code))].map((code) => {
              const level = summary.issues.find((i) => i.code === code)!.level;
              return (
                <li key={code} className={level === "error" ? "text-destructive" : "text-foreground"}>
                  {level === "error" ? "• " : "△ "}
                  {t.lineup.issues[code]}
                </li>
              );
            })}
          </ul>
        ) : null}
      </Card>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {t.lineup.bench} · {lineup.bench.length}/{BENCH_SIZE}
        </h2>
        <p className="text-xs text-muted-foreground">{t.lineup.benchHint}</p>
        <ul className="flex flex-col gap-2">
          {lineup.bench.map((id, index) => (
            <li key={id}>
              <MemberButton m={byId.get(id)!} selected={samePlace(selected, { kind: "bench", index })} onClick={() => tap({ kind: "bench", index })} />
            </li>
          ))}
          {lineup.bench.length < BENCH_SIZE ? (
            <li>
              <button
                type="button"
                onClick={() => tap({ kind: "bench", index: lineup.bench.length })}
                className="flex h-12 w-full items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground"
              >
                + {t.lineup.addToBench}
              </button>
            </li>
          ) : null}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {t.lineup.out} · {out.length}
        </h2>
        <ul className="flex flex-col gap-2">
          {out.map((m) => (
            <li key={m.id}>
              <MemberButton m={m} selected={samePlace(selected, { kind: "out", playerId: m.id })} onClick={() => tap({ kind: "out", playerId: m.id })} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function playerIn(lineup: Lineup, place: Place): string | null {
  if (place.kind === "slot") return lineup.starters[place.slotId] ?? null;
  if (place.kind === "bench") return lineup.bench[place.index] ?? null;
  return place.playerId;
}

function MemberButton({ m, selected, onClick }: { m: SquadMember; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex min-h-14 w-full items-center gap-3 rounded-xl border bg-card px-3 py-2 text-left transition-colors hover:bg-accent",
        selected && "border-sky-400 ring-2 ring-sky-300",
      )}
    >
      <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-secondary">
        <span className="text-sm leading-none font-bold tabular-nums">{m.overall}</span>
        <span className="text-[10px] leading-tight">{t.squad.positions[m.position]}</span>
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{m.name}</span>
      {m.arrival === "mid_season" ? <span className="text-xs text-muted-foreground">{t.squad.midSeason}</span> : null}
    </button>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("font-semibold tabular-nums", warn && "text-destructive")}>{value}</span>
    </div>
  );
}
