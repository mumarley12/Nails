"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { parseEuroToCents } from "@/lib/money";
import { saveImage } from "@/lib/upload";
import { getOwnerId } from "@/lib/owner";

const back = (msg: string, err = false) => redirect(`/admin/servicos?${err ? "erro" : "ok"}=${encodeURIComponent(msg)}`);
const done = () => { revalidateTag("public"); revalidatePath("/admin/servicos"); revalidatePath("/"); };

export async function saveService(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  const name = String(fd.get("name") ?? "").trim().slice(0, 80);
  const priceCents = parseEuroToCents(String(fd.get("price") ?? ""));
  const durationMin = Number(fd.get("duration"));
  if (!name) back("Escreva o nome do serviço.", true);
  if (priceCents === null) back("Preço inválido.", true);
  if (!Number.isInteger(durationMin) || durationMin < 5 || durationMin > 480) back("Duração inválida (entre 5 e 480 minutos).", true);
  const values = {
    name, description: String(fd.get("description") ?? "").trim().slice(0, 140), category: String(fd.get("category") ?? "Manicure").slice(0, 40),
    priceCents: priceCents!, durationMin, isAddOn: fd.get("isAddOn") === "on", active: fd.get("active") === "on", sortOrder: Number(fd.get("sortOrder") || 0),
  };
  const photo = fd.get("photo");
  let photoUrl: string | undefined;
  if (photo instanceof File && photo.size > 0) {
    try { photoUrl = await saveImage(photo, "servicos"); } catch (e) { back((e as Error).message, true); }
  }
  let serviceId = id;
  if (id) await db.update(schema.services).set({ ...values, ...(photoUrl ? { photoUrl } : {}) }).where(eq(schema.services.id, id));
  else serviceId = (await db.insert(schema.services).values({ ...values, photoUrl: photoUrl ?? null }).returning({ id: schema.services.id }))[0].id;
  await db.insert(schema.serviceStaff).values({ serviceId, staffId: await getOwnerId() }).onConflictDoNothing();
  done();
  back(id ? "Serviço guardado." : "Serviço criado.");
}

export async function deleteService(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.appointments).where(sql`${schema.appointments.serviceId} = ${id} or ${schema.appointments.addOnId} = ${id}`);
  if (n > 0) { await db.update(schema.services).set({ active: false }).where(eq(schema.services.id, id)); done(); back("O serviço tem marcações no histórico — foi escondido do site em vez de apagado."); }
  await db.delete(schema.services).where(eq(schema.services.id, id));
  done();
  back("Serviço apagado.");
}
