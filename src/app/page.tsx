import Link from "next/link";
import { getPublicDataCached } from "@/lib/public-data";
import { euro } from "@/lib/money";
import { DIAS, MESES, shortDate, dateKey, weekdayOf } from "@/lib/time";
import { fmtVagaShort } from "@/lib/vagas";
import { zonedToUtc } from "@/lib/time";
import { waNumber } from "@/lib/phone";
import { Header, Logo } from "@/components/site/Header";
import { Photo } from "@/components/site/Photo";
import { Gallery } from "@/components/site/Gallery";
import { Testimonials } from "@/components/site/Testimonials";
import { FeedbackForm } from "@/components/site/FeedbackForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { settings: s, services, gallery, reviews, hours, vagas, taken } = await getPublicDataCached();
  void hours;
  const now = new Date(), today = dateKey(now);
  // Vagas livres (não passadas e não ocupadas), agrupadas por dia — no máximo 8 dias.
  const busy = taken.map((t) => [new Date(t.startAt).getTime(), new Date(t.endAt).getTime()] as const);
  const freeVagas = vagas.filter((v) => {
    const at = zonedToUtc(v.date, v.startMin).getTime();
    return at > now.getTime() + 30 * 60_000 && !busy.some(([a, b]) => at >= a && at < b);
  });
  const nextDays = [...new Set(freeVagas.map((v) => v.date))].slice(0, 8).map((date) => ({ date, times: freeVagas.filter((v) => v.date === date).map((v) => v.startMin) }));
  const main = services.filter((x) => !x.isAddOn);
  const addOns = services.filter((x) => x.isAddOn);
  const wa = `https://wa.me/${waNumber(s.whatsapp)}?text=${encodeURIComponent("Olá Matilde! Tenho uma dúvida sobre uma marcação.")}`;
  const ig = s.instagram ? `https://instagram.com/${s.instagram.replace(/^@/, "")}` : null;
  const tt = s.tiktok ? `https://www.tiktok.com/@${s.tiktok.replace(/^@/, "")}` : null;
  const where = [s.address, [s.postalCode, s.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const heroPhoto = s.heroPhotoUrl || gallery[0]?.url || null;
  const jsonLd = {
    "@context": "https://schema.org", "@type": "NailSalon", name: s.salonName, telephone: s.phone, email: s.email || undefined,
    address: { "@type": "PostalAddress", streetAddress: s.address || undefined, postalCode: s.postalCode || undefined, addressLocality: s.city, addressCountry: "PT" },
    url: process.env.NEXT_PUBLIC_SITE_URL, sameAs: [ig, tt].filter(Boolean),
  };

  return (
    <div className="bg-night text-cream">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header name={s.salonName} logoUrl={s.logoUrl} />
      <main>
        {/* TOPO */}
        <section className="relative flex min-h-[640px] items-end md:min-h-[86vh] md:items-center">
          <Photo src={heroPhoto} alt={`Unhas feitas por ${s.salonName}`} eager className="absolute inset-0 h-full w-full md:left-auto md:w-[52%]" />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(19,16,16,.55)_0%,rgba(19,16,16,.15)_35%,rgba(19,16,16,.85)_100%)] md:bg-[linear-gradient(90deg,#131010_0%,#131010_48%,rgba(19,16,16,.2)_70%,rgba(19,16,16,0)_100%)]" />
          <div className="relative mx-auto w-full max-w-page px-5 pb-10 md:px-12 md:pb-0 md:self-center">
            <p className="text-[11px] uppercase tracking-[0.32em] text-brand md:text-xs">Nail designer · {s.city}</p>
            <h1 className="mt-4 font-serif text-[52px] font-normal leading-[0.98] md:text-[96px]">
              {s.heroTitle}<br /><em className="text-brand">{s.heroTitleAccent}</em>
            </h1>
            <p className="mt-5 max-w-[460px] text-[16px] font-light leading-relaxed text-cream-soft md:text-[18px]">{s.heroSubtitle}</p>
            <div className="mt-8 flex gap-2.5 sm:max-w-[460px]">
              <Link href="/marcar" className="inline-flex h-14 flex-1 items-center justify-center bg-brand text-[13px] font-semibold uppercase tracking-[0.16em] text-night hover:brightness-105">Marcar online</Link>
              {s.whatsappButton && <a href={wa} target="_blank" rel="noopener" className="inline-flex h-14 w-[132px] items-center justify-center border border-cream/40 text-[13px] uppercase tracking-[0.12em] hover:border-brand">WhatsApp</a>}
            </div>
          </div>
        </section>

        {/* VAGAS */}
        <section id="horario" className="scroll-mt-20 px-5 py-16 md:px-12 md:py-24">
          <div className="mx-auto max-w-page">
            <h2 className="font-serif text-[34px] font-normal md:text-[52px]">Horário semanal</h2>
            <p className="mt-3 max-w-[460px] text-[15px] font-light leading-relaxed text-night-muted">Estudo durante a semana, por isso abro vagas semana a semana. Toque numa hora para marcar.</p>
            {nextDays.length > 0 ? (
              <ul className="mt-8 flex flex-col">
                {nextDays.map((d) => (
                  <li key={d.date} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-night-line py-5 last:border-b">
                    <span className="flex items-baseline gap-3">
                      <span className="font-serif text-[30px] leading-none">{Number(d.date.slice(8))}</span>
                      <span className="text-[13px] uppercase tracking-[0.2em] text-cream-soft">{d.date === today ? "Hoje" : DIAS[weekdayOf(d.date)].split("-")[0]} · {MESES[Number(d.date.slice(5, 7)) - 1].slice(0, 3)}</span>
                    </span>
                    <span className="flex flex-wrap gap-2">
                      {d.times.map((m) => (
                        <Link key={m} href={`/marcar?dia=${d.date}&hora=${m}`} className="inline-flex h-11 min-w-[76px] items-center justify-center border border-brand/60 px-4 text-[15px] text-cream hover:bg-brand hover:text-night">{fmtVagaShort(m)}</Link>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-8 border border-night-line px-6 py-8">
                <p className="font-serif text-[24px]">Novas vagas em breve.</p>
                <p className="mt-2 text-[15px] font-light text-night-muted">As vagas da próxima semana saem ao sábado. Pode também falar comigo pelo WhatsApp.</p>
                {s.whatsappButton && <a href={wa} target="_blank" rel="noopener" className="mt-5 inline-flex h-12 items-center border border-cream/40 px-6 text-[13px] uppercase tracking-[0.12em] hover:border-brand">WhatsApp</a>}
              </div>
            )}
          </div>
        </section>

        {/* PREÇOS */}
        <section id="menu" className="scroll-mt-20 px-5 py-16 md:px-12 md:py-24">
          <div className="mx-auto grid max-w-page gap-10 md:grid-cols-[1fr_1.4fr] md:gap-20">
            <div>
              <h2 className="font-serif text-[34px] font-normal md:text-[52px]">Serviços</h2>
              <p className="mt-4 max-w-[360px] text-[15px] font-light leading-relaxed text-night-muted">Preços acessíveis, sempre. Tem uma ideia de desenho? Mande a foto pelo WhatsApp e eu digo-lhe quanto fica.</p>
            </div>
            <ul className="border-b border-night-line">
              {[...main, ...addOns].map((sv) => (
                <li key={sv.id}>
                  <Link href={`/marcar?servico=${sv.id}`} className="group flex items-baseline gap-3 border-t border-night-line py-5 hover:text-brand">
                    <span className="flex flex-col">
                      <span className="text-[18px]">{sv.name}</span>
                      <span className="mt-1 text-[13px] font-light text-night-muted">{sv.description}{sv.isAddOn ? "" : ` · ${durationLabel(sv.durationMin)}`}</span>
                    </span>
                    <span aria-hidden="true" className="mb-1.5 flex-1 border-b border-dotted border-night-line" />
                    <span className="whitespace-nowrap font-serif text-[20px] text-brand">{sv.isAddOn && sv.priceCents > 0 ? "+ " : ""}{euro(sv.priceCents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* PROMOÇÃO */}
        {s.promoActive && (
          <section className="px-5 md:px-12">
            <div className="mx-auto flex max-w-page flex-col gap-4 border border-brand/50 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-12">
              <div>
                <p className="font-serif text-xl text-cream-soft">{s.promoTitle}</p>
                <p className="font-serif text-[52px] leading-none text-brand">{s.promoValue}</p>
                <p className="mt-2 text-[12px] uppercase tracking-[0.2em] text-night-muted">{s.promoText}</p>
              </div>
              <Link href="/marcar" className="inline-flex h-14 items-center justify-center bg-brand px-8 text-[13px] font-semibold uppercase tracking-[0.16em] text-night">Marcar</Link>
            </div>
          </section>
        )}

        {/* PORTEFÓLIO */}
        {gallery.length > 0 && (
          <section id="portefolio" className="scroll-mt-20 py-16 md:py-24">
            <div className="mx-auto mb-6 flex max-w-page items-end justify-between px-5 md:mb-10 md:px-12">
              <h2 className="font-serif text-[34px] font-normal md:text-[52px]">Clientes</h2>
              {ig && <a href={ig} target="_blank" rel="noopener" className="py-2 text-[13px] tracking-[0.06em] text-brand hover:text-brand-light">{s.instagram} →</a>}
            </div>
            <Gallery items={gallery.map((g) => ({ id: g.id, url: g.url, label: g.label, alt: g.alt }))} />
          </section>
        )}

        {/* FEEDBACKS */}
        <section id="opinioes" className="scroll-mt-20 py-16 md:py-24">
          <div className="mx-auto max-w-page px-5 md:px-12">
            <h2 className="mb-8 font-serif text-[34px] font-normal md:text-[52px]">Feedbacks</h2>
          </div>
          {reviews.length > 0
            ? <Testimonials items={reviews.map((r) => ({ id: r.id, name: r.name, city: r.city, text: r.text, rating: r.rating, when: shortDate(dateKey(new Date(r.date))) }))} />
            : <p className="mx-auto max-w-page px-5 text-[15px] font-light text-night-muted md:px-12">Ainda não há feedbacks publicados. Seja a primeira a deixar o seu.</p>}
          <div className="mx-auto max-w-page px-5 md:px-12"><FeedbackForm /></div>
        </section>

      </main>

      {/* RODAPÉ */}
      <footer id="contactos" className="scroll-mt-20 border-t border-night-line px-5 pb-8 pt-12 md:px-12 md:pt-16">
        <div className="mx-auto max-w-page"><div className="grid max-w-[720px] grid-cols-2 gap-x-6 gap-y-10">
          <nav aria-label="Links">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand">Links</p>
            <ul className="flex flex-col gap-2.5 text-[15px] font-light text-cream-soft">
              {[["#", "Início"], ["#horario", "Horário semanal"], ["#menu", "Serviços"], ["#portefolio", "Clientes"], ["#opinioes", "Feedbacks"]].map(([h, l]) => (
                <li key={l}><a href={h} className="hover:text-brand">{l}</a></li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand">Informação</p>
            <ul className="flex flex-col gap-2.5 text-[15px] font-light text-cream-soft">
              <li><address className="not-italic">{where || s.city}</address></li>
              {s.whatsappButton && <li><a href={wa} target="_blank" rel="noopener" className="hover:text-brand">WhatsApp</a></li>}
              {ig && <li><a href={ig} target="_blank" rel="noopener" className="hover:text-brand">Instagram</a></li>}
              {tt && <li><a href={tt} target="_blank" rel="noopener" className="hover:text-brand">TikTok</a></li>}
            </ul>
          </div>
        </div></div>
        <div className="mx-auto mt-12 flex max-w-page flex-wrap items-center justify-between gap-4 border-t border-night-line pt-6 text-[12px] text-night-muted">
          <Logo name={s.salonName} logoUrl={s.logoUrl} />
        </div>
      </footer>
    </div>
  );
}

function durationLabel(min: number) {
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h${m ? String(m).padStart(2, "0") : ""}` : `${m} min`;
}
