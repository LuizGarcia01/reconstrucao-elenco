/**
 * Nome do país como aparece no Transfermarkt em português -> ISO 3166-1 alfa-2.
 * Países do Reino Unido usam códigos de subdivisão próprios do futebol (ENG, SCO, WAL, NIR)
 * mapeados para GB, porque o jogo só precisa saber "estrangeiro ou não".
 * Nome desconhecido não é adivinhado: o leitor acusa e você completa a lista.
 */
const COUNTRIES: Record<string, string> = {
  "África do Sul": "ZA", Alemanha: "DE", Angola: "AO", Argentina: "AR", Argélia: "DZ",
  Austrália: "AU", Áustria: "AT", Bélgica: "BE", Bolívia: "BO", "Bósnia-Herzegovina": "BA",
  Brasil: "BR", Bulgária: "BG", "Cabo Verde": "CV", Camarões: "CM", Canadá: "CA",
  Chile: "CL", China: "CN", Colômbia: "CO", "Coreia do Sul": "KR", "Costa do Marfim": "CI",
  "Costa Rica": "CR", Croácia: "HR", Cuba: "CU", Dinamarca: "DK", Equador: "EC",
  Egito: "EG", Escócia: "GB", Eslováquia: "SK", Eslovênia: "SI", Espanha: "ES",
  "Estados Unidos": "US", Finlândia: "FI", França: "FR", Gana: "GH", Grécia: "GR",
  Guatemala: "GT", "Guiné": "GN", "Guiné-Bissau": "GW", "Guiné Equatorial": "GQ", Haiti: "HT",
  Holanda: "NL", "Países Baixos": "NL", Honduras: "HN", Hungria: "HU", Inglaterra: "GB",
  Irlanda: "IE", "Irlanda do Norte": "GB", Islândia: "IS", Israel: "IL", Itália: "IT",
  Jamaica: "JM", Japão: "JP", Líbano: "LB", Mali: "ML", Marrocos: "MA",
  México: "MX", Moçambique: "MZ", Nigéria: "NG", Noruega: "NO", "Nova Zelândia": "NZ",
  Panamá: "PA", Paraguai: "PY", Peru: "PE", Polônia: "PL", Portugal: "PT",
  "País de Gales": "GB", Quênia: "KE", "República Tcheca": "CZ", "República Checa": "CZ",
  "República Dominicana": "DO", Romênia: "RO", Rússia: "RU", Senegal: "SN", Sérvia: "RS",
  Suécia: "SE", Suíça: "CH", Suriname: "SR", "Timor-Leste": "TL", Togo: "TG",
  Tunísia: "TN", Turquia: "TR", Ucrânia: "UA", Uruguai: "UY", Venezuela: "VE",
  "São Tomé e Príncipe": "ST", "Trinidad e Tobago": "TT", "El Salvador": "SV", Nicarágua: "NI",
  Montenegro: "ME", Macedônia: "MK", "Macedônia do Norte": "MK", Albânia: "AL", Kosovo: "XK",
  Geórgia: "GE", Armênia: "AM", Azerbaijão: "AZ", Lituânia: "LT", Letônia: "LV",
  Estônia: "EE", "RD do Congo": "CD", "República Democrática do Congo": "CD", Congo: "CG",
  "Burkina Faso": "BF", Benin: "BJ", Gâmbia: "GM", Zâmbia: "ZM", Zimbábue: "ZW", Bielorrússia: "BY", Luxemburgo: "LU", Chipre: "CY", Malta: "MT",
};

export function countryCode(name: string): string | null {
  return COUNTRIES[name.trim()] ?? null;
}
