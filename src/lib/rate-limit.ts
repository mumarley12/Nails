import "server-only";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";

/** Devolve true se ainda pode continuar. Janela fixa simples guardada na base de dados. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const rows = await db.insert(schema.rateLimits).values({ key, count: 1, windowStart: new Date() })
    .onConflictDoUpdate({
      target: schema.rateLimits.key,
      set: {
        count: sql`CASE WHEN ${schema.rateLimits.windowStart} < now() - make_interval(secs => ${windowSec}) THEN 1 ELSE ${schema.rateLimits.count} + 1 END`,
        windowStart: sql`CASE WHEN ${schema.rateLimits.windowStart} < now() - make_interval(secs => ${windowSec}) THEN now() ELSE ${schema.rateLimits.windowStart} END`,
      },
    }).returning({ count: schema.rateLimits.count });
  return (rows[0]?.count ?? 0) <= limit;
}
