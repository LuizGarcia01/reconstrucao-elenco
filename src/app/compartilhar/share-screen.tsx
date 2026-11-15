"use client";

import { Copy, Download, Share2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useCatalog, clubOf } from "@/lib/club-data";
import { usePlanStore } from "@/lib/plan-store";
import { packPlan, planLink } from "@/lib/share-link";
import { useHydrated } from "@/lib/use-hydrated";
import { t } from "@/messages";

export function ShareScreen() {
  const hydrated = useHydrated();
  const plan = usePlanStore((s) => s.plan);
  const state = useCatalog(hydrated && plan !== null);
  const [packed, setPacked] = useState<{ for: object; value: string } | null>(null);
  const [withResult, setWithResult] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!plan) return;
    let cancelled = false;
    packPlan(plan).then((value) => !cancelled && setPacked({ for: plan, value }));
    return () => {
      cancelled = true;
    };
  }, [plan]);

  const club = plan && state.status === "ready" ? clubOf(state.catalog, plan.clubId) : undefined;
  if (!hydrated || (plan && state.status === "loading")) {
    return <div className="mt-6 h-96 animate-pulse rounded-xl bg-muted" aria-busy />;
  }
  if (!plan || !club) {
    return (
      <div className="flex flex-col items-start gap-4 py-10">
        <p className="text-muted-foreground">{t.squad.noPlan}</p>
        <Button asChild>
          <Link href="/clube">{t.squad.chooseClub}</Link>
        </Button>
      </div>
    );
  }

  const ready = packed && packed.for === plan ? packed.value : null;
  const query = ready ? `d=${ready}${withResult ? "&r=1" : ""}` : "";
  const link = ready ? `${planLink(window.location.origin, ready)}${withResult ? "&r=1" : ""}` : "";
  const imageUrl = ready ? `/p/og?${query}` : "";
  const text = t.share.shareText(club.name);

  async function imageFile(): Promise<File> {
    const blob = await fetch(imageUrl).then((r) => r.blob());
    return new File([blob], `plano-${club!.id}.png`, { type: "image/png" });
  }

  async function share() {
    try {
      const file = await imageFile();
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${text}\n${link}` });
      } else if (navigator.share) {
        await navigator.share({ title: text, text, url: link });
      } else {
        await copy();
      }
    } catch {
      // usuário cancelou o compartilhamento: nada a fazer
    }
  }

  async function download() {
    const file = await imageFile();
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t.share.copyLink, link);
    }
  }

  return (
    <main className="flex flex-col gap-4 py-6">
      <p className="text-muted-foreground">{t.share.lead}</p>
      {ready ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagem gerada sob demanda pelo servidor
        <img key={imageUrl} src={imageUrl} alt={text} width={1200} height={630} className="w-full rounded-xl border bg-muted" />
      ) : (
        <div className="flex aspect-[1200/630] w-full items-center justify-center rounded-xl border bg-muted text-sm text-muted-foreground">
          {t.share.loading}
        </div>
      )}
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" checked={withResult} onChange={(e) => setWithResult(e.target.checked)} className="size-5 accent-primary" />
        <span>{t.share.withResult}</span>
      </label>
      <div className="flex flex-wrap gap-2">
        <Button onClick={share} disabled={!ready}>
          <Share2 />
          {t.share.share}
        </Button>
        <Button variant="outline" onClick={download} disabled={!ready}>
          <Download />
          {t.share.saveImage}
        </Button>
        <Button variant="outline" onClick={copy} disabled={!ready}>
          <Copy />
          {copied ? t.share.copied : t.share.copyLink}
        </Button>
      </div>
    </main>
  );
}
