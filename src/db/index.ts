import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Falta a variável DATABASE_URL (ver .env.example).");

// prepare:false é necessário com poolers do tipo PgBouncer (Supabase/Neon).
const client = globalForDb.pgClient ?? postgres(url, { prepare: false, max: 3, idle_timeout: 20, connect_timeout: 10, max_lifetime: 60 * 10 });
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
export type DB = typeof db;
export { schema };
