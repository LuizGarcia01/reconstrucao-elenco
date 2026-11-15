"use client";

import { formatMoney } from "@engine";
import Link from "next/link";

import { ClubBadge } from "@/components/club-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePlanStore } from "@/lib/plan-store";
import { useHydrated } from "@/lib/use-hydrated";
import { t } from "@/messages";

type ClubInfo = { name: string; shortName: string; color: string };

/** Provisório até a etapa 4: mostra o que o plano já tem. */
export function PlanSummary({ clubs }: { clubs: Record<string, ClubInfo> }) {
  const hydrated = useHydrated();
  const plan = usePlanStore((s) => s.plan);
  if (!hydrated) return <div className="h-48 animate-pulse rounded-xl bg-muted" aria-busy />;

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

  const budget =
    plan.budget.mode === "unlimited" ? t.squad.unlimited : `${t.budget.modes[plan.budget.mode].title} · ${formatMoney(plan.budget.amount)}`;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-center gap-3">
          <ClubBadge shortName={club.shortName} color={club.color} />
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">{t.squad.club}</span>
            <span className="text-lg font-semibold">{club.name}</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">{t.squad.budget}</span>
          <span className="text-lg font-semibold tabular-nums">{budget}</span>
        </div>
      </Card>
      <p className="text-muted-foreground">{t.squad.soon}</p>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/orcamento">{t.squad.changeBudget}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/clube">{t.squad.changeClub}</Link>
        </Button>
      </div>
    </div>
  );
}
