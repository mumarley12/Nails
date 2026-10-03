import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { dashboard } from "@/lib/admin-data";
import { dateKey, longDate, timeOf, hhmm, weekdayOf } from "@/lib/time";
import { euro } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { waNumber } from "@/lib/phone";
import { Card, Empty, PageHead, StatusPill } from "@/components/admin/ui";
import { IconWhatsApp } from "@/components/icons";
import { and, eq, gte, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { addDays } from "@/lib/time";
import { weekRules } from "@/lib/vagas";

export const metadata = { title: "Visão geral" };

export default async function Page() {
  const admin = await requireAdmin();
  const today = dateKey(new Date());
  const [d, s] = await Promise.all([dashboard(today), getSettings()]);
  const hour = Number(new Intl.DateTimeFormat("pt-PT", { hour: "numeric", hour12: false, timeZone: "Europe/Lisbon" }).format(new Date()));
  const hello = hour < 13 ? "Bom dia" : hour < 20 ? "Boa tarde" : "Boa noite";
  const wd = weekdayOf(today);
  const next = d.upcoming[0];
  const rules = weekRules(today);
  const pendingFeedback = (await db.select({ id: schema.reviews.id }).from(schema.reviews).where(eq(schema.reviews.visible, false))).length;
  const nextWeekVagas = rules.nextIsOpen ? (await db.select({ id: schema.vagas.id }).from(schema.vagas).where(and(gte(schema.vagas.date, rules.nextWeek), lt(schema.vagas.date, addDays(rules.nextWeek, 7)))).limit(1)).length : 1;

  return (
    <div className="flex flex-col gap-6">
      <PageHead eyebrow={longDate(today).toUpperCase()} title={`${hello}, ${admin.name.split(" ")[0]}`}
        actions={<><Link href="/admin/agenda" className="btn-outline h-11 px-4">Ver agenda</Link><Link href="/admin/marcacoes/nova" className="btn-primary h-11 px-4">+ Nova marcação</Link></>} />

      {nextWeekVagas === 0 && (
        <Link href={`/admin/horario?semana=${rules.nextWeek}`} className="flex items-center justify-between gap-3 rounded-card border border-[#E3D3B8] bg-[#F6EEDF] px-5 py-4 text-sm text-[#5C4320]">
          <span><b>Já pode publicar as vagas da próxima semana.</b> As clientes só conseguem marcar depois de as publicar.</span><span className="font-bold underline">Publicar</span>
        </Link>
      )}

      {pendingFeedback > 0 && (
        <Link href="/admin/site#opinioes" className="flex items-center justify-between gap-3 rounded-card border border-line bg-white px-5 py-4 text-sm">
          <span><b>{pendingFeedback === 1 ? "1 feedback novo" : `${pendingFeedback} feedbacks novos`}</b> à espera de ser publicado.</span><span className="font-bold underline">Ver</span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Marcações de hoje" value={String(d.live.length)} note={`${d.live.filter((a) => a.status === "COMPLETED").length} concluídas · faltam ${d.upcoming.length}`} />
        <Stat label="Faturação de hoje" value={euro(d.revenue)} note={`${euro(d.collected)} já concluído`} />
        <Stat label="Clientes novas" value={String(d.newClients)} note="Primeira visita hoje" />
        <Stat label="Próximas" value={String(d.upcoming.length)} note={next ? `A seguir: ${next.customer.name.split(" ")[0]} às ${timeOf(next.startAt)}` : "Nada mais hoje"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
        <Card title="Agenda de hoje" action={<span className="text-xs text-ink-muted">{d.live.length} marcações</span>}>
          {d.appts.length === 0 ? <Empty>Sem marcações hoje.</Empty> : (
            <ul>
              {d.appts.map((a) => (
                <li key={a.id}>
                  <Link href={`/admin/marcacoes/${a.id}`} className={`flex items-center gap-3 border-b border-[#F5F5F5] px-5 py-3 hover:bg-brand-soft ${a.status === "COMPLETED" || a.status === "CANCELLED" ? "opacity-60" : ""}`}>
                    <span className="w-14 shrink-0 text-[13px] font-bold">{timeOf(a.startAt)}</span>
                    <span className="min-w-0 flex-1"><b className="block truncate text-sm">{a.customer.name}</b><span className="block truncate text-xs text-ink-muted">{a.service.name}{a.addOn ? " + " + a.addOn.name : ""}</span></span>
                    <StatusPill status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-5">
          <Card title="Requer atenção">
            <ul className="flex flex-col gap-3 p-5 text-[13px] leading-snug">
              {d.pending.length > 0 && <li><Link href="/admin/marcacoes?estado=PENDING" className="underline"><b>{d.pending.length} pedido(s)</b> por confirmar</Link></li>}
              {d.tomorrow.length > 0 && (
                <li>
                  <b>Amanhã: {d.tomorrow.length} cliente(s).</b> Lembrete por WhatsApp (grátis):
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {d.tomorrow.map((a) => {
                      const msg = `Olá ${a.customer.name.split(" ")[0]}! Lembrete da sua marcação amanhã às ${timeOf(a.startAt)} no ${s.salonName}, ${s.address}. Até amanhã!`;
                      return (
                        <li key={a.id}><a href={`https://wa.me/${waNumber(a.customer.phone)}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener" className="flex min-h-[40px] items-center gap-2 rounded-card border border-line px-3 hover:bg-brand-soft">
                          <IconWhatsApp size={15} /><span className="flex-1">{timeOf(a.startAt)} · {a.customer.name}</span><span className="text-xs font-semibold text-brand-text">Lembrar</span></a></li>
                      );
                    })}
                  </ul>
                </li>
              )}
              {d.pending.length === 0 && d.tomorrow.length === 0 && <li className="text-ink-muted">Está tudo em dia.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="card px-4 py-3.5 md:px-5 md:py-4">
      <p className="text-xs font-semibold text-ink-muted">{label}</p>
      <p className="mt-1 font-serif text-[28px] leading-tight md:text-[34px]">{value}</p>
      <p className="mt-1 text-[11.5px] text-ink-soft">{note}</p>
    </div>
  );
}
