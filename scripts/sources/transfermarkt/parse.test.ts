import { describe, expect, it } from "vitest";

import { parseDate, parseFoot, parseMarketValue, parseSquadPage } from "./parse";

describe("parseMarketValue", () => {
  it("lê os formatos do .com.br em milhares de euros", () => {
    expect(parseMarketValue("€9.00mi")).toBe(9000);
    expect(parseMarketValue("€1.50mi")).toBe(1500);
    expect(parseMarketValue("€75mil")).toBe(75);
    expect(parseMarketValue("-")).toBe(0);
  });
});

describe("parseDate", () => {
  it("converte dd/mm/aaaa, ignorando a idade entre parênteses", () => {
    expect(parseDate("09/10/1998 (28)")).toBe("1998-10-09");
    expect(parseDate("-")).toBeNull();
  });
});

describe("parseFoot", () => {
  it("entende português e inglês", () => {
    expect(parseFoot("esquerdo")).toBe("left");
    expect(parseFoot("ambos")).toBe("both");
    expect(parseFoot("-")).toBeNull();
  });
});

// Trecho sintético no mesmo formato da página, com dados inventados.
const PAGE = `<html><head><title>Elenco</title>
<link rel="canonical" href="https://www.transfermarkt.com.br/clube-teste/kader/verein/999"></head>
<body><table class="items"><thead><tr><th>#</th></tr></thead><tbody>
<tr class="odd">
<td class="zentriert rueckennummer"><div class="rn_nummer">9</div></td>
<td class="posrela"><table class="inline-table"><tr><td rowspan="2"></td>
<td class="hauptlink"><a href="/fulano-teste/profil/spieler/12345"> Fulano Teste </a></td></tr>
<tr><td> Centroavante </td></tr></table></td>
<td class="zentriert">01/02/2001 (25)</td>
<td class="zentriert"><img title="Brasil" class="flaggenrahmen"/><img title="Itália" class="flaggenrahmen"/></td>
<td class="zentriert">1,85m</td>
<td class="zentriert">direito</td>
<td class="zentriert">01/01/2024</td>
<td class="zentriert"></td>
<td class="zentriert">31/12/2028</td>
<td class="rechts hauptlink"><a href="/x/marktwertverlauf/spieler/12345">€3.50mi</a></td>
</tr></tbody></table></body></html>`;

describe("parseSquadPage", () => {
  it("extrai os fatos do jogador", () => {
    const page = parseSquadPage(PAGE);
    expect(page.tmClubId).toBe("999");
    expect(page.players).toEqual([
      {
        tmId: "12345",
        name: "Fulano Teste",
        positionLabel: "Centroavante",
        position: "ST",
        birthDate: "2001-02-01",
        nationalityNames: ["Brasil", "Itália"],
        nationalities: ["BR", "IT"],
        foot: "right",
        contractUntil: "2028-12-31",
        marketValue: 3500,
      },
    ]);
  });

  it("recusa a página de verificação anti-robô", () => {
    expect(() => parseSquadPage("<html><head><title>Human Verification</title></head></html>")).toThrow(
      /anti-robô/,
    );
  });
});
