import { AppHeader } from "@/components/app-header";
import { PageShell } from "@/components/page-shell";
import { clubSummaries, LEAGUE_NAME } from "@/lib/catalog.server";
import { t } from "@/messages";

import { ClubPicker } from "./club-picker";

export const metadata = { title: `${t.club.title} · ${t.app.name}` };

export default function ClubPage() {
  return (
    <PageShell>
      <AppHeader backHref="/" title={t.club.title} />
      <main className="flex flex-col gap-4 py-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">{LEAGUE_NAME}</h1>
          <p className="text-muted-foreground">{t.club.lead}</p>
        </div>
        <ClubPicker clubs={clubSummaries()} />
      </main>
    </PageShell>
  );
}
