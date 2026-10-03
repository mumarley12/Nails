import Link from "next/link";
import { and, asc, gte, inArray, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { addDays, dateKey, DIAS, isValidDateKey, minutesOfDay, shortDate, zonedToUtc } from "@/lib/time";
import { canEditWeek, fmtVaga, mondayOf, weekRules } from "@/lib/vagas";
import { Card, Flash, PageHead } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { saveWeekVagas } from "./actions";

export const metadata = { title: "Horário semanal" };

const cap = (s: string) => s.replace(/^./, (c) => c.toUpperCase());
const noYear = (s: string) => s.replace(/ \d{4}$/, "");
const range = (w: string) => `${noYear(shortDate(w))} – ${noYear(shortDate(addDays(w, 6)))}`;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const now = new Date(), today = dateKey(now), nowMin = minutesOfDay(now);
  const r = weekRules(today);
  const asked = sp.semana && isValidDateKey(sp.semana) ? mondayOf(sp.semana) : r.thisWeek;
  const week = asked === r.nextWeek ? r.nextWeek : r.thisWeek;
  const editable = canEditWeek(week, today);
  const end = addDays(week, 7);

  const [rows, appts] = await Promise.all([
    db.select().from(schema.vagas).where(and(gte(schema.vagas.date, week), lt(schema.vagas.date, end))).orderBy(asc(schema.vagas.startMin)),
    db.query.appointments.findMany({
      where: and(gte(schema.appointments.startAt, zonedToUtc(week, 0)), lt(schema.appointments.startAt, zonedToUtc(end, 0)), inArray(schema.appointments.status, ["PENDING", "CONFIRMED"])),
      with: { customer: true }, orderBy: [asc(schema.appointments.startAt)],
    }),
  ]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(week, i);
    const booked = appts.filter((a) => dateKey(a.startAt) === date).map((a) => ({ id: a.id, min: minutesOfDay(a.startAt), name: a.customer.name.split(" ")[0] }));
    const free = rows.filter((v) => v.date === date && !booked.some((b) => b.min === v.startMin)).map((v) => v.startMin);
    return { i, date, booked, free, past: date < today };
  });
  const totalFree = days.reduce((n, d) => n + d.free.filter((m) => !(d.date === today && m <= nowMin)).length, 0);
  const totalBooked = days.reduce((n, d) => n + d.booked.length, 0);

  const tab = (w: string, label: string, locked: boolean) => (
    <Link href={`/admin/horario?semana=${w}`} aria-current={w === week}
      className={`flex min-h-[56px] flex-1 flex-col justify-center rounded-card border px-4 py-2 ${w === week ? "border-ink bg-white" : "border-line bg-[#FBFBFB]"}`}>
      <span className="text-sm font-bold">{label}</span>
      <span className="text-xs text-ink-muted">{range(w)}{locked ? ` · abre ${noYear(shortDate(r.nextOpensOn))}` : ""}</span>
    </Link>
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHead title="Horário semanal" sub="Escreva as horas em que pode receber uma cliente. Cada hora é uma vaga: quando alguém marca, sai do site." />
      <Flash ok={sp.ok} error={sp.erro} />

      <div className="flex gap-2">
        {tab(r.thisWeek, "Esta semana", false)}
        {tab(r.nextWeek, "Próxima semana", !r.nextIsOpen)}
      </div>

      {!editable ? (
        <Card>
          <div className="flex flex-col gap-2 p-6 text-center">
            <p className="font-serif text-xl">A próxima semana abre {cap(DIAS[5])}, {noYear(shortDate(r.nextOpensOn))}</p>
            <p className="text-sm text-ink-muted">As vagas de cada semana só podem ser publicadas a partir de 2 dias antes de a semana começar.</p>
            <Link href={`/admin/horario?semana=${r.thisWeek}`} className="btn-outline mx-auto mt-3 h-11 px-5">Ver esta semana</Link>
          </div>
        </Card>
      ) : (
        <Card title={week === r.thisWeek ? "Esta semana" : "Próxima semana"} action={<span className="text-xs text-ink-muted">{totalFree} {totalFree === 1 ? "livre" : "livres"} · {totalBooked} {totalBooked === 1 ? "marcada" : "marcadas"}</span>}>
          <form action={saveWeekVagas}>
            <input type="hidden" name="week" value={week} />
            <ul>
              {days.map((d) => (
                <li key={d.date} className={`border-t border-[#F2F2F2] px-5 py-4 first:border-t-0 ${d.past ? "opacity-50" : ""}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <label htmlFor={`v-${d.i}`} className="text-[15px] font-semibold">{cap(DIAS[d.i])}, {noYear(shortDate(d.date))}{d.date === today && <span className="ml-2 rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-bold text-brand-text">HOJE</span>}</label>
                    {d.past && <span className="text-xs text-ink-muted">Já passou</span>}
                  </div>
                  {d.booked.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Marcadas">
                      {d.booked.map((b) => (
                        <li key={b.id}><Link href={`/admin/marcacoes/${b.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#F1E8DA] px-3 text-[13px] font-semibold text-[#5C4320]">{fmtVaga(b.min)} · {b.name}</Link></li>
                      ))}
                    </ul>
                  )}
                  {d.past ? (
                    <p className="mt-1 text-sm text-ink-muted">{d.free.length ? d.free.map(fmtVaga).join(", ") : d.booked.length ? "" : "Sem vagas"}</p>
                  ) : (
                    <input id={`v-${d.i}`} name={`v-${d.i}`} defaultValue={d.free.map(fmtVaga).join(", ")} placeholder="Sem vagas · ex.: 10:30, 14:30"
                      autoComplete="off" inputMode="text" className="field mt-2 h-12 text-[16px]" />
                  )}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 border-t border-line px-5 py-4">
              <SubmitButton className="btn-primary h-12 w-full sm:w-auto sm:px-8">Publicar vagas</SubmitButton>
              <p className="text-xs text-ink-muted">Separe as horas com vírgulas. Deixe vazio nos dias em que não atende. As horas já marcadas (a dourado) ficam sempre.</p>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
