import { ImageResponse } from "next/og";

import { planCardFromPacked } from "@/lib/plan-card.server";

/** Card do plano em PNG (1200x630): usado na prévia do link e no botão de salvar imagem. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const data = await planCardFromPacked(url.searchParams.get("d") ?? undefined, url.searchParams.get("r") === "1");
  if (!data) return new Response("plano inválido", { status: 400 });
  const { card } = data;
  const more = (n: number) => (n > 0 ? ` +${n}` : "");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0f1a14", color: "#f3f7f4", fontFamily: "sans-serif" }}>
        {/* Campo */}
        <div style={{ width: 560, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-around", padding: "28px 16px", background: "#1f6b3a" }}>
          {card.lines.map((line, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-around" }}>
              {line.map((p, j) => (
                <div key={j} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 120 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 26, background: "#ffffff", color: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700 }}>
                    {p.overall || "–"}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 20, background: "rgba(0,0,0,0.45)", padding: "1px 8px", borderRadius: 6 }}>{p.name}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
        {/* Lado direito */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "40px 44px", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 72, height: 72, borderRadius: 36, background: card.club.color, border: "3px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#fff" }}>
              {card.club.shortName}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 44, fontWeight: 700 }}>{card.club.name}</div>
              <div style={{ fontSize: 22, color: "#9fb8a8" }}>{`Janela 2027 · ${card.formation} · caixa ${card.cash}`}</div>
            </div>
          </div>
          {card.result ? (
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#111", background: "#e8c35a", padding: "8px 18px", borderRadius: 12, alignSelf: "flex-start" }}>
              {`Simulação: ${card.result.position}º lugar · ${card.result.points} pts`}
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 28, flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 6 }}>
              <div style={{ fontSize: 22, color: "#7fd39b", fontWeight: 700 }}>{`CHEGAM${more(card.arrivals.length - 6)}`}</div>
              {card.arrivals.slice(0, 6).map((a, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 22 }}>
                  <span style={{ flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{a.name}</span>
                  <span style={{ color: "#9fb8a8", flexShrink: 0 }}>{a.fee}</span>
                </div>
              ))}
              {card.arrivals.length === 0 ? <div style={{ fontSize: 22, color: "#9fb8a8" }}>ninguém</div> : null}
            </div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 6 }}>
              <div style={{ fontSize: 22, color: "#f08a8a", fontWeight: 700 }}>{`SAEM${more(card.departures.length - 6)}`}</div>
              {card.departures.slice(0, 6).map((d, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 22 }}>
                  <span style={{ flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{d.name}</span>
                  <span style={{ color: "#9fb8a8", flexShrink: 0 }}>{d.detail}</span>
                </div>
              ))}
              {card.departures.length === 0 ? <div style={{ fontSize: 22, color: "#9fb8a8" }}>ninguém</div> : null}
            </div>
          </div>
          <div style={{ fontSize: 20, color: "#9fb8a8" }}>Reconstrução de Elenco</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
  );
}
