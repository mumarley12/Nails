"use client";
import { useEffect, useRef } from "react";
import { Stars } from "./Stars";

type R = { id: string; name: string; city: string; text: string; when: string; rating: number };

/**
 * Feedbacks a passar sozinhos, como as fotos das clientes (o mais recente primeiro).
 * Para quando a cliente toca ou passa o rato; dá para arrastar com o dedo.
 */
export function Testimonials({ items }: { items: R[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const st = useRef({ pos: 0, hold: false, auto: false, t: 0 as unknown as ReturnType<typeof setTimeout> });
  const loop = items.length > 1 ? [...items, ...items] : items;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || items.length < 2) return;
    let raf = 0;
    const tick = () => {
      const g = ref.current, s = st.current;
      if (g && !s.hold) {
        const half = g.scrollWidth / 2;
        s.pos += 0.4;
        if (half > 0 && s.pos >= half) s.pos -= half;
        s.auto = true;
        g.scrollLeft = s.pos;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); clearTimeout(st.current.t); };
  }, [items.length]);

  const hold = () => { clearTimeout(st.current.t); st.current.hold = true; };
  const go = () => { if (ref.current) st.current.pos = ref.current.scrollLeft; st.current.hold = false; };
  const goLater = () => { clearTimeout(st.current.t); st.current.t = setTimeout(go, 2500); };
  const onScroll = () => {
    const g = ref.current, s = st.current;
    if (!g) return;
    if (s.auto) { s.auto = false; return; }
    const half = g.scrollWidth / 2;
    if (items.length > 1 && half > 0 && g.scrollLeft >= half) g.scrollLeft -= half;
    s.pos = g.scrollLeft;
  };

  if (!items.length) return null;
  return (
    <div ref={ref} onMouseEnter={hold} onMouseLeave={go} onTouchStart={hold} onTouchEnd={goLater} onScroll={onScroll}
      tabIndex={0} aria-label="Feedbacks de clientes — deslize para ver mais" className="no-scrollbar overflow-x-auto overflow-y-hidden">
      <div className="flex w-max">
        {loop.map((r, i) => (
          <figure key={r.id + i} aria-hidden={i >= items.length} className="m-0 mr-3 flex w-[280px] shrink-0 flex-col border border-night-line px-6 py-6 md:w-[380px] md:px-8 md:py-8">
            <Stars value={r.rating} className="mb-4 text-brand" />
            <blockquote className="font-serif text-[19px] leading-[1.4] text-cream md:text-[22px]">“{r.text}”</blockquote>
            <figcaption className="mt-auto pt-6 text-[12px] uppercase tracking-[0.22em] text-night-muted">{[r.name, r.city, r.when].filter(Boolean).join(" · ")}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
