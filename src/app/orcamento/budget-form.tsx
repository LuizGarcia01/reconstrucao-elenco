"use client";

import { formatMoney, fromMillions, type BudgetMode } from "@engine";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ClubBadge } from "@/components/club-badge";
import { Button } from "@/components/ui/button";
import { usePlanStore } from "@/lib/plan-store";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { t } from "@/messages";

type ClubInfo = { name: string; shortName: string; color: string; presetBudget: number };

const MODES: BudgetMode[] = ["preset", "custom", "unlimited", "zero"];
const MAX_MILLIONS = 2000;

export function BudgetForm({ clubs }: { clubs: Record<string, ClubInfo> }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const plan = usePlanStore((s) => s.plan);
  const setBudget = usePlanStore((s) => s.setBudget);

  const [mode, setMode] = useState<BudgetMode | null>(null);
  const [customText, setCustomText] = useState<string | null>(null);

  if (!hydrated) return <div className="h-96 animate-pulse rounded-xl bg-muted" aria-busy />;

  const club = plan ? clubs[plan.clubId] : undefined;
  if (!plan || !club) {
    return (
      <div className="flex flex-col items-start gap-4 py-10">
        <p className="text-muted-foreground">{t.budget.noPlan}</p>
        <Button asChild>
          <Link href="/clube">{t.budget.chooseClub}</Link>
        </Button>
      </div>
    );
  }

  const selected = mode ?? plan.budget.mode;
  const customValue =
    customText ?? (plan.budget.mode === "custom" ? String(plan.budget.amount / 1000).replace(".", ",") : "");
  const customMillions = Number(customValue.replace(",", "."));
  const customValid = customValue.trim() !== "" && Number.isFinite(customMillions) && customMillions >= 0 && customMillions <= MAX_MILLIONS;

  function amountLabel(m: BudgetMode): string | null {
    if (m === "preset") return formatMoney(club!.presetBudget);
    if (m === "zero") return formatMoney(0);
    return null;
  }

  function confirm() {
    if (selected === "custom" && !customValid) return;
    const amount =
      selected === "preset" ? club!.presetBudget : selected === "custom" ? fromMillions(customMillions) : 0;
    setBudget({ mode: selected, amount });
    router.push("/elenco");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <ClubBadge shortName={club.shortName} color={club.color} />
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight">{club.name}</h1>
          <p className="text-sm text-muted-foreground">{t.budget.lead}</p>
        </div>
      </div>

      <div role="radiogroup" aria-label={t.budget.title} className="grid gap-3 sm:grid-cols-2">
        {MODES.map((m) => {
          const active = selected === m;
          const label = amountLabel(m);
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMode(m)}
              className={cn(
                "flex min-h-24 flex-col gap-1 rounded-xl border bg-card p-4 text-left transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                active ? "border-primary ring-1 ring-primary" : "hover:bg-accent",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold">{t.budget.modes[m].title}</span>
                {active ? <Check className="size-4 text-primary" /> : null}
              </span>
              {label ? <span className="text-lg font-semibold tabular-nums">{label}</span> : null}
              <span className="text-sm text-muted-foreground">{t.budget.modes[m].body}</span>
            </button>
          );
        })}
      </div>

      {selected === "custom" ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t.budget.customLabel}</span>
          <input
            inputMode="decimal"
            value={customValue}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="25"
            aria-invalid={customValue !== "" && !customValid}
            className="h-11 w-full max-w-48 rounded-md border bg-card px-3 text-base tabular-nums outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
          />
          {customValue !== "" && !customValid ? (
            <span className="text-sm text-destructive">{t.budget.customInvalid}</span>
          ) : customValid ? (
            <span className="text-sm text-muted-foreground">{formatMoney(fromMillions(customMillions))}</span>
          ) : null}
        </label>
      ) : null}

      <div className="pt-2">
        <Button size="lg" onClick={confirm} disabled={selected === "custom" && !customValid}>
          {t.budget.confirm}
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
