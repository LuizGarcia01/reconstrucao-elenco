import type { Snapshot } from "../../engine/catalog";

/**
 * Uma fonte de dados converte o que lê para o nosso formato.
 * Trocar de fonte (Transfermarkt, zerozero, API licenciada) é trocar o adaptador.
 */
export interface SnapshotSource {
  id: string;
  build(options: { season: string }): Promise<Snapshot>;
}
