/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { dateKey, hhmm, shortDate, DIAS } from "@/lib/time";
import { Card, Flash, PageHead, Switch } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { addGallery, editGallery, review, saveInfo, saveTexts, uploadSlot } from "./actions";

export const metadata = { title: "O Meu Site" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const [s, gallery, reviews] = await Promise.all([
    getSettings(),
    db.select().from(schema.galleryPhotos).orderBy(asc(schema.galleryPhotos.sortOrder), asc(schema.galleryPhotos.createdAt)),
    db.select().from(schema.reviews).orderBy(desc(schema.reviews.date)),
  ]);
  const slots = [
    ["logo", "Logótipo", "Topo e rodapé (PNG com fundo transparente)", s.logoUrl],
    ["hero", "Foto principal", "Topo do site, ao lado do título", s.heroPhotoUrl],
    ["promo", "Foto da promoção", "Faixa escura da oferta", s.promoPhotoUrl],
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <PageHead title="O Meu Site" sub={<>Logótipo, fotos, contactos, horário e opiniões. Serviços e preços estão em <Link href="/admin/servicos" className="underline">Serviços e preços</Link>.</>}
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
                      <button name="op" value="left" aria-label="Mover para a esquerda" className="h-9 rounded-btn border border-line">‹</button>
                      <button name="op" value="save" className="col-span-2 h-9 rounded-btn border border-line text-[11px] font-bold">Guardar</button>
                      <button name="op" value="right" aria-label="Mover para a direita" className="h-9 rounded-btn border border-line">›</button>
                    </div>
                    <button name="op" value="delete" className="h-8 text-[11px] font-bold text-bad-fg underline">Remover</button>
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
            {([["salonName", "Nome do salão", s.salonName], ["phone", "Telefone", s.phone], ["address", "Morada", s.address], ["whatsapp", "WhatsApp", s.whatsapp], ["postalCode", "Código postal", s.postalCode], ["city", "Localidade", s.city], ["email", "Email", s.email], ["instagram", "Instagram", s.instagram], ["tiktok", "TikTok", s.tiktok]] as const).map(([k, l, v]) => (
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
              <div><label className="label" htmlFor="t2">Título (2.ª linha, a dourado)</label><input id="t2" name="heroTitleAccent" defaultValue={s.heroTitleAccent} className="field" /></div>
            </div>
            <div><label className="label" htmlFor="t3">Frase por baixo do título</label><textarea id="t3" name="heroSubtitle" rows={2} defaultValue={s.heroSubtitle} className="field h-auto py-2" /></div>
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

      <Card title="Horário">
        <div id="horario" className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
          <span className="text-ink-muted">As horas para marcar publicam-se semana a semana em <b className="text-ink">Horário semanal</b>.</span>
          <Link href="/admin/horario" className="btn-outline h-10 px-4">Abrir horário semanal</Link>
        </div>
      </Card>

      <Card title="Feedbacks" action={<span className="text-xs text-ink-muted">Os mais recentes aparecem primeiro</span>}>
        <div id="opinioes" className="p-5">
          <p className="mb-4 text-[13px] text-ink-muted">As clientes deixam o feedback no site. Fica escondido até carregar em «Publicar».</p>
          <ul className="divide-y divide-[#F2F2F2]">
            {reviews.length === 0 && <li className="py-3 text-sm text-ink-muted">Ainda não há feedbacks.</li>}
            {reviews.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start gap-3 py-3">
                <div className="min-w-0 flex-1"><b className="text-sm">{r.name}</b> <span className="text-[13px] text-brand-text" aria-label={`${r.rating} de 5 estrelas`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>{!r.visible && <span className="ml-2 rounded-full bg-warn-bg px-2 py-0.5 text-[10px] font-bold text-warn-fg">POR PUBLICAR</span>} <span className="text-[13px] text-ink-muted">· {[r.city, shortDate(dateKey(r.date))].filter(Boolean).join(" · ")}</span><p className="mt-0.5 text-[13px] text-[#333]">“{r.text}”</p></div>
                <span className="flex gap-3">
                  <form action={review}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="op" value="toggle" /><button className="text-xs font-bold underline">{r.visible ? "Esconder" : "Publicar"}</button></form>
                  <form action={review}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="op" value="delete" /><button className="text-xs font-bold text-bad-fg underline">Apagar</button></form>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
