import { AppHeader } from "@/components/app-header";
import { PageShell } from "@/components/page-shell";
import { clubSummaries } from "@/lib/catalog.server";
import { t } from "@/messages";

import { PlanSummary } from "./plan-summary";

export const metadata = { title: `${t.squad.title} · ${t.app.name}` };

export default function SquadPage() {
  const clubs = Object.fromEntries(clubSummaries().map((c) => [c.id, { name: c.name, shortName: c.shortName, color: c.color }]));
  return (
    <PageShell>
      <AppHeader backHref="/orcamento" title={t.squad.title} />
      <main className="flex flex-col gap-4 py-6">
        <PlanSummary clubs={clubs} />
      </main>
    </PageShell>
  );
}
