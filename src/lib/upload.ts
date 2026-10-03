import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 6 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

/** Guarda uma imagem e devolve o URL público. Usa Vercel Blob em produção; pasta local em testes. */
export async function saveImage(file: File, folder: string): Promise<string> {
  const ext = TYPES[file.type];
  if (!ext) throw new Error("Formato não suportado. Use JPG, PNG ou WebP.");
  if (file.size > MAX_BYTES) throw new Error("A foto tem mais de 6 MB. Tente uma mais pequena.");
  const name = `${folder}/${randomUUID()}.${ext}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(name, file, { access: "public", contentType: file.type });
    return blob.url;
  }
  if (process.env.NODE_ENV === "production") throw new Error("Falta configurar o armazenamento de fotos (BLOB_READ_WRITE_TOKEN).");
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(process.cwd(), "public", "uploads", name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
