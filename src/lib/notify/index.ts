import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSettings } from "@/lib/settings";
import { dateKey, longDate, timeOf } from "@/lib/time";
import { euro } from "@/lib/money";
import { prettyPhone, waNumber } from "@/lib/phone";
import { newToken } from "@/lib/token";
import { sendEmail } from "./email";
import { pushToAdmins } from "./push";
import { sendSms, smsSafe } from "./sms";
import { tpl, type ApptView } from "./templates";

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

async function log(appointmentId: string | null, channel: string, type: string, recipient: string, r: { ok: boolean; error?: string; skipped?: boolean }) {
  await db.insert(schema.notificationLogs).values({
    appointmentId, channel, type, recipient, status: r.ok ? "SENT" : r.skipped ? "SKIPPED" : "FAILED", error: r.ok ? null : r.error ?? null,
  });
}

/** Carrega os dados da marcação para os textos. Se `token` vier, gera os links privados. */
export async function apptView(id: string, token: string | null): Promise<ApptView | null> {
  const a = await db.query.appointments.findFirst({
    where: eq(schema.appointments.id, id),
    with: { customer: true, staff: true, service: true, addOn: true },
  });
  if (!a) return null;
  const s = await getSettings();
  const wa = s.whatsappButton ? `https://wa.me/${waNumber(s.whatsapp)}` : null;
  return {
    id: a.id, customerName: a.customer.name, customerEmail: a.customer.email, customerPhone: prettyPhone(a.customer.phone),
    serviceName: a.service.name + (a.addOn ? ` + ${a.addOn.name}` : ""), staffName: a.staff.name.split(" ")[0],
    dateLabel: longDate(dateKey(a.startAt)), timeLabel: timeOf(a.startAt), endLabel: timeOf(a.endAt), priceLabel: euro(a.priceCents),
    salonName: s.salonName, address: `${s.address}, ${s.postalCode} ${s.city}`,
    manageUrl: token ? `${siteUrl()}/m/${token}` : null, icsUrl: token ? `${siteUrl()}/api/ics/${token}` : null, whatsappUrl: wa,
  };
}

/** Gera um link privado novo (o anterior deixa de funcionar) — usado em lembretes e alterações feitas pelo salão. */
export async function rotateToken(appointmentId: string): Promise<string> {
  const { token, hash } = newToken();
  await db.update(schema.appointments).set({ manageTokenHash: hash }).where(eq(schema.appointments.id, appointmentId));
  return token;
}

type Event = "BOOKED" | "RESCHEDULED" | "CANCELLED";

/**
 * Avisa a cliente (email) e o salão (email + notificação no telemóvel).
 * Nunca lança erro: uma falha de email não pode estragar uma marcação.
 */
export async function notifyAppointment(id: string, event: Event, opts: { token?: string | null; byClient: boolean }) {
  try {
    const s = await getSettings();
    const v = await apptView(id, opts.token ?? null);
    if (!v) return;
    const t = event === "BOOKED" ? tpl.confirmed(v) : event === "RESCHEDULED" ? tpl.rescheduled(v) : tpl.cancelled(v);

    if (s.emailConfirmations && v.customerEmail) {
      await log(id, "EMAIL", event, v.customerEmail, await sendEmail(v.customerEmail, t.subject, t.html, t.text));
    }
    if (s.smsEnabled) {
      const body = smsSafe(`${s.salonName}: ${event === "CANCELLED" ? "marcacao cancelada" : "marcacao confirmada"} ${v.dateLabel} as ${v.timeLabel}.${v.manageUrl ? " Alterar: " + v.manageUrl : ""}`);
      const a = await db.query.appointments.findFirst({ where: eq(schema.appointments.id, id), with: { customer: true } });
      if (a) await log(id, "SMS", event, a.customer.phone, await sendSms(a.customer.phone, body));
    }
    if (opts.byClient) {
      const kind = event === "BOOKED" ? "nova" : event === "RESCHEDULED" ? "alterada" : "cancelada";
      const adminUrl = `${siteUrl()}/admin/marcacoes/${id}`;
      if (s.alertByEmail && s.alertEmail) {
        const al = tpl.salonAlert(v, kind, adminUrl);
        await log(id, "EMAIL", `ALERT_${event}`, s.alertEmail, await sendEmail(s.alertEmail, al.subject, al.html, al.text));
      }
      if (s.alertByPush) {
        const title = kind === "nova" ? "Nova marcação" : kind === "alterada" ? "Marcação alterada" : "Marcação cancelada";
        const r = await pushToAdmins({ title, body: `${v.customerName} · ${v.serviceName} · ${v.dateLabel.split(",")[0]} ${v.timeLabel}`, url: `/admin/marcacoes/${id}` });
        await log(id, "PUSH", `ALERT_${event}`, `${r.sent} dispositivo(s)`, { ok: r.sent > 0, error: r.error, skipped: r.sent === 0 });
      }
    }
  } catch (e) {
    console.error("Falha ao enviar avisos", e);
  }
}

/** Lembretes por email para as marcações de amanhã (corre uma vez por dia). */
export async function sendTomorrowReminders(now = new Date()): Promise<number> {
  const s = await getSettings();
  if (!s.emailConfirmations) return 0;
  const { addDays, zonedToUtc } = await import("@/lib/time");
  const tomorrow = addDays(dateKey(now), 1);
  const from = zonedToUtc(tomorrow, 0), to = zonedToUtc(addDays(tomorrow, 1), 0);
  const { and, gte, lt, inArray, isNull } = await import("drizzle-orm");
  const rows = await db.query.appointments.findMany({
    where: and(gte(schema.appointments.startAt, from), lt(schema.appointments.startAt, to), inArray(schema.appointments.status, ["CONFIRMED", "PENDING"]), isNull(schema.appointments.reminderSentAt)),
    with: { customer: true },
  });
  let n = 0;
  for (const a of rows) {
    if (!a.customer.email) continue;
    const token = await rotateToken(a.id);
    const v = await apptView(a.id, token);
    if (!v) continue;
    const t = tpl.reminder(v);
    const r = await sendEmail(a.customer.email, t.subject, t.html, t.text);
    await log(a.id, "EMAIL", "REMINDER", a.customer.email, r);
    await db.update(schema.appointments).set({ reminderSentAt: new Date() }).where(eq(schema.appointments.id, a.id));
    if (r.ok) n++;
  }
  return n;
}
