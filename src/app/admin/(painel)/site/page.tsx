/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { dateKey, hhmm, shortDate, DIAS } from "@/lib/time";
import { Card, Flash, PageHead, Switch } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { addGallery, closedDay, editGallery, review, saveHours, saveInfo, saveTexts, uploadSlot } from "./actions";

export const metadata = { title: "O Meu Site" };
const t = (m: number) => hhmm(m).padStart(5, "0");

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const [s, gallery, hours, closed, reviews] = await Promise.all([
    getSettings(),
    db.select().from(schema.galleryPhotos).orderBy(asc(schema.galleryPhotos.sortOrder), asc(schema.galleryPhotos.createdAt)),
    db.select().from(schema.businessHours).orderBy(asc(schema.businessHours.weekday)),
    db.select().from(schema.closedDays).orderBy(asc(schema.closedDays.date)),
    db.select().from(schema.reviews).orderBy(desc(schema.reviews.date)),
  ]);
  const H = (w: number) => hours.find((h) => h.weekday === w) ?? { weekday: w, open: w !== 6, startMin: 540, endMin: 1140 };
  const slots = [
    ["logo", "Logótipo", "Topo e rodapé (PNG com fundo transparente)", s.logoUrl],
    ["hero", "Foto principal", "Topo do site, ao lado do título", s.heroPhotoUrl],
    ["about", "Foto do salão", "Secção “Sobre nós”", s.aboutPhotoUrl],
    ["promo", "Foto da promoção", "Faixa escura da oferta", s.promoPhotoUrl],
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <PageHead title="O Meu Site" sub={<>Logótipo, fotos, contactos, horário e opiniões. Serviços, preços e equipa estão em <Link href="/admin/servicos" className="underline">Serviços e Equipa</Link>.</>}
        actions={<Link href="/" target="_blank" className="btn-outline h-11 px-4">Ver site</Link>} />
      <Flash ok={sp.ok} error={sp.erro} />

      <Card title="Fotos do site">
        <div id="fotos" className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {slots.map(([key, label, where, url]) => (
            <div key={key} className="overflow-hidden rounded-card border border-line">
              {url ? <img src={url} alt={label} className={`h-36 w-full ${key === "logo" ? "object-contain bg-[#F7F7F7] p-4" : "object-cover"}`} /> : <div className="ph grid h-36 place-items-center bg-[#E0E0E0] text-xs font-bold text-[#555]">SEM FOTO</div>}
              <div className="p-3.5">
                <b className="block text-sm">{label}</b><span className="block text-xs text-ink-muted">{where}</span>
                <form action={uploadSlot} className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="slot" value={key} />
                  <label className="sr-only" htmlFor={`f-${key}`}>Escolher foto para {label}</label>
                  <input id={`f-${key}`} type="file" name="file" accept="image/jpeg,image/png,image/webp" className="text-xs" required />
                  <SubmitButton className="btn-outline h-10 px-3 text-[11px]" pendingText="A enviar…">Trocar foto</SubmitButton>
                </form>
                {url && <form action={uploadSlot}><input type="hidden" name="slot" value={key} /><input type="hidden" name="remove" value="1" /><button className="mt-2 text-xs font-bold text-bad-fg underline">Remover</button></form>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Galeria de trabalhos" action={<span className="text-xs text-ink-muted">{gallery.length} fotos · passam sozinhas no site</span>}>
        <div id="galeria" className="p-5">
          <form action={addGallery} className="mb-5 flex flex-wrap items-end gap-3 rounded-card bg-brand-soft p-4">
            <div><label className="label" htmlFor="g-files">Fotos (pode escolher várias)</label><input id="g-files" type="file" name="files" accept="image/jpeg,image/png,image/webp" multiple required className="text-sm" /></div>
            <div><label className="label" htmlFor="g-label">Legenda (opcional)</label><input id="g-label" name="label" placeholder="ex.: Francesinha" className="field w-48" /></div>
            <SubmitButton className="btn-primary h-11 px-5" pendingText="A enviar…">Adicionar fotos</SubmitButton>
          </form>
          {gallery.length === 0 ? <p className="text-sm text-ink-muted">Ainda sem fotos — o site mostra quadrados cinzentos até adicionar.</p> : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {gallery.map((g) => (
                <li key={g.id} className="overflow-hidden rounded-card border border-line">
                  <img src={g.url} alt={g.alt} className="aspect-square w-full object-cover" />
                  <form action={editGallery} className="flex flex-col gap-1.5 p-2">
                    <input type="hidden" name="id" value={g.id} />
                    <label className="sr-only" htmlFor={`gl-${g.id}`}>Legenda</label>
                    <input id={`gl-${g.id}`} name="label" defaultValue={g.label} placeholder="Legenda" className="field h-9 text-xs" />
                    <div className="grid grid-cols-4 gap-1">
                      <button name="action" value="left" aria-label="Mover para a esquerda" className="h-9 rounded-btn border border-line">‹</button>
                      <button name="action" value="save" className="col-span-2 h-9 rounded-btn border border-line text-[11px] font-bold">Guardar</button>
                      <button name="action" value="right" aria-label="Mover para a direita" className="h-9 rounded-btn border border-line">›</button>
                    </div>
                    <button name="action" value="delete" className="h-8 text-[11px] font-bold text-bad-fg underline">Remover</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Contactos e morada">
          <form id="contactos" action={saveInfo} className="grid gap-3.5 p-5 sm:grid-cols-2">
            {([["salonName", "Nome do salão", s.salonName], ["phone", "Telefone", s.phone], ["address", "Morada", s.address], ["whatsapp", "WhatsApp", s.whatsapp], ["postalCode", "Código postal", s.postalCode], ["city", "Localidade", s.city], ["email", "Email", s.email], ["instagram", "Instagram", s.instagram]] as const).map(([k, l, v]) => (
              <div key={k}><label className="label" htmlFor={`i-${k}`}>{l}</label><input id={`i-${k}`} name={k} defaultValue={v} className="field" /></div>
            ))}
            <p className="text-xs text-ink-muted sm:col-span-2">O número do WhatsApp é o que o botão “Falar no WhatsApp” do site usa.</p>
            <div className="sm:col-span-2"><SubmitButton className="btn-primary h-11 px-6">Guardar contactos</SubmitButton></div>
          </form>
        </Card>

        <Card title="Textos principais">
          <form id="textos" action={saveTexts} className="flex flex-col gap-3.5 p-5">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="t1">Título</label><input id="t1" name="heroTitle" defaultValue={s.heroTitle} className="field" /></div>
              <div><label className="label" htmlFor="t2">Título (2.ª linha, itálico)</label><input id="t2" name="heroTitleAccent" defaultValue={s.heroTitleAccent} className="field" /></div>
            </div>
            <div><label className="label" htmlFor="t3">Frase por baixo do título</label><textarea id="t3" name="heroSubtitle" rows={2} defaultValue={s.heroSubtitle} className="field h-auto py-2" /></div>
            <div><label className="label" htmlFor="t4">Texto “Sobre nós”</label><textarea id="t4" name="aboutText" rows={3} defaultValue={s.aboutText} className="field h-auto py-2" /></div>
            <div className="border-t border-[#F0F0F0] pt-1"><Switch name="promoActive" defaultChecked={s.promoActive} label="Faixa de promoção" hint="A faixa escura com a oferta." /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label" htmlFor="t5">Título</label><input id="t5" name="promoTitle" defaultValue={s.promoTitle} className="field" /></div>
              <div><label className="label" htmlFor="t6">Valor</label><input id="t6" name="promoValue" defaultValue={s.promoValue} className="field" /></div>
              <div><label className="label" htmlFor="t7">Frase</label><input id="t7" name="promoText" defaultValue={s.promoText} className="field" /></div>
            </div>
            <SubmitButton className="btn-primary h-11 self-start px-6">Guardar textos</SubmitButton>
          </form>
        </Card>
      </div>

      <Card title="Horário do salão">
        <div id="horario" className="grid gap-6 p-5 lg:grid-cols-2">
          <form action={saveHours} className="flex flex-col">
            {Array.from({ length: 7 }, (_, w) => { const h = H(w); return (
              <div key={w} className="flex flex-wrap items-center gap-3 border-b border-[#F2F2F2] py-2.5">
                <label className="flex w-36 items-center gap-2.5 text-sm font-semibold"><input type="checkbox" name={`open-${w}`} defaultChecked={h.open} className="h-5 w-5 accent-[#6B6B6B]" />{DIAS[w].replace(/^./, (c) => c.toUpperCase())}</label>
                <label className="sr-only" htmlFor={`hs-${w}`}>Abre</label><input id={`hs-${w}`} type="time" name={`start-${w}`} defaultValue={t(h.startMin)} className="field h-10 w-28" />
                <span className="text-sm text-ink-muted">às</span>
                <label className="sr-only" htmlFor={`he-${w}`}>Fecha</label><input id={`he-${w}`} type="time" name={`end-${w}`} defaultValue={t(h.endMin)} className="field h-10 w-28" />
              </div>
            ); })}
            <p className="mt-2 text-xs text-ink-muted">Desmarque o dia para o salão estar fechado. As horas de cada técnica estão em Serviços e Equipa.</p>
            <SubmitButton className="btn-primary mt-3 h-11 self-start px-6">Guardar horário</SubmitButton>
          </form>
          <div>
            <h3 className="text-sm font-bold">Dias fechados (feriados, férias)</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {closed.map((c) => (
                <li key={c.id}><form action={closedDay} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#F2F2F2] pl-3.5 pr-1 text-[13px]">
                  <input type="hidden" name="id" value={c.id} />{shortDate(c.date)} · {c.label}
                  <button aria-label={`Remover ${c.label}`} className="grid h-7 w-7 place-items-center rounded-full text-base hover:bg-white">×</button></form></li>
              ))}
              {closed.length === 0 && <li className="text-sm text-ink-muted">Nenhum.</li>}
            </ul>
            <form action={closedDay} className="mt-4 flex flex-wrap items-end gap-2.5">
              <div><label className="label" htmlFor="cd-date">Dia</label><input id="cd-date" type="date" name="date" required className="field w-auto" /></div>
              <div><label className="label" htmlFor="cd-label">Motivo</label><input id="cd-label" name="label" placeholder="Feriado" className="field w-40" /></div>
              <SubmitButton className="btn-outline h-11 px-4">Adicionar</SubmitButton>
            </form>
          </div>
        </div>
      </Card>

      <Card title="Opiniões de clientes" action={<span className="text-xs text-ink-muted">As mais recentes aparecem primeiro</span>}>
        <div id="opinioes" className="p-5">
          <p className="mb-4 text-[13px] text-ink-muted">Peça autorização à cliente antes de publicar a opinião dela.</p>
          <ul className="divide-y divide-[#F2F2F2]">
            {reviews.map((r) => (
              <li key={r.id} className={`flex flex-wrap items-start gap-3 py-3 ${r.visible ? "" : "opacity-50"}`}>
                <div className="min-w-0 flex-1"><b className="text-sm">{r.name}</b> <span className="text-[13px] text-ink-muted">· {r.city} · {shortDate(dateKey(r.date))}</span><p className="mt-0.5 text-[13px] text-[#333]">“{r.text}”</p></div>
                <form action={review} className="flex gap-3"><input type="hidden" name="id" value={r.id} />
                  <button name="action" value="toggle" className="text-xs font-bold underline">{r.visible ? "Esconder" : "Mostrar"}</button>
                  <button name="action" value="delete" className="text-xs font-bold text-bad-fg underline">Apagar</button></form>
              </li>
            ))}
          </ul>
          <form action={review} className="mt-4 grid gap-3 rounded-card bg-brand-soft p-4 sm:grid-cols-3">
            <input type="hidden" name="action" value="add" />
            <div><label className="label" htmlFor="r-name">Nome</label><input id="r-name" name="name" placeholder="ex.: Ana P." className="field" required /></div>
            <div><label className="label" htmlFor="r-city">Localidade</label><input id="r-city" name="city" placeholder="ex.: Lisboa" className="field" /></div>
            <div><label className="label" htmlFor="r-date">Data</label><input id="r-date" name="date" type="date" defaultValue={dateKey(new Date())} className="field" /></div>
            <div className="sm:col-span-3"><label className="label" htmlFor="r-text">O que a cliente disse</label><textarea id="r-text" name="text" rows={2} className="field h-auto py-2" required /></div>
            <div className="sm:col-span-3"><SubmitButton className="btn-primary h-11 px-6">Adicionar opinião</SubmitButton></div>
          </form>
        </div>
      </Card>
    </div>
  );
}
