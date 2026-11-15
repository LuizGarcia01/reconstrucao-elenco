import { cn } from "@/lib/utils";

/** Escudo genérico: sigla sobre a cor principal do clube. Nunca usamos escudos reais. */
export function ClubBadge({ shortName, color, className }: { shortName: string; color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full text-xs font-bold tracking-wide text-white ring-1 ring-foreground/15",
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {shortName}
    </span>
  );
}
