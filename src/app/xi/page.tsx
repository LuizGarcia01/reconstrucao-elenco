import { AppHeader } from "@/components/app-header";
import { PageShell } from "@/components/page-shell";
import { t } from "@/messages";

import { LineupScreen } from "./lineup-screen";

export const metadata = { title: `${t.lineup.title} · ${t.app.name}` };

export default function LineupPage() {
  return (
    <PageShell>
      <AppHeader backHref="/elenco" title={t.lineup.title} />
      <LineupScreen />
    </PageShell>
  );
}
