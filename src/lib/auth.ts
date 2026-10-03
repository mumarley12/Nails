import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { SESSION_COOKIE, verifySession } from "./session";

export async function currentAdmin() {
  const store = await cookies();
  const id = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!id) return null;
  const [admin] = await db.select({ id: schema.adminUsers.id, name: schema.adminUsers.name, email: schema.adminUsers.email })
    .from(schema.adminUsers).where(eq(schema.adminUsers.id, id)).limit(1);
  return admin ?? null;
}

/** Usar no início de cada página e ação do painel. */
export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
