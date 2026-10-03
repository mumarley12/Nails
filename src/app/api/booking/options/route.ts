import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSettings } from "@/lib/settings";
import { waNumber } from "@/lib/phone";

export const dynamic = "force-dynamic";

/** Serviços, extras e técnicas para o assistente de marcação. Preços só para mostrar — o servidor recalcula sempre. */
export async function GET() {
  const [services, staff, links, s] = await Promise.all([
    db.select().from(schema.services).where(eq(schema.services.active, true)).orderBy(asc(schema.services.sortOrder)),
    db.select().from(schema.staff).where(eq(schema.staff.active, true)).orderBy(asc(schema.staff.sortOrder)),
    db.select().from(schema.serviceStaff),
    getSettings(),
  ]);
  return NextResponse.json({
    services: services.filter((x) => !x.isAddOn).map((x) => ({ id: x.id, name: x.name, description: x.description, category: x.category, priceCents: x.priceCents, durationMin: x.durationMin })),
    addOns: services.filter((x) => x.isAddOn).map((x) => ({ id: x.id, name: x.name, description: x.description, priceCents: x.priceCents, durationMin: x.durationMin })),
    staff: staff.map((p) => ({ id: p.id, name: p.name, role: p.role, photoUrl: p.photoUrl, tags: p.tags, serviceIds: links.filter((l) => l.staffId === p.id).map((l) => l.serviceId) })),
    salon: { name: s.salonName, address: `${s.address}, ${s.postalCode} ${s.city}`, whatsapp: s.whatsappButton ? waNumber(s.whatsapp) : null },
  });
}
