import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { appointmentsBetween } from "@/lib/admin-data";
import { addDays, dateKey, isValidDateKey, shortDate, timeOf, zonedToUtc } from "@/lib/time";
import { euro } from "@/lib/money";
import { prettyPhone } from "@/lib/phone";
import { Card, Empty, PageHead, StatusPill, STATUS } from "@/components/admin/ui";

export const metadata = { title: "Marcações" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const today = dateKey(new Date());
  const de = sp.de && isValidDateKey(sp.de) ? sp.de : today;
  const ate = sp.ate && isValidDateKey(sp.ate) ? sp.ate : addDays(today, 30);
  const estado = sp.estado && STATUS[sp.estado] ? sp.estado : undefined;
  const list = await appointmentsBetween(zonedToUtc(de, 0), zonedToUtc(addDays(ate, 1), 0), { statuses: estado ? [estado] : undefined });
  return (
    <div className="flex flex-col gap-5">
      <PageHead title="Marcações" sub={`${list.length} entre ${shortDate(de)} e ${shortDate(ate)}`} actions={<Link href="/admin/marcacoes/nova" className="btn-primary h-11 px-4">+ Nova marcação</Link>} />
      <form className="card flex flex-wrap items-end gap-3 p-4">
        <div><label className="label" htmlFor="de">De</label><input id="de" type="date" name="de" defaultValue={de} className="field" /></div>
        <div><label className="label" htmlFor="ate">Até</label><input id="ate" type="date" name="ate" defaultValue={ate} className="field" /></div>
        <div><label className="label" htmlFor="estado">Estado</label>
          <select id="estado" name="estado" defaultValue={estado ?? ""} className="field"><option value="">Todos</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label.charAt(0) + v.label.slice(1).toLowerCase()}</option>)}</select></div>
        <button className="btn-outline h-11 px-4">Filtrar</button>
      </form>
      <Card>
        {list.length === 0 ? <Empty>Não há marcações com estes filtros.</Empty> : (
          <ul className="divide-y divide-[#F2F2F2]">
            {list.map((a) => (
              <li key={a.id}>
                <Link href={`/admin/marcacoes/${a.id}`} className="grid grid-cols-[64px_1fr_auto] items-center gap-3 px-4 py-3 hover:bg-brand-soft md:grid-cols-[110px_1.3fr_1fr_90px_auto] md:px-5">
                  <span className="text-[13px] font-bold leading-tight">{shortDate(dateKey(a.startAt)).replace(/ \d{4}$/, "")}<span className="block font-normal text-ink-muted">{timeOf(a.startAt)}</span></span>
                  <span className="min-w-0"><b className="block truncate text-sm">{a.customer.name}</b><span className="block truncate text-xs text-ink-muted">{prettyPhone(a.customer.phone)}</span></span>
                  <span className="hidden min-w-0 truncate text-[13px] md:block">{a.service.name}{a.addOn ? " + " + a.addOn.name : ""}</span>
                  <span className="hidden text-right text-[13px] font-semibold md:block">{euro(a.priceCents)}</span>
                  <StatusPill status={a.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
