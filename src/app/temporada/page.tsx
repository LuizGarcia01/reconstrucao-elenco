import { AppHeader } from "@/components/app-header";
import { PageShell } from "@/components/page-shell";
import { t } from "@/messages";

import { SeasonScreen } from "./season-screen";

export const metadata = { title: `${t.season.title} · ${t.app.name}` };

export default function SeasonPage() {
  return (
    <PageShell>
      <AppHeader backHref="/xi" title={t.season.title} />
      <SeasonScreen />
    </PageShell>
  );
}
