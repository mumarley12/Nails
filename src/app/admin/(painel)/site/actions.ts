"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { asc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { saveImage } from "@/lib/upload";
import { isValidDateKey } from "@/lib/time";

const back = (msg: string, anchor = "", err = false) => redirect(`/admin/site?${err ? "erro" : "ok"}=${encodeURIComponent(msg)}${anchor ? "#" + anchor : ""}`);
const done = () => { revalidateTag("public"); revalidatePath("/"); revalidatePath("/admin/site"); };
const str = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);

export async function saveInfo(fd: FormData) {
  await requireAdmin();
  await getSettings();
  await db.update(schema.siteSettings).set({
    salonName: str(fd, "salonName", 60) || "Luxe Nails by MVN", address: str(fd, "address"), postalCode: str(fd, "postalCode", 12), city: str(fd, "city", 60),
    phone: str(fd, "phone", 20), whatsapp: str(fd, "whatsapp", 20), email: str(fd, "email", 120), instagram: str(fd, "instagram", 60), tiktok: str(fd, "tiktok", 60),
  }).where(eq(schema.siteSettings.id, 1));
  done(); back("Contactos guardados.", "contactos");
}

export async function saveTexts(fd: FormData) {
  await requireAdmin();
  await getSettings();
  await db.update(schema.siteSettings).set({
    heroTitle: str(fd, "heroTitle", 60), heroTitleAccent: str(fd, "heroTitleAccent", 40), heroSubtitle: str(fd, "heroSubtitle", 240),
    promoActive: fd.get("promoActive") === "on", promoTitle: str(fd, "promoTitle", 60),
    promoValue: str(fd, "promoValue", 12), promoText: str(fd, "promoText", 60),
  }).where(eq(schema.siteSettings.id, 1));
  done(); back("Textos guardados.", "textos");
}

const SLOTS = { logo: "logoUrl", hero: "heroPhotoUrl", about: "aboutPhotoUrl", promo: "promoPhotoUrl" } as const;

export async function uploadSlot(fd: FormData) {
  await requireAdmin();
  await getSettings();
  const slot = String(fd.get("slot")) as keyof typeof SLOTS;
  if (!(slot in SLOTS)) return;
  if (fd.get("remove") === "1") {
    await db.update(schema.siteSettings).set({ [SLOTS[slot]]: null }).where(eq(schema.siteSettings.id, 1));
    done(); back("Foto removida.", "fotos");
  }
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) back("Escolha uma foto primeiro.", "fotos", true);
  let url = "";
  try { url = await saveImage(file as File, "site"); } catch (e) { back((e as Error).message, "fotos", true); }
  await db.update(schema.siteSettings).set({ [SLOTS[slot]]: url }).where(eq(schema.siteSettings.id, 1));
  done(); back("Foto atualizada.", "fotos");
}

export async function addGallery(fd: FormData) {
  await requireAdmin();
  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) back("Escolha uma ou mais fotos.", "galeria", true);
  const [{ n, max }] = await db.select({ n: sql<number>`count(*)::int`, max: sql<number>`coalesce(max(${schema.galleryPhotos.sortOrder}), 0)::int` }).from(schema.galleryPhotos);
  const room = Math.max(0, 24 - n);
  let i = 0;
  for (const f of files.slice(0, room)) {
    try {
      const url = await saveImage(f, "galeria");
      await db.insert(schema.galleryPhotos).values({ url, label: str(fd, "label", 30).toUpperCase(), alt: str(fd, "label", 80) || "Trabalho de unhas", sortOrder: max + ++i });
    } catch (e) { back((e as Error).message, "galeria", true); }
  }
  done(); back(`${i} foto(s) adicionada(s).`, "galeria");
}

export async function editGallery(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id")), action = String(fd.get("op"));
  if (action === "delete") {
    await db.delete(schema.galleryPhotos).where(eq(schema.galleryPhotos.id, id));
  } else if (action === "left" || action === "right") {
    const all = await db.select().from(schema.galleryPhotos).orderBy(asc(schema.galleryPhotos.sortOrder), asc(schema.galleryPhotos.createdAt));
    const i = all.findIndex((g) => g.id === id), j = action === "left" ? i - 1 : i + 1;
    if (i >= 0 && j >= 0 && j < all.length) { [all[i], all[j]] = [all[j], all[i]]; }
    await Promise.all(all.map((g, k) => db.update(schema.galleryPhotos).set({ sortOrder: k }).where(eq(schema.galleryPhotos.id, g.id))));
  } else {
    const label = str(fd, "label", 30);
    await db.update(schema.galleryPhotos).set({ label: label.toUpperCase(), alt: label || "Trabalho de unhas" }).where(eq(schema.galleryPhotos.id, id));
  }
  done(); back("Galeria atualizada.", "galeria");
}



export async function review(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || ""), action = String(fd.get("op") || "add");
  if (action === "delete") await db.delete(schema.reviews).where(eq(schema.reviews.id, id));
  else if (action === "toggle") await db.update(schema.reviews).set({ visible: sql`not ${schema.reviews.visible}` }).where(eq(schema.reviews.id, id));
  done(); back("Feedbacks atualizados.", "opinioes");
}
