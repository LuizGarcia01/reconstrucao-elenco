"use client";

import { canAfford, formatMoney, marketRows, type MarketRow, type Sector } from "@engine";
import { Bookmark, ChevronRight, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { ClubBadge } from "@/components/club-badge";
import { Button } from "@/components/ui/button";
import { clubOf, useCatalog } from "@/lib/club-data";
import { usePlanStore } from "@/lib/plan-store";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { t } from "@/messages";

import { CashBar } from "../elenco/cash-bar";
import { CreatePlayerSheet } from "./create-player-sheet";
import { SigningSheet } from "./signing-sheet";

const SECTORS: (Sector | "ALL")[] = ["ALL", "GK", "DEF", "MID", "ATT"];
type SortKey = keyof typeof t.market.sort;
const PAGE = 30;

function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function MarketScreen() {
  const hydrated = useHydrated();
  const plan = usePlanStore((s) => s.plan);
  const saved = usePlanStore((s) => s.saved);
  const state = useCatalog(hydrated && plan !== null);

  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [sector, setSector] = useState<Sector | "ALL">("ALL");
  const [fitsCash, setFitsCash] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [brOnly, setBrOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("value");
  const [limit, setLimit] = useState(PAGE);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const catalog = state.status === "ready" ? state.catalog : null;
  const rows = useMemo(() => (plan && catalog ? marketRows(plan, catalog) : []), [plan, catalog]);

  const filtered = useMemo(() => {
    if (!plan || !catalog) return [];
    const q = normalize(deferredQuery.trim());
    const list = rows.filter((r) => {
      if (sector !== "ALL" && r.sector !== sector) return false;
      if (freeOnly && r.defaults.fee > 0) return false;
      if (brOnly && r.foreign) return false;
      if (savedOnly && !saved.includes(r.player.id)) return false;
      if (fitsCash && !r.signed && !canAfford(plan, catalog, r.defaults.fee)) return false;
      if (q) {
        const club = r.player.clubId ? (catalog.clubs.get(r.player.clubId)?.name ?? "") : "";
        if (!normalize(`${r.player.name} ${club}`).includes(q)) return false;
      }
      return true;
    });
    const cmp: Record<SortKey, (a: MarketRow, b: MarketRow) => number> = {
      value: (a, b) => b.player.marketValue - a.player.marketValue,
      overall: (a, b) => b.overall - a.overall || b.player.marketValue - a.player.marketValue,
      age: (a, b) => (a.age ?? 99) - (b.age ?? 99) || b.overall - a.overall,
    };
    return list.sort(cmp[sort]);
  }, [rows, plan, catalog, deferredQuery, sector, freeOnly, brOnly, savedOnly, fitsCash, saved, sort]);

  if (!hydrated || (plan && state.status === "loading")) {
    return <div className="mt-6 h-96 animate-pulse rounded-xl bg-muted" aria-busy />;
  }
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

  const open = rows.find((r) => r.player.id === openId) ?? null;
  const toggles: { label: string; on: boolean; set: (v: boolean) => void }[] = [
    { label: t.market.fitsCash, on: fitsCash, set: setFitsCash },
    { label: t.market.freeOrPre, on: freeOnly, set: setFreeOnly },
    { label: t.market.brazilianOnly, on: brOnly, set: setBrOnly },
    { label: t.market.savedOnly, on: savedOnly, set: setSavedOnly },
  ];

  return (
    <>
      <main className="flex flex-col gap-4 py-5 pb-44">
        <label className="relative block">
          <span className="sr-only">{t.market.search}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            placeholder={t.market.search}
            className="h-11 w-full rounded-md border bg-card pr-3 pl-9 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </label>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label={t.market.filters}>
          {SECTORS.map((s) => (
            <Chip key={s} on={sector === s} onClick={() => { setSector(s); setLimit(PAGE); }}>
              {s === "ALL" ? t.market.sectorAll : t.squad.sectors[s]}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {toggles.map((f) => (
            <Chip key={f.label} on={f.on} onClick={() => { f.set(!f.on); setLimit(PAGE); }}>
              {f.label}
            </Chip>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">{t.market.results(filtered.length)}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-11 rounded-md border bg-card px-3 text-sm"
            aria-label="Ordenar"
          >
            {(Object.keys(t.market.sort) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {t.market.sort[k]}
              </option>
            ))}
          </select>
        </div>

        <Button variant="outline" className="self-start" onClick={() => setCreating(true)}>
          <Plus />
          {t.market.createOpen}
        </Button>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">{t.market.empty}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.slice(0, limit).map((r) => {
              const club = r.player.clubId ? catalog.clubs.get(r.player.clubId) : undefined;
              const tag = r.signed
                ? t.market.signed
                : r.contract === "expired"
                  ? t.market.free
                  : r.contract === "pre_contract"
                    ? t.market.preContract
                    : null;
              return (
                <li key={r.player.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(r.player.id)}
                    className="flex min-h-16 w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-secondary">
                      <span className="text-base leading-none font-bold tabular-nums">{r.overall}</span>
                      <span className="text-[10px] leading-tight font-medium">{t.squad.positions[r.player.position]}</span>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-medium">{r.player.name}</span>
                        {saved.includes(r.player.id) ? <Bookmark className="size-3.5 shrink-0 fill-current text-primary" /> : null}
                      </span>
                      <span className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                        {club ? <ClubBadge shortName={club.shortName} color={club.color} className="size-5 text-[7px] ring-0" /> : null}
                        {r.age !== null ? `${r.age} ${t.squad.years} · ` : ""}
                        {formatMoney(r.defaults.fee)}
                        {r.foreign ? " · 🌍" : ""}
                      </span>
                      {tag ? (
                        <span className={cn("self-start rounded-full px-2 py-0.5 text-xs font-medium", r.signed ? "bg-primary/15 text-primary" : "bg-highlight/20")}>
                          {tag}
                        </span>
                      ) : null}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {filtered.length > limit ? (
          <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)}>
            {t.market.more}
          </Button>
        ) : null}
      </main>

      <SigningSheet row={open} plan={plan} catalog={catalog} onClose={() => setOpenId(null)} />
      <CreatePlayerSheet open={creating} onClose={() => setCreating(false)} />
      <CashBar plan={plan} catalog={catalog} action={{ href: "/elenco", label: t.market.squad }} />
    </>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
