"use client";

import { sanitizeSharedPlan } from "@engine";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useCatalog } from "@/lib/club-data";
import { usePlanStore } from "@/lib/plan-store";
import { unpackPlan } from "@/lib/share-link";
import { useHydrated } from "@/lib/use-hydrated";
import { t } from "@/messages";

export function ReceivedPlan({ packed, clubName, withResult }: { packed: string | null; clubName: string; withResult: boolean }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const hasPlan = usePlanStore((s) => s.plan !== null);
  const importPlan = usePlanStore((s) => s.importPlan);
  const state = useCatalog(hydrated && packed !== null);
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!packed || failed) {
    return (
      <main className="flex flex-col items-start gap-4 py-10">
        <p className="text-muted-foreground">{t.share.invalid}</p>
        <Button asChild>
          <Link href="/">{t.share.goHome}</Link>
        </Button>
      </main>
    );
  }

  async function open() {
    if (state.status !== "ready") return;
    try {
      const plan = sanitizeSharedPlan(await unpackPlan(packed!), state.catalog);
      if (!plan) return setFailed(true);
      importPlan(plan);
      router.push("/elenco");
    } catch {
      setFailed(true);
    }
  }

  return (
    <main className="flex flex-col gap-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight">{t.share.shareText(clubName)}</h1>
      <p className="text-muted-foreground">{t.share.receivedLead}</p>
      {/* eslint-disable-next-line @next/next/no-img-element -- imagem gerada sob demanda pelo servidor */}
      <img src={`/p/og?d=${packed}${withResult ? "&r=1" : ""}`} alt={t.share.shareText(clubName)} className="w-full rounded-xl border" width={1200} height={630} />
      {hydrated && hasPlan && confirming ? (
        <div className="flex flex-col gap-3 rounded-xl border border-highlight/60 bg-highlight/10 p-4">
          <p className="text-sm">{t.share.replaceWarning}</p>
          <div className="flex gap-2">
            <Button onClick={open} disabled={state.status !== "ready"}>
              {t.share.confirmReplace}
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              {t.squad.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <Button size="lg" className="self-start" disabled={!hydrated || state.status !== "ready"} onClick={() => (hasPlan ? setConfirming(true) : open())}>
          {t.share.openPlan}
        </Button>
      )}
    </main>
  );
}
