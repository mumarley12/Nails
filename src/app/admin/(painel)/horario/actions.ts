"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, gte, inArray, lt, notInArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { addDays, dateKey, isValidDateKey, minutesOfDay, zonedToUtc } from "@/lib/time";
import { canEditWeek, mondayOf, parseVagas } from "@/lib/vagas";

const DAY_NAMES = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
const go = (week: string, k: "ok" | "erro", msg: string) => redirect(`/admin/horario?semana=${week}&${k}=${encodeURIComponent(msg)}`);

/** Publica (ou altera) as vagas de uma semana. Vagas já marcadas nunca são apagadas. */
export async function saveWeekVagas(fd: FormData) {
  await requireAdmin();
  const now = new Date(), today = dateKey(now), nowMin = minutesOfDay(now);
  const raw = String(fd.get("week") ?? "");
  const week = isValidDateKey(raw) ? mondayOf(raw) : mondayOf(today);
  if (!canEditWeek(week, today)) go(week, "erro", "Esta semana ainda não pode ser publicada. A próxima semana abre 2 dias antes, ao sábado.");

  // Horas já marcadas por clientes nessa semana (ficam sempre).
  const booked = await db.select({ startAt: schema.appointments.startAt }).from(schema.appointments)
    .where(and(gte(schema.appointments.startAt, zonedToUtc(week, 0)), lt(schema.appointments.startAt, zonedToUtc(addDays(week, 7), 0)), inArray(schema.appointments.status, ["PENDING", "CONFIRMED"])));
  const bookedBy = new Map<string, number[]>();
  for (const b of booked) { const k = dateKey(b.startAt); bookedBy.set(k, [...(bookedBy.get(k) ?? []), minutesOfDay(b.startAt)]); }

  let total = 0;
  for (let i = 0; i < 7; i++) {
    const date = addDays(week, i);
    if (date < today) continue; // dias que já passaram não mudam
    const p = parseVagas(String(fd.get(`v-${i}`) ?? ""));
    if (!p.ok) go(week, "erro", `Não percebi «${p.bad}» (${DAY_NAMES[i]}). Escreva as horas assim: 10:30, 14:30`);
    else {
      const keepBooked = bookedBy.get(date) ?? [];
      const wanted = p.mins.filter((m) => !(date === today && m <= nowMin));
      const all = [...new Set([...wanted, ...keepBooked])];
      if (all.length) await db.delete(schema.vagas).where(and(eq(schema.vagas.date, date), notInArray(schema.vagas.startMin, all)));
      else await db.delete(schema.vagas).where(eq(schema.vagas.date, date));
      if (wanted.length) await db.insert(schema.vagas).values(wanted.map((startMin) => ({ date, startMin }))).onConflictDoNothing();
      total += wanted.filter((m) => !keepBooked.includes(m)).length;
    }
  }
  revalidateTag("public"); revalidatePath("/"); revalidatePath("/admin/horario"); revalidatePath("/admin/agenda"); revalidatePath("/admin");
  go(week, "ok", total ? `Vagas publicadas (${total} livres). Já aparecem no site.` : "Guardado. Esta semana não tem vagas livres.");
}

