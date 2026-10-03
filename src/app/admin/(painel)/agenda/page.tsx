import Link from "next/link";
import { asc, eq, gte, lt, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { appointmentsBetween, dayRange } from "@/lib/admin-data";
import { addDays, dateKey, DIAS_CURTOS, isValidDateKey, longDate, minutesOfDay, parseHHMM, timeOf, weekdayOf, zonedToUtc, hhmm } from "@/lib/time";
import { PageHead, StatusPill } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { IconBack, IconNext } from "@/components/icons";
import { fmtVaga } from "@/lib/vagas";

export const metadata = { title: "Agenda" };
const PX = 60; // px por hora
const TONES = [["#EDEDED", "#BDBDBD"], ["#F5ECE2", "#D8BB9C"], ["#E9F0E9", "#AFC6B0"], ["#E8ECF4", "#AFB9CF"], ["#F2EAF0", "#C9B4C4"]];

async function block(formData: FormData) {
  "use server";
  await requireAdmin();
  const day = String(formData.get("day")), staffId = null;
  const s = parseHHMM(String(formData.get("from"))), e = parseHHMM(String(formData.get("to")));
  if (!isValidDateKey(day) || s === null || e === null || e <= s) redirect(`/admin/agenda?dia=${day}&erro=1`);
  await db.insert(schema.blockedTimes).values({ staffId, startAt: zonedToUtc(day, s!), endAt: zonedToUtc(day, e!), reason: String(formData.get("reason") || "Bloqueado").slice(0, 60) });
  revalidatePath("/admin/agenda");
  redirect(`/admin/agenda?dia=${day}`);
}
async function unblock(formData: FormData) {
  "use server";
  await requireAdmin();
  await db.delete(schema.blockedTimes).where(eq(schema.blockedTimes.id, String(formData.get("id"))));
  revalidatePath("/admin/agenda");
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const view = sp.vista === "semana" ? "semana" : "dia";
  const day = sp.dia && isValidDateKey(sp.dia) ? sp.dia : dateKey(new Date());
  const start = view === "semana" ? addDays(day, -weekdayOf(day)) : day;
  const n = view === "semana" ? 7 : 1;
  const { from, to } = dayRange(start, n);
  const [staff, appts, blocks, hours, dayVagas] = await Promise.all([
    db.select().from(schema.staff).where(eq(schema.staff.active, true)).orderBy(asc(schema.staff.sortOrder)),
    appointmentsBetween(from, to),
    db.select().from(schema.blockedTimes).where(and(gte(schema.blockedTimes.endAt, from), lt(schema.blockedTimes.startAt, to))),
    db.select().from(schema.businessHours),
    db.select().from(schema.vagas).where(and(gte(schema.vagas.date, start), lt(schema.vagas.date, addDays(start, n)))).orderBy(asc(schema.vagas.startMin)),
  ]);
  const shown = staff.slice(0, 1);
  const todays = dayVagas.filter((v) => v.date === day).map((v) => v.startMin);
  const isOpen = todays.length > 0;
  const tone = (id: string) => TONES[Math.max(0, staff.findIndex((p) => p.id === id)) % TONES.length];
  void hours;
  const dayStart = Math.min(...todays, 540) - (Math.min(...todays, 540) % 60), dayEnd = Math.max(...todays.map((m) => m + 120), 1140);
  const q = (o: Record<string, string | undefined>) => "/admin/agenda?" + new URLSearchParams(Object.entries({ vista: view, dia: day, ...o }).filter(([, v]) => v) as [string, string][]).toString();
  const visible = appts.filter((a) => a.status !== "CANCELLED");

  return (
    <div className="flex flex-col gap-5">
      <PageHead title={view === "dia" ? longDate(day).replace(/^./, (c) => c.toUpperCase()) : `Semana de ${Number(start.slice(8))}/${start.slice(5, 7)}`}
        actions={<Link href={`/admin/marcacoes/nova?dia=${day}`} className="btn-primary h-11 px-4">+ Nova marcação</Link>} />

      <div className="flex flex-wrap items-center gap-2">
        <Link href={q({ dia: addDays(day, view === "semana" ? -7 : -1) })} aria-label="Anterior" className="grid h-10 w-10 place-items-center rounded-btn border border-line bg-white"><IconBack size={16} /></Link>
        <Link href={q({ dia: addDays(day, view === "semana" ? 7 : 1) })} aria-label="Seguinte" className="grid h-10 w-10 place-items-center rounded-btn border border-line bg-white"><IconNext size={16} /></Link>
        <Link href={q({ dia: dateKey(new Date()) })} className="inline-flex h-10 items-center rounded-btn border border-line bg-white px-3.5 text-[13px] font-semibold">Hoje</Link>
        <form className="contents"><input type="date" name="dia" defaultValue={day} aria-label="Ir para o dia" className="field h-10 w-auto" /><input type="hidden" name="vista" value={view} /><button className="h-10 rounded-btn border border-line bg-white px-3 text-[13px] font-semibold">Ir</button></form>
        <div role="group" aria-label="Vista" className="ml-auto inline-flex overflow-hidden rounded-btn border border-line bg-white">
          <Link href={q({ vista: "dia" })} aria-current={view === "dia"} className={`h-10 px-4 leading-10 text-[13px] font-semibold ${view === "dia" ? "bg-ink text-white" : ""}`}>Dia</Link>
          <Link href={q({ vista: "semana" })} aria-current={view === "semana"} className={`h-10 px-4 leading-10 text-[13px] font-semibold ${view === "semana" ? "bg-ink text-white" : ""}`}>Semana</Link>
        </div>
      </div>
      {view === "dia" ? (
        <div className="card overflow-x-auto">
          <div className="grid min-w-full" style={{ gridTemplateColumns: `52px repeat(${shown.length}, minmax(200px, 1fr))` }}>
            <div className="border-b border-line" />
            {shown.map((p) => <div key={p.id} className="border-b border-l border-line px-3 py-2.5 text-sm font-bold">{isOpen ? `Vagas: ${todays.map(fmtVaga).join(", ")}` : "Sem vagas"}<Link href="/admin/horario" className="ml-3 text-[12px] font-normal text-brand-text underline">mudar vagas</Link></div>)}
            <div className="relative" style={{ height: ((dayEnd - dayStart) / 60) * PX }}>
              {Array.from({ length: Math.ceil((dayEnd - dayStart) / 60) }, (_, i) => <span key={i} className="absolute right-2 text-[11px] text-[#8A8A8A]" style={{ top: i * PX + 2 }}>{(dayStart / 60 + i)}h</span>)}
            </div>
            {shown.map((p) => (
              <div key={p.id} className="relative border-l border-line" style={{ height: ((dayEnd - dayStart) / 60) * PX, backgroundImage: isOpen ? `repeating-linear-gradient(180deg, transparent 0 ${PX - 1}px, #F2F2F2 ${PX - 1}px ${PX}px)` : "repeating-linear-gradient(135deg,#F2F2F2 0 4px,#FAFAFA 4px 8px)" }}>
                {blocks.filter((b) => dateKey(b.startAt) === day).map((b) => (
                  <div key={b.id} className="absolute inset-x-1 rounded-[3px] px-2 py-1 text-[11px] font-semibold text-ink-soft" style={{ top: ((minutesOfDay(b.startAt) - dayStart) / 60) * PX, height: ((b.endAt.getTime() - b.startAt.getTime()) / 3600000) * PX - 2, background: "repeating-linear-gradient(135deg,#E9E9E9 0 3px,#F7F7F7 3px 6px)" }}>{b.reason}</div>
                ))}
                {visible.map((a) => (
                  <Link key={a.id} href={`/admin/marcacoes/${a.id}`} className="absolute inset-x-1 overflow-hidden rounded-[3px] border px-2 py-1 hover:shadow-md"
                    style={{ top: ((minutesOfDay(a.startAt) - dayStart) / 60) * PX + 1, height: Math.max(26, ((a.endAt.getTime() - a.startAt.getTime()) / 3600000) * PX - 3), background: tone(p.id)[0], borderColor: tone(p.id)[1], opacity: a.status === "COMPLETED" || a.status === "NO_SHOW" ? 0.6 : 1 }}>
                    <span className="block text-[11px] font-bold">{timeOf(a.startAt)}–{timeOf(a.endAt)}{a.status === "PENDING" ? " · pendente" : ""}</span>
                    <span className="block truncate text-xs font-semibold">{a.customer.name}</span>
                    <span className="block truncate text-[11px] text-[#4A4A4A]">{a.service.name}{a.addOn ? " + " + a.addOn.name : ""}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <div className="grid min-w-[840px] grid-cols-7">
            {Array.from({ length: 7 }, (_, i) => addDays(start, i)).map((d) => {
              const list = visible.filter((a) => dateKey(a.startAt) === d);
              return (
                <div key={d} className="min-h-[300px] border-l border-line first:border-l-0">
                  <Link href={q({ vista: "dia", dia: d })} className={`block border-b border-line px-3 py-2.5 ${d === dateKey(new Date()) ? "bg-brand-soft" : ""}`}>
                    <span className="block text-[11px] font-bold tracking-[0.14em]">{DIAS_CURTOS[weekdayOf(d)]}</span>
                    <span className="font-serif text-xl">{Number(d.slice(8))}</span> <span className="text-[11px] text-ink-muted">{list.length} marc.</span>
                  </Link>
                  <ul className="flex flex-col gap-1.5 p-1.5">
                    {list.map((a) => (
                      <li key={a.id}><Link href={`/admin/marcacoes/${a.id}`} className="block rounded-[3px] border px-2 py-1.5 text-[11.5px] leading-tight" style={{ background: tone(a.staffId)[0], borderColor: tone(a.staffId)[1] }}>
                        <b>{timeOf(a.startAt)}</b> {a.customer.name.split(" ")[0]}<span className="block truncate text-[#4A4A4A]">{a.service.name}</span></Link></li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "dia" && visible.length > 0 && (
        <ul className="card divide-y divide-[#F2F2F2] md:hidden" aria-label="Lista do dia">
          {visible.map((a) => (
            <li key={a.id}><Link href={`/admin/marcacoes/${a.id}`} className="flex items-center gap-3 px-4 py-3"><b className="w-12 text-[13px]">{timeOf(a.startAt)}</b><span className="min-w-0 flex-1"><b className="block truncate text-sm">{a.customer.name}</b><span className="block truncate text-xs text-ink-muted">{a.service.name}</span></span><StatusPill status={a.status} /></Link></li>
          ))}
        </ul>
      )}

      <details className="card">
        <summary className="cursor-pointer list-none px-5 py-4 font-serif text-lg">Bloquear horário (almoço, férias, ausência)</summary>
        <form action={block} className="grid gap-3 border-t border-[#F0F0F0] p-5 sm:grid-cols-4">
          <div><label className="label" htmlFor="b-day">Dia</label><input id="b-day" name="day" type="date" defaultValue={day} className="field" required /></div>
          <div><label className="label" htmlFor="b-from">Das</label><input id="b-from" name="from" type="time" defaultValue="13:00" className="field" required /></div>
          <div><label className="label" htmlFor="b-to">Às</label><input id="b-to" name="to" type="time" defaultValue="14:00" className="field" required /></div>
          <div><label className="label" htmlFor="b-reason">Motivo</label><input id="b-reason" name="reason" defaultValue="Almoço" className="field" /></div>
          <div className="sm:col-span-4"><SubmitButton className="btn-primary h-11">Bloquear</SubmitButton></div>
        </form>
        {blocks.length > 0 && (
          <ul className="border-t border-[#F0F0F0] px-5 py-3 text-[13px]">
            {blocks.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-1.5">
                <span>{dateKey(b.startAt)} · {timeOf(b.startAt)}–{timeOf(b.endAt)} · {b.reason}</span>
                <form action={unblock}><input type="hidden" name="id" value={b.id} /><button className="text-xs font-bold text-bad-fg underline">Remover</button></form>
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  );
}
