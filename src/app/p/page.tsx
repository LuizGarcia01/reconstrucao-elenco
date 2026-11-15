import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { PageShell } from "@/components/page-shell";
import { planCardFromPacked } from "@/lib/plan-card.server";
import { t } from "@/messages";

import { ReceivedPlan } from "./received-plan";

type Props = { searchParams: Promise<{ d?: string; r?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { d, r } = await searchParams;
  const data = await planCardFromPacked(d, r === "1");
  if (!data) return { title: t.app.name };
  const title = `${t.share.shareText(data.card.club.name)} · ${t.app.name}`;
  const description = data.card.result
    ? `Simulação: ${data.card.result.position}º lugar com ${data.card.result.points} pontos. Chegam ${data.card.arrivals.length}, saem ${data.card.departures.length}.`
    : `Chegam ${data.card.arrivals.length}, saem ${data.card.departures.length}. Abra para ver o XI e simular.`;
  const image = `/p/og?d=${d}${r === "1" ? "&r=1" : ""}`;
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ReceivedPlanPage({ searchParams }: Props) {
  const { d, r } = await searchParams;
  const data = await planCardFromPacked(d, r === "1");
  return (
    <PageShell>
      <AppHeader backHref="/" title={t.share.received} />
      <ReceivedPlan packed={data ? d! : null} clubName={data?.card.club.name ?? ""} withResult={r === "1"} />
    </PageShell>
  );
}
