import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 6 * 1024 * 1024;
export const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
export const PHOTO_STORE = "fotos";

/** Na Netlify as fotos ficam no Netlify Blobs (grátis, sem configuração). Fora da Netlify, numa pasta local (testes). */
export const onNetlify = () => !!(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT || process.env.SITE_ID);

/** Guarda uma imagem e devolve o URL público (/api/fotos/… na Netlify). */
export async function saveImage(file: File, folder: string): Promise<string> {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Formato não suportado. Use JPG, PNG ou WebP.");
  if (file.size > MAX_BYTES) throw new Error("A foto tem mais de 6 MB. Tente uma mais pequena.");
  const key = `${folder}/${randomUUID()}.${ext}`;
  if (onNetlify()) {
    const { getStore } = await import("@netlify/blobs");
    await getStore(PHOTO_STORE).set(key, await file.arrayBuffer(), { metadata: { type: file.type } });
    return `/api/fotos/${key}`;
  }
  if (process.env.NODE_ENV === "production") throw new Error("Armazenamento de fotos indisponível fora da Netlify.");
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(process.cwd(), "public", "uploads", key), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${key}`;
}
