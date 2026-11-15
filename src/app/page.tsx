import { AppHeader } from "@/components/app-header";
import { PageShell } from "@/components/page-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { clubSummaries } from "@/lib/catalog.server";
import { t } from "@/messages";

import { HomeActions } from "./home-actions";

export default function Home() {
  const clubs = Object.fromEntries(clubSummaries().map((c) => [c.id, { name: c.name, shortName: c.shortName, color: c.color }]));
  return (
    <PageShell>
      <AppHeader />
      <main className="flex flex-1 flex-col gap-10 py-10">
        <section className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-balance sm:text-5xl">
            {t.home.headline}
          </h1>
          <p className="max-w-prose text-lg text-muted-foreground">{t.home.lead}</p>
          <HomeActions clubs={clubs} />
        </section>

        <ol className="grid gap-3 sm:grid-cols-3">
          {t.home.steps.map((step, i) => (
            <li key={step.title}>
              <Card className="h-full">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <CardTitle>{step.title}</CardTitle>
                  <CardDescription>{step.body}</CardDescription>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </main>
    </PageShell>
  );
}
