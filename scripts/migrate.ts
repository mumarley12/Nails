/**
 * Prepara a base de dados: aplica as migrações, cria os dados iniciais (se estiver vazia)
 * e o primeiro acesso ao painel a partir de ADMIN_EMAIL / ADMIN_PASSWORD (se ainda não houver nenhum).
 * Corre automaticamente em cada publicação na Vercel (script "vercel-build").
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import * as schema from "../src/db/schema";
import { seedIfEmpty } from "./seed";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL/DIRECT_URL");
const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
const db = drizzle(client, { schema });

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("✓ Base de dados atualizada");
if (await seedIfEmpty(db)) console.log("✓ Dados iniciais criados (serviços, equipa, horário)");

const admins = await db.select({ id: schema.adminUsers.id }).from(schema.adminUsers).limit(1);
const email = process.env.ADMIN_EMAIL, password = process.env.ADMIN_PASSWORD;
if (!admins.length) {
  if (email && password && password.length >= 10) {
    await db.insert(schema.adminUsers).values({ email: email.toLowerCase(), name: process.env.ADMIN_NAME || "Proprietária", passwordHash: await bcrypt.hash(password, 12) });
    console.log(`✓ Acesso ao painel criado para ${email}`);
  } else {
    console.warn("! Ainda não há acesso ao painel: defina ADMIN_EMAIL e ADMIN_PASSWORD (10+ caracteres) e publique de novo.");
  }
}
await client.end();
