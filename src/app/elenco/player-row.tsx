"use client";

import { formatMoney, type SquadRow } from "@engine";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { t } from "@/messages";

export function statusLabel(row: SquadRow): { text: string; tone: "warn" | "out" | "ok" } | null {
  if (row.leaving) {
    const base = t.squad.status[row.leaving];
    const fee = row.decision.kind === "sell" ? ` · ${formatMoney(row.decision.fee)}` : "";
    return { text: base + fee, tone: "out" };
  }
  if (row.decision.kind === "keep" && row.decision.renewal) return { text: t.squad.status.renewed, tone: "ok" };
  if (row.contract === "expired") return { text: t.squad.status.expiring, tone: "warn" };
  return null;
}

export function PlayerRow({ row, onOpen }: { row: SquadRow; onOpen: () => void }) {
  const status = statusLabel(row);
  const out = row.leaving !== null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-16 w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span
        className={cn(
          "flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-secondary text-secondary-foreground",
          out && "opacity-50",
        )}
      >
        <span className="text-base leading-none font-bold tabular-nums">{row.overall}</span>
        <span className="text-[10px] leading-tight font-medium">{t.squad.positions[row.player.position]}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("truncate font-medium", out && "text-muted-foreground line-through")}>{row.player.name}</span>
        <span className="truncate text-sm text-muted-foreground">
          {row.age !== null ? `${row.age} ${t.squad.years} · ` : ""}
          {formatMoney(row.player.marketValue)}
          {row.foreign ? " · 🌍" : ""}
        </span>
        {status ? (
          <span
            className={cn(
              "self-start rounded-full px-2 py-0.5 text-xs font-medium",
              status.tone === "warn" && "bg-highlight/20 text-foreground",
              status.tone === "out" && "bg-destructive/15 text-destructive",
              status.tone === "ok" && "bg-primary/15 text-primary",
            )}
          >
            {status.text}
          </span>
        ) : null}
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
