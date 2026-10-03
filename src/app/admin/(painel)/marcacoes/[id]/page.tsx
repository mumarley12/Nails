import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { BookingError, setAppointmentStatus, rescheduleAppointment } from "@/lib/booking";
import { getSettings } from "@/lib/settings";
import { dateKey, isValidDateKey, longDate, timeOf } from "@/lib/time";
import { euro } from "@/lib/money";
import { prettyPhone, waNumber } from "@/lib/phone";
import { Card, Flash, PageHead, StatusPill } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { RescheduleForm } from "@/components/admin/RescheduleForm";
import { IconPhone, IconWhatsApp } from "@/components/icons";

export const metadata = { title: "Marcação" };
type St = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

async function changeStatus(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id")), status = String(formData.get("status")) as St;
  if (!["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"].includes(status)) return;
  await setAppointmentStatus(id, status, false);
  revalidatePath(`/admin/marcacoes/${id}`);
  redirect(`/admin/marcacoes/${id}?ok=${status}`);
}
async function saveNotes(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id"));
  await db.update(schema.appointments).set({ notes: String(formData.get("notes") ?? "").slice(0, 1000) || null }).where(eq(schema.appointments.id, id));
  redirect(`/admin/marcacoes/${id}?ok=notas`);
}
async function reschedule(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id")), day = String(formData.get("day")), startMin = Number(formData.get("startMin")), staffId = String(formData.get("staffId") || "any");
  if (!isValidDateKey(day) || !Number.isInteger(startMin)) redirect(`/admin/marcacoes/${id}?erro=${encodeURIComponent("Escolha o dia e a hora.")}`);
  try {
    await rescheduleAppointment({ id, day, startMin, staffId, byClient: false });
  } catch (e) {
    if (e instanceof BookingError) redirect(`/admin/marcacoes/${id}?erro=${encodeURIComponent(e.message)}`);
    throw e;
  }
  redirect(`/admin/marcacoes/${id}?ok=remarcada`);
}

const OK: Record<string, string> = { CONFIRMED: "Marcação confirmada.", COMPLETED: "Marcada como concluída.", NO_SHOW: "Marcada como falta.", CANCELLED: "Marcação cancelada — a cliente recebe um email (se tiver).", PENDING: "Reaberta.", notas: "Notas guardadas.", remarcada: "Marcação remarcada — a cliente recebe um email (se tiver)." };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const a = await db.query.appointments.findFirst({ where: eq(schema.appointments.id, id), with: { customer: true, staff: true, service: true, addOn: true, logs: true } });
  if (!a) notFound();
  const s = await getSettings();
  const staff = await db.select().from(schema.staff).where(eq(schema.staff.active, true));
  const key = dateKey(a.startAt);
  const active = a.status === "PENDING" || a.status === "CONFIRMED";
  const msg = `Olá ${a.customer.name.split(" ")[0]}! Lembrete da sua marcação ${key === dateKey(new Date()) ? "hoje" : longDate(key)} às ${timeOf(a.startAt)} no ${s.salonName}, ${s.address}. Até já!`;
  const wa = `https://wa.me/${waNumber(a.customer.phone)}?text=${encodeURIComponent(msg)}`;
  const btn = (status: St, label: string, cls = "btn-outline") => (
    <form action={changeStatus}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="status" value={status} /><SubmitButton className={`${cls} h-12 w-full`} pendingText="…">{label}</SubmitButton></form>
  );

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <Link href="/admin/marcacoes" className="text-sm underline">← Marcações</Link>
      <PageHead title={a.customer.name} sub={<>{a.source === "ONLINE" ? "Marcou online" : "Marcada pelo salão"} · <Link className="underline" href={`/admin/clientes/${a.customer.id}`}>ver ficha da cliente</Link></>} actions={<StatusPill status={a.status} />} />
      <Flash ok={sp.ok ? OK[sp.ok] : undefined} error={sp.erro} />

      <div className="grid grid-cols-2 gap-2.5 sm:max-w-md">
        <a href={`tel:${a.customer.phone}`} className="btn-outline h-11"><IconPhone size={16} />Ligar</a>
        <a href={wa} target="_blank" rel="noopener" className="btn-outline h-11"><IconWhatsApp size={16} />WhatsApp</a>
      </div>

      <Card>
        <dl className="divide-y divide-[#F2F2F2] px-5 text-sm">
          {[["Telemóvel", prettyPhone(a.customer.phone)], ["Email", a.customer.email ?? "—"], ["Serviço", a.service.name + (a.addOn ? " + " + a.addOn.name : "")], ["Técnica", a.staff.name], ["Dia", longDate(key)], ["Hora", `${timeOf(a.startAt)} – ${timeOf(a.endAt)}`], ["Preço", euro(a.priceCents)]].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-3"><dt className="text-ink-muted">{k}</dt><dd className="m-0 text-right font-semibold">{v}</dd></div>
          ))}
        </dl>
      </Card>

      <div className="grid grid-cols-2 gap-2.5">
        {a.status === "PENDING" && <div className="col-span-2">{btn("CONFIRMED", "Confirmar", "btn-primary")}</div>}
        {a.status === "CONFIRMED" && <div className="col-span-2">{btn("COMPLETED", "Marcar como concluída", "btn-primary")}</div>}
        {active && btn("NO_SHOW", "Faltou")}
        {active && <a href={wa} target="_blank" rel="noopener" className="btn-outline h-12"><IconWhatsApp size={16} />Lembrar</a>}
        {active && <div className="col-span-2">{btn("CANCELLED", "Cancelar marcação", "btn h-12 w-full border border-[#E7B5BF] text-bad-fg")}</div>}
        {!active && <div className="col-span-2">{btn("PENDING", "Reabrir")}</div>}
      </div>

      {active && (
        <Card title="Remarcar">
          <form action={reschedule} className="p-5">
            <input type="hidden" name="id" value={a.id} />
            <RescheduleForm appointmentId={a.id} serviceId={a.serviceId} addOnId={a.addOnId} currentStaffId={a.staffId} staff={staff.map((p) => ({ id: p.id, name: p.name }))} />
          </form>
        </Card>
      )}

      <Card title="Notas">
        <form action={saveNotes} className="flex flex-col gap-3 p-5">
          <input type="hidden" name="id" value={a.id} />
          <label htmlFor="notes" className="sr-only">Notas</label>
          <textarea id="notes" name="notes" rows={3} defaultValue={a.notes ?? ""} className="field h-auto py-3" />
          <SubmitButton className="btn-outline h-11 self-start px-4">Guardar notas</SubmitButton>
        </form>
      </Card>

      {a.logs.length > 0 && (
        <Card title="Avisos enviados">
          <ul className="divide-y divide-[#F2F2F2] px-5 text-[13px]">
            {a.logs.sort((x, y) => +y.createdAt - +x.createdAt).map((l) => (
              <li key={l.id} className="flex justify-between gap-3 py-2.5"><span>{l.channel === "EMAIL" ? "Email" : l.channel === "PUSH" ? "Telemóvel" : "SMS"} · {l.type.replace("ALERT_", "aviso ").toLowerCase()}</span><span className={l.status === "SENT" ? "text-ok-fg" : l.status === "FAILED" ? "text-bad-fg" : "text-ink-muted"}>{l.status === "SENT" ? "Enviado" : l.status === "FAILED" ? "Falhou" : "Não enviado"}</span></li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
