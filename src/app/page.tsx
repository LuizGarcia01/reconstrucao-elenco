import { ArrowRight } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { t } from "@/messages";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4">
      <header className="flex h-16 items-center justify-between">
        <span className="font-semibold tracking-tight">{t.app.name}</span>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col gap-10 py-10">
        <section className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-balance sm:text-5xl">
            {t.home.headline}
          </h1>
          <p className="max-w-prose text-lg text-muted-foreground">{t.home.lead}</p>
          <div className="flex items-center gap-3 pt-2">
            <Button size="lg" disabled>
              {t.home.start}
              <ArrowRight />
            </Button>
            <span className="text-sm text-muted-foreground">{t.home.soon}</span>
          </div>
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
    </div>
  );
}
