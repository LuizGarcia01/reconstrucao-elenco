/**
 * Leitura das páginas de elenco do Transfermarkt salvas no navegador (.com.br, visão "detalhada").
 * Só extrai fatos: id, nome, posição, nascimento, nacionalidades, pé, contrato, valor.
 */
import * as cheerio from "cheerio";

import type { Foot, Position } from "../../../engine/catalog";
import { countryCode } from "./countries";
import { mapPosition } from "./positions";

export interface RawPlayer {
  tmId: string;
  name: string;
  positionLabel: string;
  position: Position | null;
  birthDate: string | null;
  nationalityNames: string[];
  nationalities: string[];
  foot: Foot | null;
  contractUntil: string | null;
  marketValue: number; // milhares de euros
}

export interface SquadPage {
  tmClubId: string;
  players: RawPlayer[];
}

/** "€9.00mi" -> 9000; "€75mil" -> 75; "€1,50 mi." -> 1500; "-" -> 0 (milhares de euros). */
export function parseMarketValue(text: string): number {
  const t = text.replace(/\s/g, "").replace("€", "").toLowerCase();
  const m = t.match(/^([\d.,]+)(mi|mil|m|k|bi)?\.?$/);
  if (!m) return 0;
  const n = Number(m[1].replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  const unit = m[2] ?? "";
  if (unit === "bi") return Math.round(n * 1_000_000);
  if (unit === "mi" || unit === "m") return Math.round(n * 1000);
  if (unit === "mil" || unit === "k") return Math.round(n);
  return Math.round(n / 1000);
}

/** "09/10/1998 (28)" ou "31/07/2030" -> "1998-10-09"; "-" -> null. */
export function parseDate(text: string): string | null {
  const m = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

export function parseFoot(text: string): Foot | null {
  const t = text.trim().toLowerCase();
  if (t === "esquerdo" || t === "left") return "left";
  if (t === "direito" || t === "right") return "right";
  if (t === "ambos" || t === "both") return "both";
  return null;
}

/** Id do clube a partir do link canônico da página. */
function clubIdFrom($: cheerio.CheerioAPI): string | null {
  const href = $('link[rel="canonical"]').attr("href") ?? "";
  return href.match(/\/verein\/(\d+)/)?.[1] ?? null;
}

export function parseSquadPage(html: string): SquadPage {
  const $ = cheerio.load(html);
  if ($("title").text().includes("Human Verification")) {
    throw new Error("Página de verificação anti-robô, não de elenco. Salve de novo pelo navegador.");
  }
  const tmClubId = clubIdFrom($);
  if (!tmClubId) throw new Error("Não achei o id do clube (link canônico) na página.");

  const table = $("table.items").first();
  if (table.length === 0) throw new Error("Tabela de elenco não encontrada. Use a visão detalhada (plus/1).");

  // Ordem das colunas na visão detalhada: #, jogador, nascimento, nacionalidade, altura,
  // pé, no time desde, anterior, contrato, valor.
  const players: RawPlayer[] = [];
  table.find("> tbody > tr").each((_, tr) => {
    const cells = $(tr).children("td");
    if (cells.length < 10) return;

    const link = $(cells[1]).find("td.hauptlink a").first();
    const tmId = link.attr("href")?.match(/\/spieler\/(\d+)/)?.[1];
    if (!tmId) return;

    const positionLabel = $(cells[1]).find("table.inline-table tr").last().text().trim();
    const nationalityNames = $(cells[3])
      .find("img")
      .map((__, img) => $(img).attr("title") ?? "")
      .get()
      .filter(Boolean);

    players.push({
      tmId,
      name: link.text().trim(),
      positionLabel,
      position: mapPosition(positionLabel),
      birthDate: parseDate($(cells[2]).text()),
      nationalityNames,
      nationalities: nationalityNames.map((n) => countryCode(n)).filter((c): c is string => c !== null),
      foot: parseFoot($(cells[5]).text()),
      contractUntil: parseDate($(cells[8]).text()),
      marketValue: parseMarketValue($(cells[9]).text()),
    });
  });

  return { tmClubId, players };
}
