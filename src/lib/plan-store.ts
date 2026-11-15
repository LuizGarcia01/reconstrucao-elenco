"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { newPlan, PLAN_SCHEMA_VERSION, type Budget, type CustomPlayer, type Decision, type Lineup, type Plan, type Signing } from "@engine";

const HISTORY_LIMIT = 50;

interface PlanState {
  plan: Plan | null;
  /** Planos anteriores, para desfazer. Não é salvo no aparelho. */
  history: Plan[];
  /** Começa um plano novo para o clube (substitui o atual). */
  startPlan: (clubId: string, budget: Budget) => void;
  setBudget: (budget: Budget) => void;
  /** Define (ou, com null, volta ao padrão "fica") a decisão de vários jogadores de uma vez. */
  setDecisions: (changes: Record<string, Decision | null>) => void;
  /** Contrata ou atualiza uma contratação. */
  upsertSigning: (signing: Signing) => void;
  removeSigning: (playerId: string) => void;
  addCustomPlayer: (player: CustomPlayer) => void;
  removeCustomPlayer: (id: string) => void;
  setLineup: (lineup: Lineup) => void;
  undo: () => void;
  reset: () => void;
  /** Jogadores salvos para ver depois no mercado (não fazem parte do plano). */
  saved: string[];
  toggleSaved: (playerId: string) => void;
}

// localStorage pode falhar (aba anônima, armazenamento bloqueado): o app segue funcionando sem salvar.
const safeStorage = createJSONStorage(() => {
  try {
    const probe = "__probe__";
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    const mem = new Map<string, string>();
    return {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    };
  }
});

function isDefault(d: Decision) {
  return d.kind === "keep" && !d.renewal;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      plan: null,
      history: [],
      startPlan: (clubId, budget) => set({ plan: newPlan(clubId, budget), history: [] }),
      setBudget: (budget) => set((s) => (s.plan ? { plan: { ...s.plan, budget } } : s)),
      setDecisions: (changes) =>
        set((s) => {
          if (!s.plan) return s;
          const decisions = { ...s.plan.decisions };
          for (const [id, d] of Object.entries(changes)) {
            if (d === null || isDefault(d)) delete decisions[id];
            else decisions[id] = d;
          }
          return {
            plan: { ...s.plan, decisions },
            history: [...s.history, s.plan].slice(-HISTORY_LIMIT),
          };
        }),
      upsertSigning: (signing) =>
        set((s) =>
          s.plan
            ? {
                plan: {
                  ...s.plan,
                  signings: [...s.plan.signings.filter((x) => x.playerId !== signing.playerId), signing],
                },
                history: [...s.history, s.plan].slice(-HISTORY_LIMIT),
              }
            : s,
        ),
      removeSigning: (playerId) =>
        set((s) =>
          s.plan
            ? {
                plan: { ...s.plan, signings: s.plan.signings.filter((x) => x.playerId !== playerId) },
                history: [...s.history, s.plan].slice(-HISTORY_LIMIT),
              }
            : s,
        ),
      addCustomPlayer: (player) =>
        set((s) =>
          s.plan
            ? {
                plan: { ...s.plan, customPlayers: [...s.plan.customPlayers, player] },
                history: [...s.history, s.plan].slice(-HISTORY_LIMIT),
              }
            : s,
        ),
      removeCustomPlayer: (id) =>
        set((s) =>
          s.plan
            ? {
                plan: { ...s.plan, customPlayers: s.plan.customPlayers.filter((x) => x.id !== id) },
                history: [...s.history, s.plan].slice(-HISTORY_LIMIT),
              }
            : s,
        ),
      setLineup: (lineup) =>
        set((s) =>
          s.plan ? { plan: { ...s.plan, lineup }, history: [...s.history, s.plan].slice(-HISTORY_LIMIT) } : s,
        ),
      saved: [],
      toggleSaved: (playerId) =>
        set((s) => ({
          saved: s.saved.includes(playerId) ? s.saved.filter((x) => x !== playerId) : [...s.saved, playerId],
        })),
      undo: () =>
        set((s) => {
          const previous = s.history.at(-1);
          return previous ? { plan: previous, history: s.history.slice(0, -1) } : s;
        }),
      reset: () => set({ plan: null, history: [] }),
    }),
    {
      name: "reconstrucao:plano",
      version: PLAN_SCHEMA_VERSION,
      storage: safeStorage,
      partialize: (s) => ({ plan: s.plan, saved: s.saved }),
      // Plano de versão desconhecida é descartado em vez de quebrar a tela.
      migrate: () => ({ plan: null, saved: [] }),
    },
  ),
);
