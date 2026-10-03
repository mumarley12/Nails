import "server-only";
import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, schema } from "@/db";
import { getSettings } from "./settings";
import { addDays, dateKey } from "./time";

export async function getPublicData() {
  const since = addDays(dateKey(new Date()), -7);
  const [settings, services, staff, gallery, reviews, hours, vagas, taken] = await Promise.all([
    getSettings(),
    db.select().from(schema.services).where(eq(schema.services.active, true)).orderBy(asc(schema.services.sortOrder), asc(schema.services.name)),
    db.select().from(schema.staff).where(eq(schema.staff.active, true)).orderBy(asc(schema.staff.sortOrder)),
    db.select().from(schema.galleryPhotos).orderBy(asc(schema.galleryPhotos.sortOrder), asc(schema.galleryPhotos.createdAt)),
    db.select().from(schema.reviews).where(and(eq(schema.reviews.visible, true))).orderBy(desc(schema.reviews.date), desc(schema.reviews.createdAt)).limit(12),
    db.select().from(schema.businessHours).orderBy(asc(schema.businessHours.weekday)),
    db.select({ date: schema.vagas.date, startMin: schema.vagas.startMin }).from(schema.vagas).where(gte(schema.vagas.date, since)).orderBy(asc(schema.vagas.date), asc(schema.vagas.startMin)),
    db.select({ startAt: schema.appointments.startAt, endAt: schema.appointments.endAt }).from(schema.appointments)
      .where(and(gte(schema.appointments.endAt, new Date()), inArray(schema.appointments.status, ["PENDING", "CONFIRMED"]))),
  ]);
  return { settings, services, staff, gallery, reviews, hours, vagas, taken };
}
/** Igual a getPublicData, mas guardado em cache 5 min (o painel limpa a cache ao gravar). Datas voltam como texto. */
export const getPublicDataCached = unstable_cache(getPublicData, ["public-data-v5"], { tags: ["public"], revalidate: 300 });
export type PublicData = Awaited<ReturnType<typeof getPublicData>>;
