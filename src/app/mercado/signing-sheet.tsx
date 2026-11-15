"use client";

import { formatMoney, fromMillions, spendable, type Catalog, type MarketRow, type Plan } from "@engine";
import { Bookmark } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePlanStore } from "@/lib/plan-store";
import { cn } from "@/lib/utils";
import { t } from "@/messages";

export function SigningSheet({
  row,
  plan,
  catalog,
  onClose,
}: {
  row: MarketRow | null;
  plan: Plan;
  catalog: Catalog;
  onClose: () => void;
}) {
  return (
    <Sheet open={row !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]">
        {row ? <Body key={row.player.id} row={row} plan={plan} catalog={catalog} onClose={onClose} /> : null}
      </SheetContent>
    </Sheet>
  );
}

const toText = (thousands: number) => String(thousands / 1000).replace(".", ",");
const parse = (s: string) => Number(s.replace(",", "."));
const valid = (n: number, s: string) => s.trim() !== "" && Number.isFinite(n) && n >= 0 && n <= 500;

function Body({ row, plan, catalog, onClose }: { row: MarketRow; plan: Plan; catalog: Catalog; onClose: () => void }) {
  const upsert = usePlanStore((s) => s.upsertSigning);
  const remove = usePlanStore((s) => s.removeSigning);
  const saved = usePlanStore((s) => s.saved.includes(row.player.id));
  const toggleSaved = usePlanStore((s) => s.toggleSaved);

  const existing = plan.signings.find((s) => s.playerId === row.player.id);
  const [feeText, setFeeText] = useState(toText(existing?.fee ?? row.defaults.fee));
  const [salaryText, setSalaryText] = useState(toText(existing?.salary ?? row.defaults.salary));
  const fee = parse(feeText);
  const salary = parse(salaryText);
  const ok = valid(fee, feeText) && valid(salary, salaryText);

  // O que já foi gasto com este jogador volta para o caixa ao editar a contratação.
  const available = spendable(plan, catalog) + (existing?.fee ?? 0);
  const feeK = ok ? fromMillions(fee) : 0;
  const missing = Number.isFinite(available) ? feeK - available : -1;

  const p = row.player;
  const club = p.clubId ? catalog.clubs.get(p.clubId) : undefined;

  function sign() {
    upsert({ playerId: p.id, fee: fromMillions(fee), salary: fromMillions(salary), arrival: row.defaults.arrival });
    onClose();
  }

  return (
    <>
      <SheetHeader className="pr-14">
        <SheetTitle className="text-xl">{p.name}</SheetTitle>
        <SheetDescription>
          {t.squad.positions[p.position]}
          {row.age !== null ? ` · ${row.age} ${t.squad.years}` : ""}
          {club ? ` · ${club.name}` : ""}
          {row.foreign ? ` · ${t.squad.foreign}` : ""}
        </SheetDescription>
      </SheetHeader>

      <dl className="grid grid-cols-2 gap-3 px-4 text-sm">
        <Stat label={t.squad.overall} value={String(row.overall)} />
        <Stat label={t.squad.value} value={formatMoney(p.marketValue)} />
      </dl>

      {row.contract === "expired" ? <p className="px-4 text-sm text-muted-foreground">{t.market.freeHint}</p> : null}
      {row.contract === "pre_contract" ? <p className="px-4 text-sm text-muted-foreground">{t.market.preHint}</p> : null}

      <div className="grid grid-cols-2 gap-3 px-4">
        <Field label={t.market.fee} value={feeText} onChange={setFeeText} invalid={!valid(fee, feeText)} />
        <Field label={t.market.salary} value={salaryText} onChange={setSalaryText} invalid={!valid(salary, salaryText)} />
      </div>
      {!ok ? <p className="px-4 text-sm text-destructive">{t.market.invalid}</p> : null}
      {ok && missing > 0 ? <p className="px-4 text-sm text-destructive">{t.market.noCash(formatMoney(missing))}</p> : null}

      <div className="flex flex-wrap gap-2 px-4">
        <Button disabled={!ok || missing > 0} onClick={sign}>
          {existing ? t.market.update : t.market.sign}
        </Button>
        {existing ? (
          <Button
            variant="outline"
            onClick={() => {
              remove(p.id);
              onClose();
            }}
          >
            {t.market.undoSigning}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={() => toggleSaved(p.id)} aria-pressed={saved}>
          <Bookmark className={cn(saved && "fill-current")} />
          {saved ? t.market.unsave : t.market.save}
        </Button>
      </div>
    </>
  );
}

function Field({ label, value, onChange, invalid }: { label: string; value: string; onChange: (v: string) => void; invalid: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium">{label}</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        className="h-11 w-full rounded-md border bg-card px-3 text-base tabular-nums outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
      />
    </label>
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
