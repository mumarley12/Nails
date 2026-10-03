import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { euro } from "@/lib/money";
import { hhmm } from "@/lib/time";
import { Card, Flash, PageHead } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { deleteService, deleteStaff, saveService, saveStaff } from "./actions";

export const metadata = { title: "Serviços e Equipa" };
const CATS = ["Manicure", "Pedicure", "Extensões", "Pestanas", "Extra"];
const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

type Svc = typeof schema.services.$inferSelect;
type Stf = typeof schema.staff.$inferSelect;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const [services, staff, links] = await Promise.all([
    db.select().from(schema.services).orderBy(asc(schema.services.sortOrder), asc(schema.services.name)),
    db.select().from(schema.staff).orderBy(asc(schema.staff.sortOrder)),
    db.select().from(schema.serviceStaff),
  ]);
  const staffOf = (sid: string) => links.filter((l) => l.serviceId === sid).map((l) => l.staffId);
  const svcOf = (pid: string) => links.filter((l) => l.staffId === pid).map((l) => l.serviceId);

  return (
    <div className="flex flex-col gap-6">
      <PageHead title="Serviços e Equipa" sub="O que mudar aqui aparece logo no site e na marcação online. Os preços são sempre lidos daqui." />
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
                <ServiceForm s={s} staff={staff} chosen={staffOf(s.id)} />
              </details>
            </li>
          ))}
        </ul>
        <details className="border-t border-line">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-bold">+ Novo serviço</summary>
          <ServiceForm staff={staff} chosen={staff.map((p) => p.id)} />
        </details>
      </Card>

      <Card title="Equipa" action={<span className="text-xs text-ink-muted">{staff.length}</span>}>
        <ul className="divide-y divide-[#F2F2F2]">
          {staff.map((p) => (
            <li key={p.id}>
              <details>
                <summary className={`flex cursor-pointer list-none items-center gap-3 px-5 py-3.5 hover:bg-brand-soft ${p.active ? "" : "opacity-55"}`}>
                  {p.photoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={p.photoUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                    : <span className="grid h-11 w-11 place-items-center rounded-full bg-[#D3D3D3] font-serif text-lg">{p.name.charAt(0)}</span>}
                  <span className="min-w-0 flex-1"><b className="block text-sm">{p.name}{!p.active && <span className="ml-2 text-[11px] font-semibold text-ink-muted">(inativa)</span>}</b>
                    <span className="block truncate text-xs text-ink-muted">{p.workDays.sort().map((d) => DAYS[d]).join(", ") || "Sem dias"} · {hhmm(p.startMin)}–{hhmm(p.endMin)}{p.absenceNote ? ` · ${p.absenceNote}` : ""}</span></span>
                  <span className="text-xs font-semibold text-brand-text underline">Editar</span>
                </summary>
                <StaffForm p={p} services={services} chosen={svcOf(p.id)} />
              </details>
            </li>
          ))}
        </ul>
        <details className="border-t border-line">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-bold">+ Nova técnica</summary>
          <StaffForm services={services} chosen={[]} />
        </details>
      </Card>
    </div>
  );
}

function ServiceForm({ s, staff, chosen }: { s?: Svc; staff: Stf[]; chosen: string[] }) {
  const k = s?.id ?? "new";
  return (
    <div className="border-t border-[#F2F2F2] bg-[#FCFCFC] px-5 py-5">
      <form action={saveService} className="grid gap-3.5 sm:grid-cols-2">
        {s && <input type="hidden" name="id" value={s.id} />}
        <div className="sm:col-span-2"><label className="label" htmlFor={`n-${k}`}>Nome</label><input id={`n-${k}`} name="name" defaultValue={s?.name} className="field" required /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor={`d-${k}`}>Descrição curta (aparece no site)</label><input id={`d-${k}`} name="description" defaultValue={s?.description} className="field" maxLength={140} /></div>
        <div><label className="label" htmlFor={`c-${k}`}>Categoria</label><select id={`c-${k}`} name="category" defaultValue={s?.category ?? "Manicure"} className="field">{CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor={`p-${k}`}>Preço (€)</label><input id={`p-${k}`} name="price" inputMode="decimal" defaultValue={s ? String(s.priceCents / 100).replace(".", ",") : ""} className="field" required /></div>
          <div><label className="label" htmlFor={`m-${k}`}>Duração (min)</label><input id={`m-${k}`} name="duration" type="number" min={5} step={5} defaultValue={s?.durationMin ?? 45} className="field" required /></div>
        </div>
        <fieldset className="sm:col-span-2"><legend className="label">Quem faz este serviço</legend>
          <div className="flex flex-wrap gap-2">{staff.map((p) => (
            <label key={p.id} className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white px-3.5 text-[13px] font-semibold has-[:checked]:border-brand-text has-[:checked]:bg-[#F2F2F2]"><input type="checkbox" name="staff" value={p.id} defaultChecked={chosen.includes(p.id)} className="accent-[#6B6B6B]" />{p.name.split(" ")[0]}</label>
          ))}</div>
        </fieldset>
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

function StaffForm({ p, services, chosen }: { p?: Stf; services: Svc[]; chosen: string[] }) {
  const k = p?.id ?? "new";
  return (
    <div className="border-t border-[#F2F2F2] bg-[#FCFCFC] px-5 py-5">
      <form action={saveStaff} className="grid gap-3.5 sm:grid-cols-2">
        {p && <input type="hidden" name="id" value={p.id} />}
        <div><label className="label" htmlFor={`sn-${k}`}>Nome</label><input id={`sn-${k}`} name="name" defaultValue={p?.name} className="field" required /></div>
        <div><label className="label" htmlFor={`sr-${k}`}>Função</label><input id={`sr-${k}`} name="role" defaultValue={p?.role ?? "Técnica"} className="field" /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor={`st-${k}`}>Especialidades (separadas por vírgulas)</label><input id={`st-${k}`} name="tags" defaultValue={p?.tags.join(", ")} className="field" /></div>
        <fieldset className="sm:col-span-2"><legend className="label">Dias de trabalho</legend>
          <div className="grid grid-cols-7 gap-1.5">{DAYS.map((d, i) => (
            <label key={d} className="flex h-11 cursor-pointer items-center justify-center rounded-[3px] border border-line bg-white text-xs font-bold has-[:checked]:border-brand-text has-[:checked]:bg-[#E9E9E9]"><input type="checkbox" name="days" value={i} defaultChecked={p ? p.workDays.includes(i) : i < 6} className="sr-only" />{d}</label>
          ))}</div>
        </fieldset>
        <div><label className="label" htmlFor={`ss-${k}`}>Entra às</label><input id={`ss-${k}`} name="start" type="time" defaultValue={p ? hhmm(p.startMin).padStart(5, "0") : "09:00"} className="field" required /></div>
        <div><label className="label" htmlFor={`se-${k}`}>Sai às</label><input id={`se-${k}`} name="end" type="time" defaultValue={p ? hhmm(p.endMin).padStart(5, "0") : "19:00"} className="field" required /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor={`sa-${k}`}>Férias ou ausências (nota)</label><input id={`sa-${k}`} name="absence" defaultValue={p?.absenceNote ?? ""} placeholder="ex.: Férias 19–23 out (bloqueie também na Agenda)" className="field" /></div>
        <fieldset className="sm:col-span-2"><legend className="label">Serviços que faz</legend>
          <div className="flex flex-wrap gap-2">{services.map((s) => (
            <label key={s.id} className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white px-3.5 text-[13px] font-semibold has-[:checked]:border-brand-text has-[:checked]:bg-[#F2F2F2]"><input type="checkbox" name="services" value={s.id} defaultChecked={chosen.includes(s.id)} className="accent-[#6B6B6B]" />{s.name}</label>
          ))}</div>
        </fieldset>
        <div><label className="label" htmlFor={`sf-${k}`}>Foto</label><input id={`sf-${k}`} name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm" /></div>
        <div><label className="label" htmlFor={`so-${k}`}>Ordem</label><input id={`so-${k}`} name="sortOrder" type="number" defaultValue={p?.sortOrder ?? 0} className="field" /></div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="active" defaultChecked={p?.active ?? true} className="h-5 w-5 accent-[#6B6B6B]" />Ativa (aceita marcações)</label>
        <div className="sm:col-span-2"><SubmitButton className="btn-primary h-11 px-6">{p ? "Guardar" : "Criar técnica"}</SubmitButton></div>
      </form>
      {p && <form action={deleteStaff} className="mt-3"><input type="hidden" name="id" value={p.id} /><button className="text-xs font-bold text-bad-fg underline">Apagar técnica</button></form>}
    </div>
  );
}
