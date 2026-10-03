/** Dados iniciais (podem ser todos alterados depois no painel). Uso: npm run db:seed */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { eq } from "drizzle-orm";

type DB = ReturnType<typeof drizzle<typeof schema>>;

/** Cria os dados iniciais se a base de dados estiver vazia. Devolve true se criou. */
export async function seedIfEmpty(db: DB): Promise<boolean> {
const existing = await db.select().from(schema.services).limit(1);
if (existing.length) return false;

await db.insert(schema.siteSettings).values({ id: 1 }).onConflictDoNothing();
await db.insert(schema.businessHours).values([0, 1, 2, 3, 4, 5, 6].map((w) => ({ weekday: w, open: w === 5, startMin: 540, endMin: 1140 }))).onConflictDoNothing();

// A migração 0006 já cria a ficha da Matilde; só se cria aqui se faltar.
const [existingOwner] = await db.select().from(schema.staff).limit(1);
const matilde = existingOwner ?? (await db.insert(schema.staff).values({ name: "Matilde", role: "Nail designer", workDays: [0, 1, 2, 3, 4, 5, 6], startMin: 0, endMin: 1440, sortOrder: 1 }).returning())[0];
await db.update(schema.staff).set({ name: "Matilde", role: "Nail designer", tags: ["Gel", "Francesinha", "Nail art", "Pés"] }).where(eq(schema.staff.id, matilde.id));

// Preços a 0 aparecem como "sob consulta" até a Matilde os pôr no painel.
const svc = await db.insert(schema.services).values([
  { name: "Gelinho", description: "Verniz gel na unha natural", category: "Mãos", priceCents: 0, durationMin: 60, sortOrder: 1 },
  { name: "Extensão em gel", description: "Comprimento e formato à escolha", category: "Mãos", priceCents: 0, durationMin: 120, sortOrder: 2 },
  { name: "Manutenção", description: "3 a 4 semanas depois da extensão", category: "Mãos", priceCents: 0, durationMin: 90, sortOrder: 3 },
  { name: "Pés em gel", description: "Cutículas e verniz gel", category: "Pés", priceCents: 0, durationMin: 60, sortOrder: 4 },
  { name: "Nail art", description: "Francesinha, flores 3D, dourados, desenhos", category: "Extra", priceCents: 0, durationMin: 20, isAddOn: true, sortOrder: 5 },
]).returning();
await db.insert(schema.serviceStaff).values(svc.map((s) => ({ serviceId: s.id, staffId: matilde.id })));

// Galeria inicial com fotos do Instagram (@luxenailsbymvn). Opiniões: só reais, postas no painel.
await db.insert(schema.galleryPhotos).values(
  ["01", "09", "04", "05", "12", "02", "11", "06", "10", "03", "08", "07"].map((n, i) => ({ url: `/fotos/luxe-${n}.jpg`, label: "", alt: "Unhas feitas pela Matilde", sortOrder: i + 1 })),
);
await db.update(schema.siteSettings).set({
  salonName: "Luxe Nails by MVN", address: "", postalCode: "", city: "Agualva-Cacém", phone: "937 142 531", whatsapp: "937 142 531",
  email: "", instagram: "@luxenailsbymvn", tiktok: "@luxenailsbymvn", heroTitle: "Detalhe", heroTitleAccent: "é tudo.",
  heroSubtitle: "Francesinha, leitosos, dourados e flores 3D — feitos por mim, um par de mãos de cada vez.", aboutText: "",
  promoActive: false, heroPhotoUrl: "/fotos/luxe-05.jpg", aboutPhotoUrl: "/fotos/luxe-07.jpg",
});

return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const client = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL!, { max: 1, prepare: false });
  const created = await seedIfEmpty(drizzle(client, { schema }));
  console.log(created ? "✓ Dados iniciais criados." : "A base de dados já tem serviços — nada a fazer.");
  await client.end();
}
