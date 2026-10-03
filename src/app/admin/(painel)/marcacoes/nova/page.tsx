import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { PageHead } from "@/components/admin/ui";
import { NewBookingForm } from "@/components/admin/NewBookingForm";
import { dateKey, isValidDateKey } from "@/lib/time";

export const metadata = { title: "Nova marcação" };

export default async function Page({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  await requireAdmin();
  const { dia } = await searchParams;
  const [services, staff, links] = await Promise.all([
    db.select().from(schema.services).where(eq(schema.services.active, true)).orderBy(asc(schema.services.sortOrder)),
    db.select().from(schema.staff).where(eq(schema.staff.active, true)).orderBy(asc(schema.staff.sortOrder)),
    db.select().from(schema.serviceStaff),
  ]);
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <PageHead title="Nova marcação" sub="Para marcações por telefone, WhatsApp ou ao balcão." />
      <NewBookingForm initialDay={dia && isValidDateKey(dia) ? dia : dateKey(new Date())}
        services={services.map((s) => ({ id: s.id, name: s.name, isAddOn: s.isAddOn, durationMin: s.durationMin, priceCents: s.priceCents }))}
        staff={staff.map((p) => ({ id: p.id, name: p.name, serviceIds: links.filter((l) => l.staffId === p.id).map((l) => l.serviceId) }))} />
    </div>
  );
}
