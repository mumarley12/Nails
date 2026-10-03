"use client";
import { useEffect, useRef, useState } from "react";
import { IconBack, IconNext, IconStar } from "@/components/icons";

type R = { id: string; name: string; city: string; text: string; when: string };

/** Opiniões a passar sozinhas (5 s), mais recentes primeiro. Setas, pontos e deslizar com o dedo. */
export function Testimonials({ items }: { items: R[] }) {
  const [idx, setIdx] = useState(0);
  const [per, setPer] = useState(3);
  const paused = useRef(false);
  const tx = useRef<number | null>(null);
  const max = Math.max(0, items.length - per);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 980px)");
    const upd = () => setPer(mq.matches ? 1 : 3);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => { if (!paused.current) setIdx((i) => (i >= max ? 0 : i + 1)); }, 5000);
    return () => clearInterval(t);
  }, [max]);
  const step = (d: number) => setIdx((i) => { const n = i + d; return n > max ? 0 : n < 0 ? max : n; });
  const cur = Math.min(idx, max);
  const gap = per === 1 ? 12 : 20;

  if (!items.length) return null;
  return (
    <div>
      <div className="mx-auto max-w-[1180px] overflow-hidden" aria-roledescription="carrossel" aria-label="Opiniões de clientes"
        onMouseEnter={() => (paused.current = true)} onMouseLeave={() => (paused.current = false)}
        onTouchStart={(e) => { tx.current = e.touches[0]?.clientX ?? null; paused.current = true; }}
        onTouchEnd={(e) => { const t = e.changedTouches[0]; if (tx.current != null && t) { const dx = t.clientX - tx.current; if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1); } tx.current = null; paused.current = false; }}>
        <div className="flex transition-transform duration-[600ms] ease-out motion-reduce:transition-none" style={{ gap, transform: `translateX(calc(${-cur} * (100% + ${gap}px) / ${per}))` }}>
          {items.map((r) => (
            <figure key={r.id} className="m-0 flex shrink-0 flex-col rounded-card border border-[#E6E6E6] bg-white px-5 pb-5 pt-6 md:px-7 md:pt-7" style={{ flexBasis: `calc((100% - ${(per - 1) * gap}px) / ${per})` }}>
              <div className="flex items-start justify-between">
                <span aria-hidden="true" className="font-serif text-[44px] md:text-[54px] leading-[0.8] text-brand-text">“</span>
                <span className="flex gap-0.5 text-brand" aria-label="5 de 5 estrelas">{[0, 1, 2, 3, 4].map((i) => <IconStar key={i} />)}</span>
              </div>
              <blockquote className="mb-5 mt-3 flex-1 text-[14px] md:text-[15px] leading-relaxed text-[#333]">{r.text}</blockquote>
              <figcaption className="flex items-center gap-3 border-t border-[#ECECEC] pt-4">
                <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-[#D3D3D3] text-xs font-bold text-[#363636]">{r.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
                <span><span className="block text-sm font-bold">{r.name}</span><span className="block text-xs text-ink-muted">{[r.city, r.when].filter(Boolean).join(" · ")}</span></span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      {max > 0 && (
        <div className="mt-5 md:mt-7 flex items-center justify-center gap-3.5">
          <button type="button" onClick={() => step(-1)} aria-label="Opinião anterior" className="grid h-11 w-11 place-items-center rounded-full border border-[#CFCFCF] bg-white"><IconBack size={16} /></button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: max + 1 }, (_, i) => (
              <button key={i} type="button" onClick={() => setIdx(i)} aria-label={`Ver opiniões ${i + 1}`} aria-current={i === cur}
                className="h-1.5 rounded-full transition-all" style={{ width: i === cur ? 22 : 6, background: i === cur ? "#6B6B6B" : "#CFCFCF" }} />
            ))}
          </div>
          <button type="button" onClick={() => step(1)} aria-label="Opinião seguinte" className="grid h-11 w-11 place-items-center rounded-full border border-[#CFCFCF] bg-white"><IconNext size={16} /></button>
        </div>
      )}
    </div>
  );
}
