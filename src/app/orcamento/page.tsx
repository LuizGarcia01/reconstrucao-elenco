import { AppHeader } from "@/components/app-header";
import { PageShell } from "@/components/page-shell";
import { clubSummaries } from "@/lib/catalog.server";
import { t } from "@/messages";

import { BudgetForm } from "./budget-form";

export const metadata = { title: `${t.budget.title} · ${t.app.name}` };

export default function BudgetPage() {
  const clubs = Object.fromEntries(
    clubSummaries().map((c) => [c.id, { name: c.name, shortName: c.shortName, color: c.color, presetBudget: c.presetBudget }]),
  );
  return (
    <PageShell>
      <AppHeader backHref="/clube" title={t.budget.title} />
      <main className="flex flex-col gap-4 py-6">
        <BudgetForm clubs={clubs} />
      </main>
    </PageShell>
  );
}
