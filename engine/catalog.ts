/**
 * Formato do retrato de dados (snapshot) que o jogo lê.
 * É o nosso formato: os adaptadores de fonte (scripts/sources/*) convertem
 * para cá, e o jogo nunca sabe de onde o dado veio.
 */
import type { Money } from "./money";

export const SNAPSHOT_VERSION = 1;

export const POSITIONS = ["GK", "CB", "LB", "RB", "DM", "CM", "AM", "LW", "RW", "ST"] as const;
export type Position = (typeof POSITIONS)[number];

export type Sector = "GK" | "DEF" | "MID" | "ATT";

export const SECTOR_OF: Record<Position, Sector> = {
  GK: "GK",
  CB: "DEF",
  LB: "DEF",
  RB: "DEF",
  DM: "MID",
  CM: "MID",
  AM: "MID",
  LW: "ATT",
  RW: "ATT",
  ST: "ATT",
};

export type Foot = "left" | "right" | "both";

export interface League {
  id: string;
  name: string;
  country: string; // ISO 3166-1 alfa-2, ex.: "BR"
  tier: number; // 1 = primeira divisão
  foreignLimit: number | null; // estrangeiros relacionados por jogo; null = sem limite
}

export interface Club {
  id: string; // slug estável, ex.: "palmeiras"
  name: string;
  shortName: string;
  leagueId: string;
  color: string; // hex, usado no avatar e no escudo gerado
}

export interface Player {
  id: string; // id estável da fonte, prefixado: "tm:12345"
  name: string;
  shortName: string;
  birthDate: string | null; // AAAA-MM-DD
  nationalities: string[]; // ISO alfa-2; a primeira é a principal
  position: Position;
  secondaryPositions: Position[];
  foot: Foot | null;
  clubId: string | null; // null = sem clube
  marketValue: Money; // milhares de euros
  contractUntil: string | null; // AAAA-MM-DD
  loanFromClubId: string | null;
}

export interface Snapshot {
  version: typeof SNAPSHOT_VERSION;
  season: string; // ex.: "2026"
  source: string; // ex.: "transfermarkt"
  generatedAt: string; // ISO 8601
  leagues: League[];
  clubs: Club[];
  players: Player[];
}

export interface SnapshotIssue {
  path: string;
  message: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const COUNTRY_RE = /^[A-Z]{2}$/;

/** Confere integridade do retrato: ids únicos, referências válidas, campos no formato certo. */
export function validateSnapshot(s: Snapshot): SnapshotIssue[] {
  const issues: SnapshotIssue[] = [];
  const add = (path: string, message: string) => issues.push({ path, message });

  if (s.version !== SNAPSHOT_VERSION) add("version", `versão ${s.version}, esperada ${SNAPSHOT_VERSION}`);

  const leagueIds = new Set<string>();
  s.leagues.forEach((l, i) => {
    if (leagueIds.has(l.id)) add(`leagues[${i}].id`, `id repetido: ${l.id}`);
    leagueIds.add(l.id);
    if (!COUNTRY_RE.test(l.country)) add(`leagues[${i}].country`, `país inválido: ${l.country}`);
  });

  const clubIds = new Set<string>();
  s.clubs.forEach((c, i) => {
    if (clubIds.has(c.id)) add(`clubs[${i}].id`, `id repetido: ${c.id}`);
    clubIds.add(c.id);
    if (!leagueIds.has(c.leagueId)) add(`clubs[${i}].leagueId`, `liga inexistente: ${c.leagueId}`);
    if (!HEX_RE.test(c.color)) add(`clubs[${i}].color`, `cor inválida: ${c.color}`);
  });

  const playerIds = new Set<string>();
  s.players.forEach((p, i) => {
    const at = `players[${i}]`;
    if (playerIds.has(p.id)) add(`${at}.id`, `id repetido: ${p.id}`);
    playerIds.add(p.id);
    if (!p.name.trim()) add(`${at}.name`, "nome vazio");
    if (!(POSITIONS as readonly string[]).includes(p.position)) add(`${at}.position`, `posição inválida: ${p.position}`);
    if (p.clubId !== null && !clubIds.has(p.clubId)) add(`${at}.clubId`, `clube inexistente: ${p.clubId}`);
    if (p.loanFromClubId !== null && p.loanFromClubId === p.clubId)
      add(`${at}.loanFromClubId`, "emprestado pelo próprio clube");
    if (!Number.isInteger(p.marketValue) || p.marketValue < 0)
      add(`${at}.marketValue`, `valor inválido: ${p.marketValue}`);
    if (p.birthDate !== null && !DATE_RE.test(p.birthDate)) add(`${at}.birthDate`, `data inválida: ${p.birthDate}`);
    if (p.contractUntil !== null && !DATE_RE.test(p.contractUntil))
      add(`${at}.contractUntil`, `data inválida: ${p.contractUntil}`);
    p.nationalities.forEach((n, j) => {
      if (!COUNTRY_RE.test(n)) add(`${at}.nationalities[${j}]`, `país inválido: ${n}`);
    });
  });

  return issues;
}

/** Idade em anos completos numa data de referência (AAAA-MM-DD). */
export function ageOn(birthDate: string, refDate: string): number {
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [ry, rm, rd] = refDate.split("-").map(Number);
  let age = ry - by;
  if (rm < bm || (rm === bm && rd < bd)) age--;
  return age;
}
