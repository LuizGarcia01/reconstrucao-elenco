import { AppHeader } from "@/components/app-header";
import { PageShell } from "@/components/page-shell";
import { t } from "@/messages";

import { SquadScreen } from "./squad-screen";

export const metadata = { title: `${t.squad.title} · ${t.app.name}` };

export default function SquadPage() {
  return (
    <PageShell>
      <AppHeader backHref="/orcamento" title={t.squad.title} />
      <SquadScreen />
    </PageShell>
  );
}
