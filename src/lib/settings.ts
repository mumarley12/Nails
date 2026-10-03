import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

export async function getSettings() {
  const [row] = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.id, 1)).limit(1);
  if (row) return row;
  const [created] = await db.insert(schema.siteSettings).values({ id: 1 }).onConflictDoNothing().returning();
  return created ?? (await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.id, 1)))[0];
}
export type Settings = Awaited<ReturnType<typeof getSettings>>;
