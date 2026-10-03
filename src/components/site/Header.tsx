"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IconClose, IconMenu, IconPin, IconSparkle } from "@/components/icons";

const NAV = [
  ["#inicio", "Início"], ["#servicos", "Serviços"], ["#galeria", "Galeria"], ["#servicos", "Preços"],
  ["#sobre", "Sobre nós"], ["#opinioes", "Opiniões"], ["#contactos", "Contactos"],
] as const;

export function Logo({ name, logoUrl, light = false }: { name: string; logoUrl?: string | null; light?: boolean }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name} className="h-10 w-auto max-w-[180px] object-contain" />;
  }
  const [a, b] = name.includes("&") ? name.split("&").map((x) => x.trim()) : [name, ""];
  return (
    <span className="flex flex-col leading-none">
      <span className={`font-serif text-[21px] md:text-[25px] font-medium ${light ? "text-white" : ""}`}>
        {a}{b && <> <em className={light ? "text-[#A5A5A5]" : "text-brand-text"}>&amp;</em> {b}</>}
      </span>
      <span className={`mt-1 text-[8.5px] md:text-[9.5px] font-semibold tracking-[0.34em] ${light ? "text-[#9C9C9C]" : "text-ink-soft"}`}>NAIL SALON</span>
    </span>
  );
}

export function Header({ name, logoUrl, city }: { name: string; logoUrl?: string | null; city: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <>
      <div className="flex h-[30px] md:h-9 items-center justify-center md:justify-between gap-2 overflow-x-auto whitespace-nowrap bg-brand-light px-4 md:px-16 text-[10px] md:text-[11px] font-bold tracking-[0.14em] text-[#2E2E2E] no-scrollbar">
        <span className="flex items-center gap-2"><IconPin size={12} className="text-brand-text" />COM ORGULHO, NO CORAÇÃO DE {city.toUpperCase()}</span>
        <span className="hidden md:flex items-center gap-2 font-medium tracking-[0.02em] text-xs"><IconSparkle size={13} className="text-brand-text" />Limpo. Seguro. Bonito.</span>
      </div>
      <header className="sticky top-0 z-30 flex h-16 md:h-[84px] items-center justify-between border-b border-line bg-white/95 backdrop-blur pl-4 pr-2 md:px-16">
        <Link href="/" aria-label={`${name}, início`}><Logo name={name} logoUrl={logoUrl} /></Link>
        <nav aria-label="Principal" className="hidden lg:flex items-center gap-7 text-xs font-semibold tracking-[0.13em] uppercase">
          {NAV.map(([href, label], i) => (
            <a key={label} href={href} className={i === 0 ? "border-b-[1.5px] border-brand-text pb-1 text-brand-text" : "hover:text-brand-text"}>{label}</a>
          ))}
          <Link href="/marcar" className="btn-primary h-11 px-6 ml-1">Marcar</Link>
        </nav>
        <div className="flex lg:hidden items-center gap-1">
          <Link href="/marcar" className="btn-primary h-10 px-4 text-[11px]">Marcar</Link>
          <button type="button" aria-label="Abrir menu" aria-expanded={open} onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center"><IconMenu size={22} /></button>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 bg-white animate-in lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex h-16 items-center justify-between border-b border-line pl-4 pr-2">
            <Logo name={name} logoUrl={logoUrl} />
            <button type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center"><IconClose size={22} /></button>
          </div>
          <nav aria-label="Menu" className="flex flex-col px-4 py-4">
            {NAV.map(([href, label]) => (
              <a key={label} href={href} onClick={() => setOpen(false)} className="border-b border-line py-4 font-serif text-2xl">{label}</a>
            ))}
            <Link href="/marcar" className="btn-primary mt-6 h-[52px]">Fazer marcação</Link>
          </nav>
        </div>
      )}
    </>
  );
}
