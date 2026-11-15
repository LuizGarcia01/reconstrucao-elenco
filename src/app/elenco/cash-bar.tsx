"use client";

import { computeCash, formatMoney, squadCounts, validatePlan, type Catalog, type Plan } from "@engine";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t } from "@/messages";

/** Barra fixa com caixa, contadores e pendências que impedem simular. */
export function CashBar({ plan, catalog }: { plan: Plan; catalog: Catalog }) {
  const cash = computeCash(plan, catalog);
  const counts = squadCounts(plan, catalog);
  const errors = validatePlan(plan, catalog).filter((i) => i.level === "error");
  const [showIssues, setShowIssues] = useState(false);

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {showIssues && errors.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm text-destructive">
            {errors.map((e, i) => (
              <li key={i}>• {t.squad.issueText[e.code]}</li>
            ))}
          </ul>
        ) : null}
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-xs text-muted-foreground">{t.squad.cash}</span>
            <span
              className={cn(
                "truncate text-lg font-bold tabular-nums",
                cash.limited && cash.balance < 0 && "text-destructive",
              )}
            >
              {formatMoney(cash.balance)}
              {!cash.limited ? <span className="ml-1 text-xs font-normal text-muted-foreground">({t.squad.cashUnlimited})</span> : null}
            </span>
          </div>
          {errors.length > 0 ? (
            <Button variant="outline" className="border-destructive/50 text-destructive" onClick={() => setShowIssues((v) => !v)}>
              <AlertCircle />
              {t.squad.issues(errors.length)}
            </Button>
          ) : null}
          <Button disabled title={t.squad.marketSoon}>
            {t.squad.market}
          </Button>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {counts.staying} {t.squad.staying} · {counts.leaving} {t.squad.leavingCount} · {counts.arriving} {t.squad.arriving}
        </span>
      </div>
    </div>
  );
}
