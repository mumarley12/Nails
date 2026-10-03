import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSettings } from "./settings";

export async function getPublicData() {
  const [settings, services, staff, gallery, reviews, hours] = await Promise.all([
    getSettings(),
    db.select().from(schema.services).where(eq(schema.services.active, true)).orderBy(asc(schema.services.sortOrder), asc(schema.services.name)),
    db.select().from(schema.staff).where(eq(schema.staff.active, true)).orderBy(asc(schema.staff.sortOrder)),
    db.select().from(schema.galleryPhotos).orderBy(asc(schema.galleryPhotos.sortOrder), asc(schema.galleryPhotos.createdAt)),
    db.select().from(schema.reviews).where(and(eq(schema.reviews.visible, true))).orderBy(desc(schema.reviews.date)).limit(12),
    db.select().from(schema.businessHours).orderBy(asc(schema.businessHours.weekday)),
  ]);
  return { settings, services, staff, gallery, reviews, hours };
}
export type PublicData = Awaited<ReturnType<typeof getPublicData>>;
