/**
 * Dados próprios dos clubes da Série A 2026, indexados pelo id do clube no Transfermarkt.
 * Nome curto, sigla e cor principal são nossos (cores de uniforme, não escudos).
 */
export interface ClubMeta {
  id: string;
  name: string;
  shortName: string;
  color: string;
}

export const CLUBS_BR: Record<string, ClubMeta> = {
  "679": { id: "athletico-pr", name: "Athletico Paranaense", shortName: "CAP", color: "#c8102e" },
  "330": { id: "atletico-mg", name: "Atlético Mineiro", shortName: "CAM", color: "#1c1c1c" },
  "537": { id: "botafogo", name: "Botafogo", shortName: "BOT", color: "#2b2b2b" },
  "17776": { id: "chapecoense", name: "Chapecoense", shortName: "CHA", color: "#00843d" },
  "10997": { id: "remo", name: "Remo", shortName: "REM", color: "#0b2a5b" },
  "199": { id: "corinthians", name: "Corinthians", shortName: "COR", color: "#1f1f1f" },
  "776": { id: "coritiba", name: "Coritiba", shortName: "CFC", color: "#00563f" },
  "609": { id: "cruzeiro", name: "Cruzeiro", shortName: "CRU", color: "#0033a0" },
  "10010": { id: "bahia", name: "Bahia", shortName: "BAH", color: "#0055a4" },
  "2125": { id: "vitoria", name: "Vitória", shortName: "VIT", color: "#d71920" },
  "221": { id: "santos", name: "Santos", shortName: "SAN", color: "#333333" },
  "585": { id: "sao-paulo", name: "São Paulo", shortName: "SAO", color: "#e4002b" },
  "614": { id: "flamengo", name: "Flamengo", shortName: "FLA", color: "#c8102e" },
  "2462": { id: "fluminense", name: "Fluminense", shortName: "FLU", color: "#7a1f3d" },
  "210": { id: "gremio", name: "Grêmio", shortName: "GRE", color: "#0d80bf" },
  "3876": { id: "mirassol", name: "Mirassol", shortName: "MIR", color: "#e5b700" },
  "8793": { id: "bragantino", name: "Bragantino", shortName: "RBB", color: "#d6001c" },
  "6600": { id: "internacional", name: "Internacional", shortName: "INT", color: "#e30613" },
  "1023": { id: "palmeiras", name: "Palmeiras", shortName: "PAL", color: "#006437" },
  "978": { id: "vasco", name: "Vasco da Gama", shortName: "VAS", color: "#262626" },
};
