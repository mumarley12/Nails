import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { searchCustomers } from "@/lib/admin-data";
import { dateKey, shortDate, timeOf } from "@/lib/time";
import { euro } from "@/lib/money";
import { prettyPhone } from "@/lib/phone";
import { Card, Empty, PageHead } from "@/components/admin/ui";

export const metadata = { title: "Clientes" };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q = "" } = await searchParams;
  const rows = await searchCustomers(q);
  return (
    <div className="flex flex-col gap-5">
      <PageHead title="Clientes" sub={q ? `${rows.length} resultado(s) para “${q}”` : "As clientes com marcações mais recentes aparecem primeiro."} />
      <form role="search" className="flex gap-2">
        <label htmlFor="q" className="sr-only">Pesquisar</label>
        <input id="q" name="q" defaultValue={q} placeholder="Pesquisar nome, telemóvel ou email" className="field h-12 flex-1 text-base" />
        <button className="btn-outline h-12 px-5">Pesquisar</button>
      </form>
      <Card>
        {rows.length === 0 ? <Empty>Sem clientes{q ? " com essa pesquisa" : " ainda"}.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
              <thead><tr className="text-left text-[11px] tracking-[0.12em] text-ink-muted">
                {["CLIENTE", "TELEMÓVEL", "VISITAS", "ÚLTIMA VISITA", "GASTO", "PRÓXIMA"].map((h, i) => <th key={h} scope="col" className={`border-b border-line px-4 py-3 font-bold ${i === 2 || i === 4 ? "text-right" : ""}`}>{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-brand-soft">
                    <td className="border-b border-[#F2F2F2] px-4 py-3"><Link href={`/admin/clientes/${c.id}`} className="font-semibold underline-offset-2 hover:underline">{c.name}</Link><span className="block text-xs text-ink-muted">{c.email ?? ""}</span></td>
                    <td className="whitespace-nowrap border-b border-[#F2F2F2] px-4 py-3">{prettyPhone(c.phone)}</td>
                    <td className="border-b border-[#F2F2F2] px-4 py-3 text-right tabular-nums">{c.visits}</td>
                    <td className="whitespace-nowrap border-b border-[#F2F2F2] px-4 py-3">{c.last ? shortDate(dateKey(c.last)) : "—"}</td>
                    <td className="border-b border-[#F2F2F2] px-4 py-3 text-right font-semibold tabular-nums">{euro(c.spent)}</td>
                    <td className="whitespace-nowrap border-b border-[#F2F2F2] px-4 py-3">{c.next ? `${shortDate(dateKey(c.next)).replace(/ \d{4}$/, "")}, ${timeOf(c.next)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
