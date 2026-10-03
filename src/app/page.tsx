import Link from "next/link";
import { getPublicDataCached } from "@/lib/public-data";
import { euro } from "@/lib/money";
import { hhmm, DIAS, shortDate, dateKey } from "@/lib/time";
import { waNumber } from "@/lib/phone";
import { Header, Logo } from "@/components/site/Header";
import { Photo } from "@/components/site/Photo";
import { Gallery } from "@/components/site/Gallery";
import { Testimonials } from "@/components/site/Testimonials";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { settings: s, services, gallery, reviews, hours } = await getPublicDataCached();
  const main = services.filter((x) => !x.isAddOn);
  const addOns = services.filter((x) => x.isAddOn);
  const wa = `https://wa.me/${waNumber(s.whatsapp)}?text=${encodeURIComponent("Olá Matilde! Tenho uma dúvida sobre uma marcação.")}`;
  const tel = `tel:+${waNumber(s.phone)}`;
  const ig = s.instagram ? `https://instagram.com/${s.instagram.replace(/^@/, "")}` : null;
  const tt = s.tiktok ? `https://www.tiktok.com/@${s.tiktok.replace(/^@/, "")}` : null;
  const openDays = hours.filter((h) => h.open);
  const hoursLine = summarizeHours(hours);
  const where = [s.address, [s.postalCode, s.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const heroPhoto = s.heroPhotoUrl || gallery[0]?.url || null;
  const jsonLd = {
    "@context": "https://schema.org", "@type": "NailSalon", name: s.salonName, telephone: s.phone, email: s.email || undefined,
    address: { "@type": "PostalAddress", streetAddress: s.address || undefined, postalCode: s.postalCode || undefined, addressLocality: s.city, addressCountry: "PT" },
    openingHoursSpecification: openDays.map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][h.weekday], opens: pad(h.startMin), closes: pad(h.endMin) })),
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
              {s.heroTitle}<br /><em>{s.heroTitleAccent}</em>
            </h1>
            <p className="mt-5 max-w-[460px] text-[16px] font-light leading-relaxed text-cream-soft md:text-[18px]">{s.heroSubtitle}</p>
            <div className="mt-8 flex gap-2.5 sm:max-w-[460px]">
              <Link href="/marcar" className="inline-flex h-14 flex-1 items-center justify-center bg-brand text-[13px] font-semibold uppercase tracking-[0.16em] text-night hover:brightness-105">Marcar online</Link>
              {s.whatsappButton && <a href={wa} target="_blank" rel="noopener" className="inline-flex h-14 w-[132px] items-center justify-center border border-cream/40 text-[13px] uppercase tracking-[0.12em] hover:border-brand">WhatsApp</a>}
            </div>
          </div>
        </section>

        {/* PORTEFÓLIO */}
        {gallery.length > 0 && (
          <section id="portefolio" className="scroll-mt-20 py-16 md:py-24">
            <div className="mx-auto mb-6 flex max-w-page items-end justify-between px-5 md:mb-10 md:px-12">
              <h2 className="font-serif text-[34px] font-normal md:text-[52px]">Portefólio</h2>
              {ig && <a href={ig} target="_blank" rel="noopener" className="py-2 text-[13px] tracking-[0.06em] text-brand hover:text-brand-light">{s.instagram} →</a>}
            </div>
            <Gallery items={gallery.map((g) => ({ id: g.id, url: g.url, label: g.label, alt: g.alt }))} />
          </section>
        )}

        {/* PREÇOS */}
        <section id="menu" className="scroll-mt-20 px-5 py-16 md:px-12 md:py-24">
          <div className="mx-auto grid max-w-page gap-10 md:grid-cols-[1fr_1.4fr] md:gap-20">
            <div>
              <h2 className="font-serif text-[34px] font-normal md:text-[52px]">Menu</h2>
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
                <p className="font-serif text-xl italic text-cream-soft">{s.promoTitle}</p>
                <p className="font-serif text-[52px] leading-none text-brand">{s.promoValue}</p>
                <p className="mt-2 text-[12px] uppercase tracking-[0.2em] text-night-muted">{s.promoText}</p>
              </div>
              <Link href="/marcar" className="inline-flex h-14 items-center justify-center bg-brand px-8 text-[13px] font-semibold uppercase tracking-[0.16em] text-night">Marcar</Link>
            </div>
          </section>
        )}

        {/* SOBRE */}
        <section id="sobre" className="scroll-mt-20 px-5 py-16 md:px-12 md:py-24">
          <div className="mx-auto grid max-w-page items-center gap-8 md:grid-cols-2 md:gap-20">
            <Photo src={s.aboutPhotoUrl} alt="Trabalho da Matilde" className="h-[260px] w-full md:h-[520px]" />
            <div>
              <h2 className="font-serif text-[34px] font-normal md:text-[52px]">Matilde</h2>
              <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-brand">Nail designer</p>
              <p className="mt-6 whitespace-pre-line text-[16px] font-light leading-relaxed text-cream-soft md:text-[17px]">
                {s.aboutText || "Cada cliente tem a sua hora e a minha atenção toda. Gel, francesinha, nail art e pés — com cuidado, com calma e com preços que dá para manter."}
              </p>
            </div>
          </div>
        </section>

        {/* OPINIÕES */}
        {reviews.length > 0 && (
          <section id="opinioes" className="scroll-mt-20 px-5 py-16 md:px-12 md:py-24">
            <div className="mx-auto max-w-[900px]">
              <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-night-muted">Clientes</p>
              <Testimonials items={reviews.map((r) => ({ id: r.id, name: r.name, city: r.city, text: r.text, when: shortDate(dateKey(new Date(r.date))) }))} />
            </div>
          </section>
        )}

        {/* MARCAR */}
        <section id="contactos" className="scroll-mt-20 border-t border-night-line px-5 pb-10 pt-16 md:px-12 md:pt-24">
          <div className="mx-auto grid max-w-page gap-12 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-[42px] font-normal leading-[1.02] md:text-[64px]">A sua hora<br /><em className="text-brand">está à espera.</em></h2>
              <Link href="/marcar" className="mt-8 inline-flex h-14 w-full items-center justify-center bg-brand text-[13px] font-semibold uppercase tracking-[0.16em] text-night hover:brightness-105 sm:w-auto sm:px-12">Ver horas livres</Link>
            </div>
            <address className="grid gap-6 not-italic text-[15px] font-light text-cream-soft sm:grid-cols-2">
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-night-muted">Onde</p>
                <p>{where || s.city}</p>
              </div>
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-night-muted">Horário</p>
                <p className="whitespace-pre-line">{hoursLine}</p>
              </div>
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-night-muted">Contacto</p>
                <a href={tel} className="block py-1 hover:text-brand">{s.phone}</a>
                {s.whatsappButton && <a href={wa} target="_blank" rel="noopener" className="block py-1 hover:text-brand">WhatsApp</a>}
                {s.email && <a href={`mailto:${s.email}`} className="block py-1 hover:text-brand">{s.email}</a>}
              </div>
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-night-muted">Redes</p>
                {ig && <a href={ig} target="_blank" rel="noopener" className="block py-1 hover:text-brand">Instagram</a>}
                {tt && <a href={tt} target="_blank" rel="noopener" className="block py-1 hover:text-brand">TikTok</a>}
              </div>
            </address>
          </div>
        </section>
      </main>

      <footer className="px-5 pb-8 md:px-12">
        <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-4 border-t border-night-line pt-6 text-[12px] text-night-muted">
          <Logo name={s.salonName} logoUrl={s.logoUrl} />
          <span className="flex flex-wrap gap-5">
            <Link href="/privacidade" className="py-2 hover:text-cream">Privacidade</Link>
            <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noopener" className="py-2 hover:text-cream">Livro de Reclamações</a>
            <span className="py-2">© {new Date().getFullYear()}</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

function durationLabel(min: number) {
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h${m ? String(m).padStart(2, "0") : ""}` : `${m} min`;
}
function pad(m: number) { const h = hhmm(m); return h.length === 4 ? "0" + h : h; }
function summarizeHours(hours: { weekday: number; open: boolean; startMin: number; endMin: number }[]) {
  const S = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const groups: { from: number; to: number; label: string }[] = [];
  for (const h of [...hours].sort((a, b) => a.weekday - b.weekday)) {
    const label = h.open ? `${hhmm(h.startMin).replace(":00", "h")}–${hhmm(h.endMin).replace(":00", "h")}` : "fechado";
    const last = groups.at(-1);
    if (last && last.label === label && last.to === h.weekday - 1) last.to = h.weekday;
    else groups.push({ from: h.weekday, to: h.weekday, label });
  }
  return groups.map((g) => `${g.from === g.to ? S[g.from] : `${S[g.from]}–${S[g.to]}`} ${g.label}`).join("\n") || DIAS.join("");
}
