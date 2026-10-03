import { IMAGE_TYPES, PHOTO_STORE } from "@/lib/upload";

/** Serve as fotos guardadas no Netlify Blobs. Os nomes são aleatórios e nunca mudam, por isso ficam em cache. */
export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key } = await ctx.params;
  const k = key.join("/");
  if (!/^[a-z]+\/[0-9a-f-]{36}\.(jpg|png|webp|avif)$/.test(k)) return new Response("Não encontrado", { status: 404 });
  const { getStore } = await import("@netlify/blobs");
  const blob = await getStore(PHOTO_STORE).getWithMetadata(k, { type: "arrayBuffer" });
  if (!blob) return new Response("Não encontrado", { status: 404 });
  const ext = k.split(".").pop()!;
  const type = (blob.metadata?.type as string) || Object.keys(IMAGE_TYPES).find((t) => IMAGE_TYPES[t] === ext) || "application/octet-stream";
  return new Response(blob.data as ArrayBuffer, { headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
}
