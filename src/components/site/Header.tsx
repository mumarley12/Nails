"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IconClose, IconMenu } from "@/components/icons";

const NAV = [
  ["#portefolio", "Portefólio"], ["#menu", "Preços"], ["#sobre", "Sobre mim"], ["#contactos", "Contactos"],
] as const;

/** Logótipo: a imagem do painel, se houver; senão o nome em letra. */
export function Logo({ name, logoUrl }: { name: string; logoUrl?: string | null; light?: boolean }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name} className="h-10 w-auto max-w-[180px] object-contain" />;
  }
  const short = name.replace(/\s+by\s+/i, " · ").toUpperCase();
  return <span className="font-serif text-[20px] tracking-[0.06em] text-cream md:text-[22px]">{short.split(" · ").map((p, i) => <span key={i}>{i > 0 && <span className="text-brand"> · </span>}{p}</span>)}</span>;
}

export function Header({ name, logoUrl }: { name: string; logoUrl?: string | null; city?: string }) {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between pl-5 pr-2 transition-colors duration-300 md:h-20 md:px-12 ${solid ? "border-b border-night-line bg-night/95 backdrop-blur" : "bg-transparent"}`}>
        <Link href="/" aria-label={`${name}, início`}><Logo name={name} logoUrl={logoUrl} /></Link>
        <nav aria-label="Principal" className="hidden items-center gap-8 text-[12px] uppercase tracking-[0.2em] text-cream lg:flex">
          {NAV.map(([href, label]) => <a key={href} href={href} className="hover:text-brand">{label}</a>)}
          <Link href="/marcar" className="ml-2 inline-flex h-11 items-center border border-brand px-5 hover:bg-brand hover:text-night">Marcar</Link>
        </nav>
        <div className="flex items-center gap-1 lg:hidden">
          <Link href="/marcar" className="inline-flex h-11 items-center border border-brand px-4 text-[12px] uppercase tracking-[0.18em] text-cream">Marcar</Link>
          <button type="button" aria-label="Abrir menu" aria-expanded={open} onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center text-cream"><IconMenu size={22} /></button>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 bg-night text-cream animate-in lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex h-16 items-center justify-between pl-5 pr-2">
            <Logo name={name} logoUrl={logoUrl} />
            <button type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center"><IconClose size={22} /></button>
          </div>
          <nav aria-label="Menu" className="flex flex-col px-5 py-4">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setOpen(false)} className="border-b border-night-line py-4 font-serif text-3xl">{label}</a>
            ))}
            <Link href="/marcar" className="mt-8 inline-flex h-14 items-center justify-center bg-brand text-[13px] font-semibold uppercase tracking-[0.16em] text-night">Marcar online</Link>
          </nav>
        </div>
      )}
    </>
  );
}
