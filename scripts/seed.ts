/** Dados iniciais (podem ser todos alterados depois no painel). Uso: npm run db:seed */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";

type DB = ReturnType<typeof drizzle<typeof schema>>;

/** Cria os dados iniciais se a base de dados estiver vazia. Devolve true se criou. */
export async function seedIfEmpty(db: DB): Promise<boolean> {
const existing = await db.select().from(schema.services).limit(1);
if (existing.length) return false;

await db.insert(schema.siteSettings).values({ id: 1 }).onConflictDoNothing();
await db.insert(schema.businessHours).values([0, 1, 2, 3, 4, 5, 6].map((w) => ({ weekday: w, open: w !== 6, startMin: 540, endMin: 1140 }))).onConflictDoNothing();
await db.insert(schema.closedDays).values([
  { date: "2026-10-05", label: "Implantação da República" },
  { date: "2026-12-08", label: "Imaculada Conceição" },
  { date: "2026-12-25", label: "Natal" },
]).onConflictDoNothing();

const [sara, marta, ines] = await db.insert(schema.staff).values([
  { name: "Sara Lopes", role: "Proprietária · Técnica sénior", tags: ["Gel", "Nail art", "Extensões"], workDays: [1, 2, 3, 4, 5], startMin: 540, endMin: 1080, sortOrder: 1 },
  { name: "Marta Costa", role: "Técnica", tags: ["Pedicure", "Cromados", "Gel"], workDays: [0, 2, 3, 4, 5], startMin: 540, endMin: 1020, sortOrder: 2 },
  { name: "Inês Tavares", role: "Técnica", tags: ["Acrílico", "Extensões", "Nail art"], workDays: [0, 1, 3, 4, 5], startMin: 570, endMin: 1140, sortOrder: 3 },
]).returning();

const svc = await db.insert(schema.services).values([
  { name: "Manicure Clássica", description: "Forma, cutículas e verniz normal", category: "Manicure", priceCents: 1500, durationMin: 45, sortOrder: 1 },
  { name: "Manicure com Gel", description: "Verniz gel, dura 2–3 semanas", category: "Manicure", priceCents: 2500, durationMin: 60, sortOrder: 2 },
  { name: "Pedicure Spa", description: "Banho, esfoliação, massagem e verniz", category: "Pedicure", priceCents: 2500, durationMin: 60, sortOrder: 3 },
  { name: "Pedicure com Gel", description: "Pedicure spa com acabamento em gel", category: "Pedicure", priceCents: 3200, durationMin: 75, sortOrder: 4 },
  { name: "Extensões de Gel", description: "Tips de gel, qualquer formato", category: "Extensões", priceCents: 4500, durationMin: 90, sortOrder: 5 },
  { name: "Unhas de Acrílico", description: "Comprimento e resistência duradouros", category: "Extensões", priceCents: 4000, durationMin: 90, sortOrder: 6 },
  { name: "Nail Art", description: "Detalhes, linhas ou flores", category: "Extra", priceCents: 500, durationMin: 20, isAddOn: true, sortOrder: 7 },
]).returning();
const who: Record<string, string[]> = {
  "Manicure Clássica": [sara.id, marta.id], "Manicure com Gel": [sara.id, marta.id, ines.id], "Pedicure Spa": [marta.id, ines.id],
  "Pedicure com Gel": [marta.id], "Extensões de Gel": [sara.id, ines.id], "Unhas de Acrílico": [ines.id], "Nail Art": [sara.id, ines.id],
};
await db.insert(schema.serviceStaff).values(svc.flatMap((s) => (who[s.name] ?? []).map((staffId) => ({ serviceId: s.id, staffId }))));

await db.insert(schema.reviews).values([
  { name: "Joana M.", city: "Lisboa", text: "O salão mais limpo onde já estive, e o meu gel durou quase quatro semanas.", date: new Date("2026-08-14") },
  { name: "Sofia T.", city: "Cascais", text: "Marquei pelo telemóvel na hora de almoço. Super prático.", date: new Date("2026-08-29") },
  { name: "Beatriz R.", city: "Porto", text: "Unhas cromadas lindíssimas para o casamento da minha irmã. Calmas, sem pressas, e ouvem mesmo.", date: new Date("2026-09-06") },
]);

return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const client = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL!, { max: 1, prepare: false });
  const created = await seedIfEmpty(drizzle(client, { schema }));
  console.log(created ? "✓ Dados iniciais criados." : "A base de dados já tem serviços — nada a fazer.");
  await client.end();
}
