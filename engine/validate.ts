/**
 * Erros impedem simular; avisos só informam.
 * Toda mensagem tem um código estável para a interface traduzir e destacar.
 */
import { SECTOR_OF } from "./catalog";
import { computeCash } from "./finance";
import { decisionFor, isForeign, resultingSquad, type Catalog, type Plan } from "./plan";
import { contractStatus } from "./season";

export type IssueCode =
  | "unknown_club"
  | "unknown_player"
  | "decision_not_in_squad"
  | "signing_own_player"
  | "duplicate_signing"
  | "negative_fee"
  | "over_budget"
  | "not_enough_players"
  | "no_goalkeeper"
  | "expiring_without_renewal"
  | "foreigners_over_matchday_limit"
;

export interface PlanIssue {
  level: "error" | "warning";
  code: IssueCode;
  playerId?: string;
  detail?: string;
}

/** Mínimo para simular: 11 titulares e 5 reservas. */
export const MIN_SQUAD = 16;

export function validatePlan(plan: Plan, catalog: Catalog): PlanIssue[] {
  const issues: PlanIssue[] = [];
  const club = catalog.clubs.get(plan.clubId);
  if (!club) return [{ level: "error", code: "unknown_club", detail: plan.clubId }];
  const league = catalog.leagues.get(club.leagueId);
  const own = new Set((catalog.squads.get(plan.clubId) ?? []).map((p) => p.id));

  for (const id of Object.keys(plan.decisions)) {
    if (!own.has(id)) issues.push({ level: "error", code: "decision_not_in_squad", playerId: id });
    const d = plan.decisions[id];
    if (d.kind === "sell" && d.fee < 0) issues.push({ level: "error", code: "negative_fee", playerId: id });
  }

  const seen = new Set<string>();
  for (const s of plan.signings) {
    if (!catalog.players.has(s.playerId)) issues.push({ level: "error", code: "unknown_player", playerId: s.playerId });
    if (own.has(s.playerId)) issues.push({ level: "error", code: "signing_own_player", playerId: s.playerId });
    if (seen.has(s.playerId)) issues.push({ level: "error", code: "duplicate_signing", playerId: s.playerId });
    if (s.fee < 0) issues.push({ level: "error", code: "negative_fee", playerId: s.playerId });
    seen.add(s.playerId);
  }

  const cash = computeCash(plan, catalog);
  if (cash.limited && cash.balance < 0) {
    issues.push({ level: "error", code: "over_budget", detail: String(cash.balance) });
  }

  // Contratos vencendo: avisar quem vai sair de graça por falta de renovação.
  for (const p of catalog.squads.get(plan.clubId) ?? []) {
    const d = decisionFor(plan, p.id);
    const status = contractStatus(p.contractUntil);
    if (d.kind === "keep" && !d.renewal && status === "expired") {
      issues.push({ level: "warning", code: "expiring_without_renewal", playerId: p.id });
    }
  }

  const squad = resultingSquad(plan, catalog);
  if (squad.length < MIN_SQUAD) {
    issues.push({ level: "error", code: "not_enough_players", detail: `${squad.length}/${MIN_SQUAD}` });
  }
  if (!squad.some((m) => SECTOR_OF[m.position] === "GK")) {
    issues.push({ level: "error", code: "no_goalkeeper" });
  }

  if (league?.foreignLimit != null) {
    const foreigners = squad.filter((m) => isForeign(m.nationalities, league.country)).length;
    if (foreigners > league.foreignLimit) {
      issues.push({
        level: "warning",
        code: "foreigners_over_matchday_limit",
        detail: `${foreigners}/${league.foreignLimit}`,
      });
    }
  }

  return issues;
}

export function canSimulate(issues: PlanIssue[]): boolean {
  return !issues.some((i) => i.level === "error");
}
