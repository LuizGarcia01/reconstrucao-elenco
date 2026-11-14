import type { SnapshotSource } from "../types";

/**
 * Adaptador do Transfermarkt. Regras:
 * - roda raramente (uma vez por janela) e nunca a partir do navegador do usuário;
 * - espera entre requisições (REQUEST_DELAY_MS) para não sobrecarregar o site;
 * - grava só fatos: nome, posição, nascimento, nacionalidade, clube, contrato, valor.
 *   Nada de fotos, escudos ou textos.
 */
export const REQUEST_DELAY_MS = 3000;

export const transfermarkt: SnapshotSource = {
  id: "transfermarkt",
  async build() {
    // A leitura e a conversão das páginas entram quando a rede desta sessão liberar o domínio.
    throw new Error(
      "Adaptador do Transfermarkt ainda não implementado: falta liberar www.transfermarkt.com.br na rede.",
    );
  },
};
