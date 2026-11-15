import { AppHeader } from "@/components/app-header";
import { PageShell } from "@/components/page-shell";
import { t } from "@/messages";

import { MarketScreen } from "./market-screen";

export const metadata = { title: `${t.market.title} · ${t.app.name}` };

export default function MarketPage() {
  return (
    <PageShell>
      <AppHeader backHref="/elenco" title={t.market.title} />
      <MarketScreen />
    </PageShell>
  );
}
