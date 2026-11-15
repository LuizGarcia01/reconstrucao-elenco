"use client";

import { defaultRenewal, formatMoney, fromMillions, type Decision, type SquadRow } from "@engine";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePlanStore } from "@/lib/plan-store";
import { cn } from "@/lib/utils";
import { t } from "@/messages";

type Choice = "keep" | "renew" | "sell" | "loan_out" | "release" | "retire";

function currentChoice(d: Decision): Choice {
  if (d.kind === "keep") return d.renewal ? "renew" : "keep";
  return d.kind;
}

export function PlayerSheet({ row, onClose }: { row: SquadRow | null; onClose: () => void }) {
  return (
    <Sheet open={row !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]">
        {row ? <SheetBody key={row.player.id} row={row} onClose={onClose} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function SheetBody({ row, onClose }: { row: SquadRow; onClose: () => void }) {
  const setDecisions = usePlanStore((s) => s.setDecisions);
  const current = currentChoice(row.decision);
  const [selling, setSelling] = useState(current === "sell");
  const initialFee = row.decision.kind === "sell" ? row.decision.fee : row.player.marketValue;
  const [feeText, setFeeText] = useState(String(initialFee / 1000).replace(".", ","));
  const fee = Number(feeText.replace(",", "."));
  const feeValid = feeText.trim() !== "" && Number.isFinite(fee) && fee >= 0 && fee <= 500;

  function apply(d: Decision) {
    setDecisions({ [row.player.id]: d });
    onClose();
  }

  const p = row.player;
  const options: { choice: Choice; show: boolean; onPick: () => void }[] = [
    { choice: "keep", show: true, onPick: () => apply({ kind: "keep" }) },
    { choice: "renew", show: row.contract !== "running", onPick: () => apply({ kind: "keep", renewal: defaultRenewal(p) }) },
    { choice: "sell", show: true, onPick: () => setSelling(true) },
    { choice: "loan_out", show: true, onPick: () => apply({ kind: "loan_out" }) },
    { choice: "release", show: true, onPick: () => apply({ kind: "release" }) },
    { choice: "retire", show: (row.age ?? 0) >= 33, onPick: () => apply({ kind: "retire" }) },
  ];

  return (
    <>
      <SheetHeader className="pr-14">
        <SheetTitle className="text-xl">{p.name}</SheetTitle>
        <SheetDescription>
          {t.squad.positions[p.position]}
          {row.age !== null ? ` · ${row.age} ${t.squad.years}` : ""}
          {row.foreign ? ` · ${t.squad.foreign}` : ""}
        </SheetDescription>
      </SheetHeader>

      <dl className="grid grid-cols-2 gap-3 px-4 text-sm">
        <Stat label={t.squad.overall} value={String(row.overall)} />
        <Stat label={t.squad.value} value={formatMoney(p.marketValue)} />
        <Stat label={t.squad.salary} value={`${formatMoney(row.salary)}${t.common.perYear}`} />
        <Stat label={t.squad.contract} value={p.contractUntil ? p.contractUntil.slice(0, 7).split("-").reverse().join("/") : "—"} />
      </dl>

      {selling ? (
        <div className="flex flex-col gap-3 px-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t.squad.sellFee}</span>
            <input
              inputMode="decimal"
              autoFocus
              value={feeText}
              onChange={(e) => setFeeText(e.target.value)}
              aria-invalid={!feeValid}
              className="h-11 w-full max-w-48 rounded-md border bg-card px-3 text-base tabular-nums outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
            />
            <span className={cn("text-sm", feeValid ? "text-muted-foreground" : "text-destructive")}>
              {feeValid ? `${formatMoney(fromMillions(fee))} · ${t.squad.sellHint}` : t.squad.feeInvalid}
            </span>
          </label>
          <div className="flex gap-2">
            <Button disabled={!feeValid} onClick={() => apply({ kind: "sell", fee: fromMillions(fee) })}>
              {t.squad.confirmSell}
            </Button>
            <Button variant="ghost" onClick={() => setSelling(false)}>
              {t.squad.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 px-4">
          {options
            .filter((o) => o.show)
            .map((o) => (
              <Button
                key={o.choice}
                variant={current === o.choice ? "default" : "outline"}
                aria-pressed={current === o.choice}
                onClick={o.onPick}
              >
                {t.squad.decisions[o.choice]}
              </Button>
            ))}
        </div>
      )}
      {!selling && (current === "renew" || row.contract !== "running") ? (
        <p className="px-4 text-sm text-muted-foreground">{t.squad.renewHint}</p>
      ) : null}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-lg bg-secondary px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
