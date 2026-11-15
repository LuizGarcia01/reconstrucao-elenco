import { decodePlan, encodePlan, type Plan } from "@engine";

/**
 * Plano -> texto curto para a URL: JSON compacto, comprimido (deflate-raw) e em base64url.
 * Usa só APIs padrão da web (CompressionStream), que existem no navegador e no Node 18+.
 */
export async function packPlan(plan: Plan): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(encodePlan(plan)));
  const compressed = await new Response(
    new Blob([json]).stream().pipeThrough(new CompressionStream("deflate-raw")),
  ).arrayBuffer();
  return toBase64Url(new Uint8Array(compressed));
}

export async function unpackPlan(packed: string): Promise<Plan> {
  const bytes = fromBase64Url(packed);
  const text = await new Response(
    new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw")),
  ).text();
  return decodePlan(JSON.parse(text));
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function planLink(origin: string, packed: string): string {
  return `${origin}/p?d=${packed}`;
}
