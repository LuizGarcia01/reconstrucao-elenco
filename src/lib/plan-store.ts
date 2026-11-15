"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { newPlan, PLAN_SCHEMA_VERSION, type Budget, type Plan } from "@engine";

interface PlanState {
  plan: Plan | null;
  /** Começa um plano novo para o clube (substitui o atual). */
  startPlan: (clubId: string, budget: Budget) => void;
  setBudget: (budget: Budget) => void;
  reset: () => void;
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

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      plan: null,
      startPlan: (clubId, budget) => set({ plan: newPlan(clubId, budget) }),
      setBudget: (budget) => set((s) => (s.plan ? { plan: { ...s.plan, budget } } : s)),
      reset: () => set({ plan: null }),
    }),
    {
      name: "reconstrucao:plano",
      version: PLAN_SCHEMA_VERSION,
      storage: safeStorage,
      // Plano de versão desconhecida é descartado em vez de quebrar a tela.
      migrate: () => ({ plan: null }),
    },
  ),
);
