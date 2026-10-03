/** Cria (ou atualiza a password de) um acesso ao painel.
 *  Uso: npm run admin:create -- email@exemplo.pt "Nome" "password-com-10+-caracteres" */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import * as schema from "../src/db/schema";

const [email, name, password] = process.argv.slice(2);
if (!email || !name || !password || password.length < 10) {
  console.error('Uso: npm run admin:create -- email@exemplo.pt "Nome" "password-com-10+-caracteres"');
  process.exit(1);
}
const client = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL!, { max: 1, prepare: false });
const db = drizzle(client, { schema });
const passwordHash = await bcrypt.hash(password, 12);
await db.insert(schema.adminUsers).values({ email: email.toLowerCase(), name, passwordHash })
  .onConflictDoUpdate({ target: schema.adminUsers.email, set: { name, passwordHash } });
console.log(`✓ Acesso criado para ${email}`);
await client.end();
