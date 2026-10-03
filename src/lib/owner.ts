import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * O salão tem uma só pessoa (a Matilde). Internamente a agenda continua ligada a um registo
 * na tabela staff, mas o painel e o site não mostram "técnicas". Devolve esse registo (cria-o se faltar).
 */
export async function getOwnerId(): Promise<string> {
  const [p] = await db.select({ id: schema.staff.id }).from(schema.staff).where(eq(schema.staff.active, true)).orderBy(asc(schema.staff.sortOrder)).limit(1);
  if (p) return p.id;
  const [n] = await db.insert(schema.staff).values({ name: "Matilde", role: "Nail designer", workDays: [0, 1, 2, 3, 4, 5, 6], startMin: 0, endMin: 1440 }).returning({ id: schema.staff.id });
  return n.id;
}
