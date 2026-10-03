import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { dateKey, shortDate, timeOf } from "@/lib/time";
import { euro } from "@/lib/money";
import { normalizePhone, prettyPhone, waNumber } from "@/lib/phone";
import { Card, Flash, PageHead, StatusPill } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { IconPhone, IconWhatsApp } from "@/components/icons";

export const metadata = { title: "Cliente" };

async function save(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id"));
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (!phone) redirect(`/admin/clientes/${id}?erro=${encodeURIComponent("Telemóvel inválido.")}`);
  try {
    await db.update(schema.customers).set({
      name: String(formData.get("name") ?? "").trim().slice(0, 80), phone: phone!,
      email: String(formData.get("email") ?? "").trim() || null, notes: String(formData.get("notes") ?? "").slice(0, 2000) || null,
    }).where(eq(schema.customers.id, id));
  } catch {
    redirect(`/admin/clientes/${id}?erro=${encodeURIComponent("Já existe outra cliente com esse telemóvel.")}`);
  }
  redirect(`/admin/clientes/${id}?ok=1`);
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const c = await db.query.customers.findFirst({ where: eq(schema.customers.id, id) });
  if (!c) notFound();
  const history = await db.query.appointments.findMany({ where: eq(schema.appointments.customerId, id), with: { service: true, staff: true, addOn: true }, orderBy: [desc(schema.appointments.startAt)] });
  const done = history.filter((a) => a.status === "COMPLETED");
  const next = [...history].reverse().find((a) => a.startAt > new Date() && (a.status === "CONFIRMED" || a.status === "PENDING"));
  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <Link href="/admin/clientes" className="text-sm underline">← Clientes</Link>
      <PageHead title={c.name} sub={`Cliente desde ${shortDate(dateKey(c.createdAt))}`} actions={<Link href={`/admin/marcacoes/nova`} className="btn-primary h-11 px-4">Marcar</Link>} />
      <Flash ok={sp.ok ? "Guardado." : undefined} error={sp.erro} />
      <div className="grid grid-cols-2 gap-2.5 sm:max-w-md">
        <a href={`tel:${c.phone}`} className="btn-outline h-11"><IconPhone size={16} />Ligar</a>
        <a href={`https://wa.me/${waNumber(c.phone)}`} target="_blank" rel="noopener" className="btn-outline h-11"><IconWhatsApp size={16} />WhatsApp</a>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Total gasto", euro(done.reduce((s, a) => s + a.priceCents, 0))], ["Visitas", String(done.length)], ["Última visita", done[0] ? shortDate(dateKey(done[0].startAt)) : "—"], ["Próxima", next ? `${shortDate(dateKey(next.startAt)).replace(/ \d{4}$/, "")}, ${timeOf(next.startAt)}` : "—"]].map(([k, v]) => (
          <div key={k} className="card px-4 py-3"><p className="text-xs text-ink-muted">{k}</p><p className="mt-1 font-serif text-xl">{v}</p></div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Dados e notas">
          <form action={save} className="flex flex-col gap-3 p-5">
            <input type="hidden" name="id" value={c.id} />
            <div><label className="label" htmlFor="c-name">Nome</label><input id="c-name" name="name" defaultValue={c.name} className="field" required /></div>
            <div><label className="label" htmlFor="c-phone">Telemóvel</label><input id="c-phone" name="phone" defaultValue={prettyPhone(c.phone)} className="field" required /></div>
            <div><label className="label" htmlFor="c-email">Email</label><input id="c-email" name="email" type="email" defaultValue={c.email ?? ""} className="field" /></div>
            <div><label className="label" htmlFor="c-notes">Notas (preferências, alergias…)</label><textarea id="c-notes" name="notes" rows={4} defaultValue={c.notes ?? ""} className="field h-auto py-2" /></div>
            <SubmitButton className="btn-primary h-11 self-start px-5">Guardar</SubmitButton>
          </form>
        </Card>
        <Card title="Histórico de marcações">
          <ul className="divide-y divide-[#F2F2F2]">
            {history.length === 0 && <li className="px-5 py-6 text-sm text-ink-muted">Sem marcações.</li>}
            {history.map((a) => (
              <li key={a.id}><Link href={`/admin/marcacoes/${a.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-[13px] hover:bg-brand-soft">
                <span><b className="block">{a.service.name}{a.addOn ? " + " + a.addOn.name : ""}</b><span className="text-ink-muted">{shortDate(dateKey(a.startAt))}, {timeOf(a.startAt)} · {a.staff.name.split(" ")[0]}</span></span>
                <span className="flex flex-col items-end gap-1"><b>{euro(a.priceCents)}</b><StatusPill status={a.status} /></span>
              </Link></li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
