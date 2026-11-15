"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ClubBadge } from "@/components/club-badge";
import { Button } from "@/components/ui/button";
import { usePlanStore } from "@/lib/plan-store";
import { useHydrated } from "@/lib/use-hydrated";
import { t } from "@/messages";

type ClubInfo = { name: string; shortName: string; color: string };

export function HomeActions({ clubs }: { clubs: Record<string, ClubInfo> }) {
  const hydrated = useHydrated();
  const plan = usePlanStore((s) => s.plan);
  const club = hydrated && plan ? clubs[plan.clubId] : undefined;

  if (!club) {
    return (
      <div className="pt-2">
        <Button asChild size="lg">
          <Link href="/clube">
            {t.home.start}
            <ArrowRight />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
      <Button asChild size="lg">
        <Link href="/elenco">
          <ClubBadge shortName={club.shortName} color={club.color} className="size-7 text-[10px] ring-0" />
          {t.home.continuePlan}: {club.name}
          <ArrowRight />
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href="/clube">{t.home.newPlan}</Link>
      </Button>
    </div>
  );
}
