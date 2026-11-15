import { catalog } from "@/lib/catalog.server";

// Retrato inteiro como JSON estático do build (o mercado precisa de todos os jogadores).
export const dynamic = "force-static";

export function GET() {
  return Response.json(catalog.snapshot);
}
