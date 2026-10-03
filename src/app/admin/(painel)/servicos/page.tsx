import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { euro } from "@/lib/money";
import { Card, Flash, PageHead } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { deleteService, saveService } from "./actions";

export const metadata = { title: "Serviços e preços" };
const CATS = ["Mãos", "Pés", "Extensões", "Extra", "Manicure", "Pedicure"];

type Svc = typeof schema.services.$inferSelect;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const services = await db.select().from(schema.services).orderBy(asc(schema.services.sortOrder), asc(schema.services.name));

  return (
    <div className="flex flex-col gap-6">
      <PageHead title="Serviços e preços" sub="O que mudar aqui aparece logo no site e na marcação online. Preço 0 aparece como «sob consulta»." />
      <Flash ok={sp.ok} error={sp.erro} />

      <Card title="Serviços" action={<span className="text-xs text-ink-muted">{services.length}</span>}>
        <ul className="divide-y divide-[#F2F2F2]">
          {services.map((s) => (
            <li key={s.id}>
              <details className="group">
                <summary className={`flex cursor-pointer list-none items-center gap-3 px-5 py-3.5 hover:bg-brand-soft ${s.active ? "" : "opacity-55"}`}>
                  <span className="min-w-0 flex-1"><b className="block text-sm">{s.name}{s.isAddOn && <span className="ml-2 rounded-btn bg-[#EFEFEF] px-1.5 py-0.5 text-[10px] font-bold tracking-wide">EXTRA</span>}{!s.active && <span className="ml-2 text-[11px] font-semibold text-ink-muted">(escondido)</span>}</b><span className="block truncate text-xs text-ink-muted">{s.category} · {s.description}</span></span>
                  <span className="text-right text-[13px]"><b className="block">{euro(s.priceCents, { plus: s.isAddOn })}</b><span className="text-xs text-ink-muted">{s.durationMin} min</span></span>
                  <span className="text-xs font-semibold text-brand-text underline">Editar</span>
                </summary>
                <ServiceForm s={s} />
              </details>
            </li>
          ))}
        </ul>
        <details className="border-t border-line">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-bold">+ Novo serviço</summary>
          <ServiceForm />
        </details>
      </Card>

    </div>
  );
}

function ServiceForm({ s }: { s?: Svc }) {
  const k = s?.id ?? "new";
  return (
    <div className="border-t border-[#F2F2F2] bg-[#FCFCFC] px-5 py-5">
      <form action={saveService} className="grid gap-3.5 sm:grid-cols-2">
        {s && <input type="hidden" name="id" value={s.id} />}
        <div className="sm:col-span-2"><label className="label" htmlFor={`n-${k}`}>Nome</label><input id={`n-${k}`} name="name" defaultValue={s?.name} className="field" required /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor={`d-${k}`}>Descrição curta (aparece no site)</label><input id={`d-${k}`} name="description" defaultValue={s?.description} className="field" maxLength={140} /></div>
        <div><label className="label" htmlFor={`c-${k}`}>Categoria</label><select id={`c-${k}`} name="category" defaultValue={s?.category ?? "Mãos"} className="field">{CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor={`p-${k}`}>Preço (€)</label><input id={`p-${k}`} name="price" inputMode="decimal" defaultValue={s ? String(s.priceCents / 100).replace(".", ",") : ""} className="field" required /></div>
          <div><label className="label" htmlFor={`m-${k}`}>Duração (min)</label><input id={`m-${k}`} name="duration" type="number" min={5} step={5} defaultValue={s?.durationMin ?? 45} className="field" required /></div>
        </div>
        <div><label className="label" htmlFor={`f-${k}`}>Foto do serviço (opcional)</label><input id={`f-${k}`} name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm" /></div>
        <div><label className="label" htmlFor={`o-${k}`}>Ordem no site</label><input id={`o-${k}`} name="sortOrder" type="number" defaultValue={s?.sortOrder ?? 0} className="field" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={s?.active ?? true} className="h-5 w-5 accent-[#6B6B6B]" />Mostrar no site</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isAddOn" defaultChecked={s?.isAddOn ?? false} className="h-5 w-5 accent-[#6B6B6B]" />É um extra (junta-se a outro serviço, ex.: nail art)</label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><SubmitButton className="btn-primary h-11 px-6">{s ? "Guardar" : "Criar serviço"}</SubmitButton></div>
      </form>
      {s && <form action={deleteService} className="mt-3"><input type="hidden" name="id" value={s.id} /><button className="text-xs font-bold text-bad-fg underline">Apagar serviço</button></form>}
    </div>
  );
}
