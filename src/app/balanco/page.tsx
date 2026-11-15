import { AppHeader } from "@/components/app-header";
import { PageShell } from "@/components/page-shell";
import { t } from "@/messages";

import { BalanceScreen } from "./balance-screen";

export const metadata = { title: `${t.balance.title} · ${t.app.name}` };

export default function BalancePage() {
  return (
    <PageShell>
      <AppHeader backHref="/elenco" title={t.balance.title} />
      <BalanceScreen />
    </PageShell>
  );
}
