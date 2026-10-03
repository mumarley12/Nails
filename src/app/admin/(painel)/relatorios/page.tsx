import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { report } from "@/lib/admin-data";
import { addDays, dateKey, isValidDateKey, shortDate, weekdayOf } from "@/lib/time";
import { euro } from "@/lib/money";
import { Card, PageHead } from "@/components/admin/ui";

export const metadata = { title: "Relatórios" };
const pct = (x: number) => (x * 100).toFixed(1).replace(".", ",") + "%";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const today = dateKey(new Date());
  const range = sp.periodo ?? "mes";
  let from = today, to = addDays(today, 1), label = "Hoje";
  if (range === "semana") { from = addDays(today, -weekdayOf(today)); to = addDays(from, 7); label = "Esta semana"; }
  if (range === "mes") { from = today.slice(0, 8) + "01"; const [y, m] = today.split("-").map(Number); to = new Date(Date.UTC(m === 12 ? y + 1 : y, m % 12, 1)).toISOString().slice(0, 10); label = "Este mês"; }
  if (range === "custom" && sp.de && sp.ate && isValidDateKey(sp.de) && isValidDateKey(sp.ate)) { from = sp.de; to = addDays(sp.ate, 1); label = `${shortDate(sp.de)} – ${shortDate(sp.ate)}`; }
  const r = await report(from, to);
  const max = Math.max(1, ...r.byDay.map((d) => d.revenue));
  const topMax = Math.max(1, ...r.topServices.map((t) => t.n));
  const retPct = r.clients ? Math.round((r.returning / r.clients) * 100) : 0;
  const tabs = [["hoje", "Hoje"], ["semana", "Esta semana"], ["mes", "Este mês"], ["custom", "Personalizado"]];

  return (
    <div className="flex flex-col gap-6">
      <PageHead title="Relatórios" sub={label} />
      <div className="flex flex-wrap items-end gap-3">
        <div role="group" aria-label="Período" className="inline-flex flex-wrap overflow-hidden rounded-btn border border-line bg-white">
          {tabs.map(([k, l]) => <Link key={k} href={`/admin/relatorios?periodo=${k}`} aria-current={range === k} className={`h-10 px-4 text-[13px] font-semibold leading-10 ${range === k ? "bg-ink text-white" : ""}`}>{l}</Link>)}
        </div>
        {range === "custom" && (
          <form className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="periodo" value="custom" />
            <div><label className="label" htmlFor="de">De</label><input id="de" type="date" name="de" defaultValue={sp.de ?? from} className="field h-10" /></div>
            <div><label className="label" htmlFor="ate">Até</label><input id="ate" type="date" name="ate" defaultValue={sp.ate ?? addDays(to, -1)} className="field h-10" /></div>
            <button className="btn-outline h-10 px-4">Ver</button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {[["Faturação", euro(r.revenue)], ["Marcações", String(r.count)], ["Clientes novas", String(r.newClients)], ["Clientes habituais", String(r.returning)], ["Valor médio", euro(r.avgTicket)], ["Cancelamentos", pct(r.cancelRate)], ["Faltas", pct(r.noShowRate)]].map(([k, v]) => (
          <div key={k} className="card px-4 py-3"><p className="text-xs font-semibold text-ink-muted">{k}</p><p className="mt-1 font-serif text-2xl">{v}</p></div>
        ))}
      </div>

      <Card title="Faturação por dia">
        <div className="p-5">
          {r.byDay.length > 1 ? (
            <>
              <div className="flex h-48 items-end gap-[3px] border-b border-[#D9D2D5]" role="img" aria-label={`Faturação por dia, máximo ${euro(max)}`}>
                {r.byDay.map((d) => (
                  <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end" title={`${shortDate(d.day)} · ${euro(d.revenue)} · ${d.count} marcações`}>
                    <div className="w-full rounded-t bg-brand group-hover:brightness-90" style={{ height: `${(d.revenue / max) * 100}%`, minHeight: d.revenue ? 2 : 0 }} />
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-ink-muted"><span>{shortDate(r.byDay[0].day)}</span><span>{shortDate(r.byDay.at(-1)!.day)}</span></div>
            </>
          ) : <p className="text-sm text-ink-muted">Escolha um período com mais de um dia para ver o gráfico.</p>}
          <details className="mt-4"><summary className="cursor-pointer text-[13px] font-semibold underline">Ver como tabela</summary>
            <table className="mt-2 w-full text-[13px]"><thead><tr className="text-left text-ink-muted"><th className="py-1.5">Dia</th><th className="py-1.5 text-right">Faturação</th><th className="py-1.5 text-right">Marcações</th></tr></thead>
              <tbody>{r.byDay.map((d) => <tr key={d.day} className="border-t border-[#F2F2F2]"><td className="py-1.5">{shortDate(d.day)}</td><td className="py-1.5 text-right tabular-nums">{euro(d.revenue)}</td><td className="py-1.5 text-right tabular-nums">{d.count}</td></tr>)}</tbody></table>
          </details>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Serviços mais marcados">
          <ul className="flex flex-col gap-3 p-5">
            {r.topServices.length === 0 && <li className="text-sm text-ink-muted">Sem dados.</li>}
            {r.topServices.map((t) => (
              <li key={t.name} className="grid grid-cols-[minmax(0,140px)_1fr_36px] items-center gap-3 text-[13px]" title={`${t.name} · ${t.n} marcações`}>
                <span className="truncate">{t.name}</span><span className="h-3.5 rounded-r bg-[#F2F2F2]"><span className="block h-full rounded-r bg-brand" style={{ width: `${(t.n / topMax) * 100}%` }} /></span><b className="text-right tabular-nums">{t.n}</b>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Tipo de cliente">
          <div className="p-5">
            <p className="mb-2 text-[13px] font-bold">Novas vs. habituais</p>
            <div className="flex h-4 gap-0.5" role="img" aria-label={`${retPct}% habituais, ${100 - retPct}% novas`}>
              <span className="rounded-l bg-brand-text" style={{ width: `${retPct}%` }} /><span className="rounded-r bg-[#D6D6D6]" style={{ width: `${100 - retPct}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[12.5px]"><span>Habituais <b>{retPct}%</b></span><span>Novas <b>{100 - retPct}%</b></span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
