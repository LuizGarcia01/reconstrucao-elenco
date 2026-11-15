import type { ClubData } from "@/lib/club-data";
import { catalog } from "@/lib/catalog.server";

// Um JSON estático por clube, gerado no build: o navegador baixa só o elenco do clube escolhido.
export const dynamic = "force-static";

export function generateStaticParams() {
  return catalog.snapshot.clubs.map((c) => ({ clubId: c.id }));
}

export async function GET(_req: Request, ctx: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await ctx.params;
  const club = catalog.clubs.get(clubId);
  if (!club) return Response.json({ error: "clube não encontrado" }, { status: 404 });
  const league = catalog.leagues.get(club.leagueId)!;
  const data: ClubData = { league, club, players: catalog.squads.get(clubId) ?? [] };
  return Response.json(data);
}
