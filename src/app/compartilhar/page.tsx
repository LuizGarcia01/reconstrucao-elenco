import { AppHeader } from "@/components/app-header";
import { PageShell } from "@/components/page-shell";
import { t } from "@/messages";

import { ShareScreen } from "./share-screen";

export const metadata = { title: `${t.share.title} · ${t.app.name}` };

export default function SharePage() {
  return (
    <PageShell>
      <AppHeader backHref="/temporada" title={t.share.title} />
      <ShareScreen />
    </PageShell>
  );
}
