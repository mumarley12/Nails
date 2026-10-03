import "server-only";
import { and, asc, desc, eq, gte, inArray, lt, sql, ilike, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { addDays, dateKey, zonedToUtc } from "./time";

const A = schema.appointments;

export function dayRange(day: string, days = 1) {
  return { from: zonedToUtc(day, 0), to: zonedToUtc(addDays(day, days), 0) };
}

/** Marcações (com cliente, técnica e serviço) num intervalo. */
export async function appointmentsBetween(from: Date, to: Date, opts: { staffId?: string; statuses?: string[] } = {}) {
  return db.query.appointments.findMany({
    where: and(gte(A.startAt, from), lt(A.startAt, to),
      opts.staffId ? eq(A.staffId, opts.staffId) : undefined,
      opts.statuses ? inArray(A.status, opts.statuses as ("PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW")[]) : undefined),
    with: { customer: true, staff: true, service: true, addOn: true },
    orderBy: [asc(A.startAt)],
  });
}

export async function dashboard(today = dateKey(new Date())) {
  const { from, to } = dayRange(today);
  const appts = await appointmentsBetween(from, to);
  const live = appts.filter((a) => a.status !== "CANCELLED");
  const revenue = live.filter((a) => a.status !== "NO_SHOW").reduce((s, a) => s + a.priceCents, 0);
  const collected = live.filter((a) => a.status === "COMPLETED").reduce((s, a) => s + a.priceCents, 0);
  const now = new Date();
  const upcoming = live.filter((a) => a.startAt > now && (a.status === "CONFIRMED" || a.status === "PENDING"));
  const firstVisit = await db.select({ customerId: A.customerId, first: sql<Date>`min(${A.startAt})` }).from(A)
    .where(inArray(A.customerId, live.length ? live.map((a) => a.customerId) : ["-"])).groupBy(A.customerId);
  const newClients = firstVisit.filter((f) => new Date(f.first) >= from).length;
  const pending = await db.query.appointments.findMany({ where: and(eq(A.status, "PENDING"), gte(A.startAt, now)), with: { customer: true, service: true }, orderBy: [asc(A.startAt)], limit: 10 });
  const tm = dayRange(addDays(today, 1));
  const tomorrow = await appointmentsBetween(tm.from, tm.to, { statuses: ["CONFIRMED", "PENDING"] });
  const staff = await db.select().from(schema.staff).where(eq(schema.staff.active, true)).orderBy(asc(schema.staff.sortOrder));
  return { appts, live, revenue, collected, upcoming, newClients, pending, tomorrow, staff };
}

export async function searchCustomers(q: string) {
  const term = `%${q.trim()}%`;
  const rows = await db.select({
    id: schema.customers.id, name: schema.customers.name, phone: schema.customers.phone, email: schema.customers.email,
    visits: sql<number>`count(${A.id}) filter (where ${A.status} = 'COMPLETED')::int`,
    spent: sql<number>`coalesce(sum(${A.priceCents}) filter (where ${A.status} = 'COMPLETED'), 0)::int`,
    last: sql<Date | null>`max(${A.startAt}) filter (where ${A.status} = 'COMPLETED')`,
    next: sql<Date | null>`min(${A.startAt}) filter (where ${A.status} in ('CONFIRMED','PENDING') and ${A.startAt} > now())`,
  }).from(schema.customers).leftJoin(A, eq(A.customerId, schema.customers.id))
    .where(q.trim() ? or(ilike(schema.customers.name, term), ilike(schema.customers.phone, `%${q.replace(/\D/g, "")}%`), ilike(schema.customers.email, term)) : undefined)
    .groupBy(schema.customers.id).orderBy(desc(sql`max(${A.startAt})`)).limit(100);
  return rows.map((r) => ({ ...r, last: r.last ? new Date(r.last) : null, next: r.next ? new Date(r.next) : null }));
}

export async function report(fromDay: string, toDayExclusive: string) {
  const from = zonedToUtc(fromDay, 0), to = zonedToUtc(toDayExclusive, 0);
  const appts = await appointmentsBetween(from, to);
  const done = appts.filter((a) => a.status === "COMPLETED" || ((a.status === "CONFIRMED" || a.status === "PENDING") && a.startAt < new Date()));
  const booked = appts.filter((a) => a.status !== "CANCELLED");
  const revenue = done.reduce((s, a) => s + a.priceCents, 0);
  const cancelled = appts.filter((a) => a.status === "CANCELLED").length;
  const noShow = appts.filter((a) => a.status === "NO_SHOW").length;
  const ids = [...new Set(booked.map((a) => a.customerId))];
  const firsts = ids.length ? await db.select({ id: A.customerId, first: sql<Date>`min(${A.startAt})` }).from(A).where(and(inArray(A.customerId, ids), inArray(A.status, ["COMPLETED", "CONFIRMED", "PENDING"]))).groupBy(A.customerId) : [];
  const newClients = firsts.filter((f) => new Date(f.first) >= from).length;
  const byDay = new Map<string, { revenue: number; count: number }>();
  for (let d = fromDay; d < toDayExclusive; d = addDays(d, 1)) byDay.set(d, { revenue: 0, count: 0 });
  for (const a of done) { const k = dateKey(a.startAt); const v = byDay.get(k); if (v) { v.revenue += a.priceCents; v.count++; } }
  const tally = (key: (a: (typeof appts)[number]) => string) => {
    const m = new Map<string, { n: number; cents: number }>();
    for (const a of booked) { const k = key(a); const v = m.get(k) ?? { n: 0, cents: 0 }; v.n++; v.cents += a.priceCents; m.set(k, v); }
    return [...m.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.n - a.n);
  };
  return {
    revenue, count: booked.length, newClients, returning: Math.max(0, ids.length - newClients), clients: ids.length,
    avgTicket: done.length ? Math.round(revenue / done.length) : 0,
    cancelRate: appts.length ? cancelled / appts.length : 0, noShowRate: appts.length ? noShow / appts.length : 0,
    byDay: [...byDay.entries()].map(([day, v]) => ({ day, ...v })),
    topServices: tally((a) => a.service.name).slice(0, 6),
    byStaff: tally((a) => a.staff.name.split(" ")[0]),
  };
}
