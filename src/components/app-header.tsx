import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { t } from "@/messages";

export function AppHeader({ backHref, title }: { backHref?: string; title?: string }) {
  return (
    <header className="sticky top-0 z-10 -mx-4 flex h-16 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
      {backHref ? (
        <Button asChild variant="ghost" size="icon" aria-label={t.common.back}>
          <Link href={backHref}>
            <ChevronLeft />
          </Link>
        </Button>
      ) : null}
      <span className="flex-1 truncate font-semibold tracking-tight">{title ?? t.app.name}</span>
      <ThemeToggle />
    </header>
  );
}
