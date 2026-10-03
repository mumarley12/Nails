import Link from "next/link";
import { getPublicData } from "@/lib/public-data";
import { euro } from "@/lib/money";
import { hhmm, DIAS, shortDate, dateKey } from "@/lib/time";
import { waNumber } from "@/lib/phone";
import { Header, Logo } from "@/components/site/Header";
import { Photo } from "@/components/site/Photo";
import { Gallery } from "@/components/site/Gallery";
import { Testimonials } from "@/components/site/Testimonials";
import { IconAward, IconDrop, IconInstagram, IconPhone, IconPin, IconShield, IconWhatsApp, IconClock } from "@/components/icons";

export const dynamic = "force-dynamic";

const TONES = ["#DADADA", "#D4D4D4", "#D3D3D3", "#DBDBDB", "#DCDCDC", "#D6D6D6"];

export default async function Home() {
  const { settings: s, services, gallery, reviews, hours } = await getPublicData();
  const main = services.filter((x) => !x.isAddOn);
  const addOns = services.filter((x) => x.isAddOn);
  const wa = `https://wa.me/${waNumber(s.whatsapp)}?text=${encodeURIComponent("Olá! Tenho uma dúvida sobre uma marcação.")}`;
  const tel = `tel:+${waNumber(s.phone)}`;
  const openDays = hours.filter((h) => h.open);
  const hoursLine = summarizeHours(hours);
  const jsonLd = {
    "@context": "https://schema.org", "@type": "NailSalon", name: s.salonName, telephone: s.phone, email: s.email,
    address: { "@type": "PostalAddress", streetAddress: s.address, postalCode: s.postalCode, addressLocality: s.city, addressCountry: "PT" },
    openingHoursSpecification: openDays.map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][h.weekday], opens: pad(h.startMin), closes: pad(h.endMin) })),
    url: process.env.NEXT_PUBLIC_SITE_URL,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header name={s.salonName} logoUrl={s.logoUrl} city={s.city} />
      <main>
        {/* HERO */}
        <section id="inicio" className="grid bg-brand-soft lg:grid-cols-2 lg:min-h-[600px]">
          <div className="flex max-w-[660px] flex-col justify-center px-5 pb-0 pt-8 lg:px-16 lg:py-20">
            <p className="eyebrow">Beleza na ponta dos dedos</p>
            <h1 className="mt-3.5 font-serif text-[36px] font-medium leading-[1.08] tracking-[-0.01em] md:text-5xl lg:text-[64px]">
              {s.heroTitle}<br /><em className="text-brand-text">{s.heroTitleAccent}</em>
            </h1>
            <p className="mt-4 max-w-[420px] text-[15px] leading-relaxed text-ink-soft md:text-[17px]">{s.heroSubtitle}</p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
              <Link href="/marcar" className="btn-primary h-[52px] px-7">Fazer marcação</Link>
              <a href="#servicos" className="btn-outline h-[52px] px-7">Os nossos serviços</a>
            </div>
            <ul className="mt-8 hidden gap-6 border-t border-[#DFDFDF] pt-6 text-[13px] font-medium lg:flex">
              <Trust icon={<IconShield size={16} />}>Material Esterilizado</Trust>
              <Trust icon={<IconDrop size={16} />}>Produtos Premium</Trust>
              <Trust icon={<IconAward size={16} />}>Técnicas Experientes</Trust>
            </ul>
          </div>
          <Photo src={s.heroPhotoUrl} alt="Mãos com unhas amendoadas em rosa nude, feitas no salão" label="FOTO PRINCIPAL" eager className="mt-6 h-[300px] w-full lg:mt-0 lg:h-full lg:min-h-[600px]" tone="#D1D1D1" />
          <ul className="grid grid-cols-3 border-b border-line bg-white lg:hidden">
            {[["Material Esterilizado", <IconShield key="a" size={18} />], ["Produtos Premium", <IconDrop key="b" size={18} />], ["Técnicas Experientes", <IconAward key="c" size={18} />]].map(([t, i], k) => (
              <li key={k} className="flex flex-col items-center gap-1.5 border-r border-[#ECECEC] px-1.5 py-3.5 text-center text-[11px] font-semibold last:border-r-0"><span className="text-brand-text">{i}</span>{t}</li>
            ))}
          </ul>
        </section>

        {/* SERVIÇOS */}
        <section id="servicos" className="px-4 py-14 md:px-16 md:py-20">
          <div className="mb-7 text-center md:mb-11"><p className="eyebrow">Os nossos serviços</p><h2 className="h-section mt-2.5">O Cuidado que as Suas Unhas Merecem</h2></div>
          <div className="mx-auto grid max-w-page grid-cols-2 gap-3 md:gap-[18px] lg:grid-cols-3 xl:grid-cols-6">
            {main.map((sv, i) => (
              <Link key={sv.id} href={`/marcar?servico=${sv.id}`} className="group flex flex-col overflow-hidden rounded-card border border-[#E6E6E6] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(22,22,22,.06)]">
                <Photo src={sv.photoUrl} alt={sv.name} tone={TONES[i % TONES.length]} className="h-[104px] w-full md:h-[150px]" />
                <span className="flex flex-1 flex-col items-center px-3 pb-4 text-center md:px-4">
                  <span className="-mt-[18px] grid h-9 w-9 place-items-center rounded-full border-[3px] border-white bg-brand md:-mt-[21px] md:h-[42px] md:w-[42px]"><IconDrop size={15} /></span>
                  <span className="mt-2 text-[11.5px] font-bold uppercase tracking-[0.1em] md:text-[13px]">{sv.name}</span>
                  <span className="mt-1.5 flex-1 text-xs leading-snug text-ink-muted md:text-[13px]">{sv.description}</span>
                  <span className="mt-2.5 text-[11px] font-bold tracking-[0.1em] text-brand-text">{euro(sv.priceCents)} · {sv.durationMin} MIN →</span>
                </span>
              </Link>
            ))}
          </div>
          {addOns.length > 0 && (
            <p className="mt-6 text-center text-sm text-ink-muted">Extras: {addOns.map((a) => `${a.name} (${euro(a.priceCents, { plus: true })})`).join(" · ")}</p>
          )}
        </section>

        {/* SOBRE */}
        <section id="sobre" className="grid bg-brand-soft lg:grid-cols-2">
          <Photo src={s.aboutPhotoUrl} alt={`Interior do salão ${s.salonName}`} label="FOTO DO SALÃO" tone="#CBCBCB" className="h-60 w-full lg:h-full lg:min-h-[520px]" />
          <div className="flex max-w-[640px] flex-col justify-center px-5 py-9 lg:px-16 lg:py-20">
            <p className="eyebrow">Sobre nós</p>
            <h2 className="h-section mt-2.5">Onde a Beleza Encontra o Descanso</h2>
            <p className="mt-4 max-w-[470px] text-sm leading-relaxed text-ink-soft md:text-[15px]">{s.aboutText}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Feature icon={<IconShield size={22} />} title="Higiene em Primeiro Lugar" text="Esterilização de nível hospitalar, para cada cliente." />
              <Feature icon={<IconDrop size={22} />} title="Produtos Premium" text="Géis veganos, com pouco cheiro e que duram." />
              <Feature icon={<IconAward size={22} />} title="Equipa Experiente" text="Técnicas certificadas e atenciosas." />
            </div>
          </div>
        </section>

        {/* PROMOÇÃO */}
        {s.promoActive && (
          <section className="px-4 pt-10 md:px-16 md:pt-[72px]">
            <div className="mx-auto flex max-w-page flex-col overflow-hidden rounded-card bg-ink text-white md:flex-row md:items-center md:gap-12">
              <Photo src={s.promoPhotoUrl} alt="Unhas brilhantes sobre cetim preto" tone="#363636" className="h-[120px] w-full md:h-auto md:min-h-[210px] md:w-[38%] md:self-stretch" />
              <div className="flex-1 px-5 py-6 text-center md:px-0 md:text-left">
                <p className="font-serif text-xl italic text-[#DDD] md:text-2xl">{s.promoTitle}</p>
                <p className="font-serif text-[52px] font-medium leading-none md:text-[66px]">{s.promoValue}</p>
                <p className="mt-2 text-[11px] font-semibold tracking-[0.2em] text-[#E6E6E6] md:text-[13px]">{s.promoText}</p>
              </div>
              <div className="px-5 pb-6 md:py-7 md:pr-12"><Link href="/marcar" className="btn-primary h-[52px] w-full px-8 md:w-auto">Marcar</Link></div>
            </div>
          </section>
        )}

        {/* GALERIA */}
        <section id="galeria" className="overflow-hidden px-4 py-14 md:px-16 md:py-20">
          <div className="mb-6 text-center md:mb-10"><p className="eyebrow">Galeria de nail art</p><h2 className="h-section mt-2.5">Inspiração para as Suas Próximas Unhas</h2></div>
          <Gallery items={gallery.length ? gallery.map((g) => ({ id: g.id, url: g.url, label: g.label, alt: g.alt })) : PLACEHOLDERS} />
          {s.instagram && (
            <div className="mt-8 text-center">
              <a href={`https://instagram.com/${s.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener" className="btn-outline h-12 px-7"><IconInstagram size={16} />Ver mais no Instagram</a>
            </div>
          )}
        </section>

        {/* OPINIÕES */}
        {reviews.length > 0 && (
          <section id="opinioes" className="bg-brand-soft px-4 py-14 md:px-16 md:py-20">
            <div className="mb-6 text-center md:mb-10"><p className="eyebrow">O que dizem as nossas clientes</p><h2 className="h-section mt-2.5">As Nossas Clientes Adoram</h2></div>
            <Testimonials items={reviews.map((r) => ({ id: r.id, name: r.name, city: r.city, text: r.text, when: shortDate(dateKey(r.date)) }))} />
          </section>
        )}

        {/* CTA FINAL */}
        <section className="bg-brand px-5 py-10 md:px-16">
          <div className="mx-auto flex max-w-page flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            <div>
              <h2 className="font-serif text-[30px] font-medium leading-tight md:text-[38px]">Pronta para se Mimar?</h2>
              <p className="mt-2 text-sm md:text-[15px]">Faça hoje a sua marcação e deixe-nos transformar as suas ideias em unhas bonitas.</p>
            </div>
            <div className="flex w-full flex-col items-center gap-2 md:w-auto">
              <Link href="/marcar" className="btn h-[54px] w-full bg-white px-8 text-ink hover:bg-brand-soft md:w-auto">Marque já</Link>
              <div className="flex gap-5 text-sm font-semibold">
                <a href={tel} className="inline-flex min-h-[44px] items-center gap-2"><IconPhone size={15} />{s.phone}</a>
                {s.whatsappButton && <a href={wa} target="_blank" rel="noopener" className="inline-flex min-h-[44px] items-center gap-2"><IconWhatsApp size={15} />WhatsApp</a>}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* RODAPÉ */}
      <footer id="contactos" className="bg-ink px-5 pt-10 text-[#CFCFCF] md:px-16 md:pt-16">
        <div className="mx-auto grid max-w-page gap-8 pb-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.3fr_1.3fr]">
          <div>
            <Logo name={s.salonName} logoUrl={s.logoUrl} light />
            <p className="mt-4 max-w-[260px] text-[13px] leading-relaxed text-[#A8A8A8]">Unhas bonitas e um tempinho para si, num estúdio calmo e impecável.</p>
            {s.instagram && <a href={`https://instagram.com/${s.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener" aria-label="Instagram" className="mt-4 inline-grid h-11 w-11 place-items-center rounded-full border border-[#3A3A3A] hover:text-white"><IconInstagram size={16} /></a>}
          </div>
          <nav aria-label="Ligações rápidas">
            <p className="mb-3 text-xs font-bold tracking-[0.18em] text-white">LIGAÇÕES RÁPIDAS</p>
            <ul className="grid grid-cols-2 gap-y-2 text-[13px] md:grid-cols-1">
              {[["#servicos", "Serviços"], ["#galeria", "Galeria"], ["#sobre", "Sobre nós"], ["#opinioes", "Opiniões"], ["/marcar", "Fazer marcação"]].map(([h, l]) => <li key={h}><a href={h} className="inline-block py-1 hover:text-white">{l}</a></li>)}
            </ul>
          </nav>
          <address className="not-italic">
            <p className="mb-3 text-xs font-bold tracking-[0.18em] text-white">CONTACTOS</p>
            <ul className="space-y-2 text-[13px]">
              <li className="flex gap-2.5"><IconPin size={16} className="mt-0.5 shrink-0" />{s.address}<br />{s.postalCode} {s.city}</li>
              <li><a href={tel} className="flex items-center gap-2.5 py-1 hover:text-white"><IconPhone size={16} />{s.phone}</a></li>
              {s.whatsappButton && <li><a href={wa} target="_blank" rel="noopener" className="flex items-center gap-2.5 py-1 hover:text-white"><IconWhatsApp size={16} />WhatsApp: {s.whatsapp}</a></li>}
              <li><a href={`mailto:${s.email}`} className="py-1 hover:text-white">{s.email}</a></li>
            </ul>
          </address>
          <div>
            <p className="mb-3 text-xs font-bold tracking-[0.18em] text-white">HORÁRIO</p>
            <p className="flex gap-2.5 text-[13px] leading-relaxed"><IconClock size={16} className="mt-0.5 shrink-0" /><span className="whitespace-pre-line">{hoursLine}</span></p>
          </div>
        </div>
        <div className="mx-auto flex max-w-page flex-wrap justify-between gap-3 border-t border-[#2C2C2C] py-5 text-xs text-[#8C8C8C]">
          <span>© {new Date().getFullYear()} {s.salonName}. Todos os direitos reservados.</span>
          <span className="flex gap-5"><Link href="/privacidade" className="hover:text-white">Política de Privacidade</Link><a href="https://www.livroreclamacoes.pt" target="_blank" rel="noopener" className="hover:text-white">Livro de Reclamações</a></span>
        </div>
      </footer>
    </>
  );
}

const PLACEHOLDERS = ["NUDE AMENDOADA", "ROSA BLUSH", "CROMADO", "FRANCESINHA", "ARTE FLORAL", "ACRÍLICO"].map((l, i) => ({ id: "p" + i, url: null, label: l, alt: l, tone: TONES[i] }));

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
function Trust({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <li className="flex items-center gap-2.5"><span className="grid h-[34px] w-[34px] place-items-center rounded-full border border-[#C6C6C6] text-brand-text">{icon}</span>{children}</li>;
}
function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="flex gap-3.5 sm:flex-col sm:gap-2.5"><span className="shrink-0 text-brand-text">{icon}</span><span><span className="block text-sm font-bold">{title}</span><span className="mt-0.5 block text-[13px] leading-snug text-ink-muted">{text}</span></span></div>;
}
