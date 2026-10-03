import "server-only";
import { and, asc, eq, gte, inArray, lt, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { computeSlots, type Slot, type StaffAvail } from "./availability";
import { addDays, zonedToUtc } from "./time";
import { newToken, hashToken } from "./token";
import { notifyAppointment } from "./notify";

export class BookingError extends Error {
  constructor(public code: "SLOT_TAKEN" | "INVALID" | "NOT_FOUND" | "TOO_LATE", message: string) { super(message); }
}

const ACTIVE = ["PENDING", "CONFIRMED"] as const;

/** Serviço principal + extra opcional, com preço e duração lidos SEMPRE da base de dados. */
export async function resolveService(serviceId: string, addOnId?: string | null) {
  const [svc] = await db.select().from(schema.services).where(and(eq(schema.services.id, serviceId), eq(schema.services.active, true), eq(schema.services.isAddOn, false))).limit(1);
  if (!svc) throw new BookingError("INVALID", "Serviço indisponível.");
  let addOn: typeof svc | null = null;
  if (addOnId) {
    [addOn] = await db.select().from(schema.services).where(and(eq(schema.services.id, addOnId), eq(schema.services.active, true), eq(schema.services.isAddOn, true))).limit(1);
    if (!addOn) throw new BookingError("INVALID", "Extra indisponível.");
  }
  return { svc, addOn, durationMin: svc.durationMin + (addOn?.durationMin ?? 0), priceCents: svc.priceCents + (addOn?.priceCents ?? 0) };
}

async function staffForAvailability(): Promise<StaffAvail[]> {
  const rows = await db.select().from(schema.staff).orderBy(asc(schema.staff.sortOrder));
  const links = await db.select().from(schema.serviceStaff);
  return rows.map((s) => ({ id: s.id, workDays: s.workDays, startMin: s.startMin, endMin: s.endMin, active: s.active, serviceIds: links.filter((l) => l.staffId === s.id).map((l) => l.serviceId) }));
}

/** Busca tudo o que ocupa tempo num intervalo de dias. */
async function busyBetween(fromDay: string, toDayExclusive: string, excludeAppointmentId?: string) {
  const from = zonedToUtc(fromDay, 0), to = zonedToUtc(toDayExclusive, 0);
  const appts = await db.select({ staffId: schema.appointments.staffId, start: schema.appointments.startAt, end: schema.appointments.endAt })
    .from(schema.appointments)
    .where(and(inArray(schema.appointments.status, [...ACTIVE]), lt(schema.appointments.startAt, to), gte(schema.appointments.endAt, from),
      excludeAppointmentId ? ne(schema.appointments.id, excludeAppointmentId) : undefined));
  const blocks = await db.select({ staffId: schema.blockedTimes.staffId, start: schema.blockedTimes.startAt, end: schema.blockedTimes.endAt })
    .from(schema.blockedTimes).where(and(lt(schema.blockedTimes.startAt, to), gte(schema.blockedTimes.endAt, from)));
  return [...appts, ...blocks];
}

export async function availabilityContext() {
  const [staff, hours, closed] = await Promise.all([
    staffForAvailability(),
    db.select().from(schema.businessHours),
    db.select({ date: schema.closedDays.date }).from(schema.closedDays),
  ]);
  return { staff, hours, closedDays: closed.map((c) => c.date) };
}

export async function getSlots(p: { day: string; serviceId: string; addOnId?: string | null; staffId: string | "any"; excludeAppointmentId?: string; leadMin?: number }): Promise<Slot[]> {
  const { durationMin } = await resolveService(p.serviceId, p.addOnId);
  const ctx = await availabilityContext();
  const busy = await busyBetween(p.day, addDays(p.day, 1), p.excludeAppointmentId);
  return computeSlots({ ...ctx, day: p.day, serviceId: p.serviceId, durationMin, staffId: p.staffId, busy, now: new Date(), leadMin: p.leadMin });
}

/** Número de horas livres por dia, para o calendário da marcação. */
export async function getDaySummary(p: { fromDay: string; days: number; serviceId: string; addOnId?: string | null; staffId: string | "any"; excludeAppointmentId?: string }) {
  const { durationMin } = await resolveService(p.serviceId, p.addOnId);
  const ctx = await availabilityContext();
  const busy = await busyBetween(p.fromDay, addDays(p.fromDay, p.days), p.excludeAppointmentId);
  const now = new Date();
  return Array.from({ length: p.days }, (_, i) => {
    const day = addDays(p.fromDay, i);
    const closed = ctx.closedDays.includes(day);
    const free = closed ? 0 : computeSlots({ ...ctx, day, serviceId: p.serviceId, durationMin, staffId: p.staffId, busy, now }).length;
    return { day, free, closed };
  });
}

function isOverlapError(e: unknown) {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === "23P01" || err?.cause?.code === "23P01";
}

/** Escolhe a técnica com menos marcações nesse dia (distribui o trabalho). */
async function pickStaff(ids: string[], day: string) {
  if (ids.length === 1) return ids[0];
  const from = zonedToUtc(day, 0), to = zonedToUtc(addDays(day, 1), 0);
  const counts = await db.select({ staffId: schema.appointments.staffId, n: sql<number>`count(*)::int` }).from(schema.appointments)
    .where(and(inArray(schema.appointments.staffId, ids), inArray(schema.appointments.status, [...ACTIVE]), gte(schema.appointments.startAt, from), lt(schema.appointments.startAt, to)))
    .groupBy(schema.appointments.staffId);
  return [...ids].sort((a, b) => (counts.find((c) => c.staffId === a)?.n ?? 0) - (counts.find((c) => c.staffId === b)?.n ?? 0))[0];
}

export type NewBooking = {
  serviceId: string; addOnId?: string | null; staffId: string | "any"; day: string; startMin: number;
  name: string; phone: string; email?: string | null; notes?: string | null; consent: boolean; source?: "ONLINE" | "ADMIN";
  status?: "PENDING" | "CONFIRMED";
};

export async function createBooking(b: NewBooking): Promise<{ id: string; token: string }> {
  const { svc, addOn, durationMin, priceCents } = await resolveService(b.serviceId, b.addOnId);
  const slots = await getSlots({ day: b.day, serviceId: svc.id, addOnId: addOn?.id, staffId: b.staffId, leadMin: b.source === "ADMIN" ? 0 : undefined });
  const slot = slots.find((s) => s.startMin === b.startMin);
  if (!slot) throw new BookingError("SLOT_TAKEN", "Essa hora acabou de ser ocupada. Escolha outra, por favor.");
  const staffId = await pickStaff(slot.staffIds, b.day);
  const startAt = zonedToUtc(b.day, b.startMin);
  const endAt = new Date(startAt.getTime() + durationMin * 60_000);
  const { token, hash } = newToken();

  try {
    const id = await db.transaction(async (tx) => {
      const [cust] = await tx.insert(schema.customers)
        .values({ name: b.name, phone: b.phone, email: b.email || null, consentAt: b.consent ? new Date() : null })
        .onConflictDoUpdate({ target: schema.customers.phone, set: { name: b.name, ...(b.email ? { email: b.email } : {}), ...(b.consent ? { consentAt: new Date() } : {}) } })
        .returning({ id: schema.customers.id });
      const [appt] = await tx.insert(schema.appointments).values({
        customerId: cust.id, staffId, serviceId: svc.id, addOnId: addOn?.id ?? null, startAt, endAt, priceCents,
        status: b.status ?? "CONFIRMED", source: b.source ?? "ONLINE", notes: b.notes || null, manageTokenHash: hash,
      }).returning({ id: schema.appointments.id });
      return appt.id;
    });
    await notifyAppointment(id, "BOOKED", { token, byClient: (b.source ?? "ONLINE") === "ONLINE" });
    return { id, token };
  } catch (e) {
    if (isOverlapError(e)) throw new BookingError("SLOT_TAKEN", "Essa hora acabou de ser ocupada. Escolha outra, por favor.");
    throw e;
  }
}

export async function findByToken(token: string) {
  if (!token || token.length > 64) return null;
  return db.query.appointments.findFirst({
    where: eq(schema.appointments.manageTokenHash, hashToken(token)),
    with: { customer: true, staff: true, service: true, addOn: true },
  });
}

export async function rescheduleAppointment(p: { id: string; day: string; startMin: number; staffId?: string | "any"; byClient: boolean; token?: string | null }) {
  const a = await db.query.appointments.findFirst({ where: eq(schema.appointments.id, p.id) });
  if (!a) throw new BookingError("NOT_FOUND", "Marcação não encontrada.");
  if (!ACTIVE.includes(a.status as (typeof ACTIVE)[number])) throw new BookingError("INVALID", "Esta marcação já não está ativa.");
  if (p.byClient && a.startAt <= new Date()) throw new BookingError("TOO_LATE", "Esta marcação já passou.");
  const { durationMin } = await resolveService(a.serviceId, a.addOnId);
  const slots = await getSlots({ day: p.day, serviceId: a.serviceId, addOnId: a.addOnId, staffId: p.staffId ?? a.staffId, excludeAppointmentId: a.id, leadMin: p.byClient ? undefined : 0 });
  const slot = slots.find((s) => s.startMin === p.startMin);
  if (!slot) throw new BookingError("SLOT_TAKEN", "Essa hora já não está livre.");
  const staffId = slot.staffIds.includes(a.staffId) ? a.staffId : await pickStaff(slot.staffIds, p.day);
  const startAt = zonedToUtc(p.day, p.startMin);
  try {
    await db.update(schema.appointments).set({ startAt, endAt: new Date(startAt.getTime() + durationMin * 60_000), staffId, reminderSentAt: null })
      .where(eq(schema.appointments.id, a.id));
  } catch (e) {
    if (isOverlapError(e)) throw new BookingError("SLOT_TAKEN", "Essa hora já não está livre.");
    throw e;
  }
  const token = p.token ?? (await (await import("./notify")).rotateToken(a.id));
  await notifyAppointment(a.id, "RESCHEDULED", { token, byClient: p.byClient });
}

export async function setAppointmentStatus(id: string, status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW", byClient = false) {
  const [a] = await db.update(schema.appointments).set({ status }).where(eq(schema.appointments.id, id)).returning();
  if (!a) throw new BookingError("NOT_FOUND", "Marcação não encontrada.");
  if (status === "CANCELLED") await notifyAppointment(id, "CANCELLED", { byClient });
  return a;
}


