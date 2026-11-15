"use client";

import { useSyncExternalStore } from "react";

/** true só no navegador, depois da hidratação: evita divergência com o HTML do servidor. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
