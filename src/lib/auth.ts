import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { SESSION_COOKIE, verifySession } from "./session";

/** Uma só consulta por pedido, mesmo que o layout e a página a peçam. */
export const currentAdmin = cache(async function currentAdmin() {
  const store = await cookies();
  const id = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!id) return null;
  const [admin] = await db.select({ id: schema.adminUsers.id, name: schema.adminUsers.name, email: schema.adminUsers.email, mustChangePassword: schema.adminUsers.mustChangePassword })
    .from(schema.adminUsers).where(eq(schema.adminUsers.id, id)).limit(1);
  return admin ?? null;
});

/** Usar no início de cada página e ação do painel. Com password inicial, obriga a escolher uma nova primeiro. */
export async function requireAdmin(opts: { allowPasswordChange?: boolean } = {}) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.mustChangePassword && !opts.allowPasswordChange) redirect("/admin/conta?primeira=1");
  return admin;
}
