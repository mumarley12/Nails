"use client";
import { useEffect, useRef, useState } from "react";
import { IconBack, IconNext } from "@/components/icons";

type R = { id: string; name: string; city: string; text: string; when: string };

/** Opiniões a passar sozinhas (6 s), mais recentes primeiro. Setas e deslizar com o dedo. */
export function Testimonials({ items }: { items: R[] }) {
  const [idx, setIdx] = useState(0);
  const paused = useRef(false);
  const tx = useRef<number | null>(null);
  const max = items.length - 1;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || max < 1) return;
    const t = setInterval(() => { if (!paused.current) setIdx((i) => (i >= max ? 0 : i + 1)); }, 6000);
    return () => clearInterval(t);
  }, [max]);
  const step = (d: number) => setIdx((i) => { const n = i + d; return n > max ? 0 : n < 0 ? max : n; });

  if (!items.length) return null;
  return (
    <div onMouseEnter={() => (paused.current = true)} onMouseLeave={() => (paused.current = false)}
      onTouchStart={(e) => { tx.current = e.touches[0]?.clientX ?? null; paused.current = true; }}
      onTouchEnd={(e) => { const t = e.changedTouches[0]; if (tx.current != null && t) { const dx = t.clientX - tx.current; if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1); } tx.current = null; paused.current = false; }}
      aria-roledescription="carrossel" aria-label="Opiniões de clientes" className="overflow-hidden">
      <div className="flex transition-transform duration-700 ease-out motion-reduce:transition-none" style={{ transform: `translateX(${-idx * 100}%)` }}>
        {items.map((r, i) => (
          <figure key={r.id} aria-hidden={i !== idx} className="m-0 w-full shrink-0">
            <blockquote className="font-serif text-[24px] italic leading-[1.35] text-cream md:text-[34px]">“{r.text}”</blockquote>
            <figcaption className="mt-5 text-[12px] uppercase tracking-[0.22em] text-night-muted">{[r.name, r.city, r.when].filter(Boolean).join(" · ")}</figcaption>
          </figure>
        ))}
      </div>
      {max > 0 && (
        <div className="mt-8 flex items-center gap-4">
          <button type="button" onClick={() => step(-1)} aria-label="Opinião anterior" className="grid h-11 w-11 place-items-center border border-night-line text-cream hover:border-brand"><IconBack size={16} /></button>
          <span className="text-[12px] tracking-[0.2em] text-night-muted">{idx + 1} / {max + 1}</span>
          <button type="button" onClick={() => step(1)} aria-label="Opinião seguinte" className="grid h-11 w-11 place-items-center border border-night-line text-cream hover:border-brand"><IconNext size={16} /></button>
        </div>
      )}
    </div>
  );
}
