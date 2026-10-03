"use client";
import { useEffect, useRef } from "react";
import { Photo } from "./Photo";

type Item = { id: string; url: string | null; label: string; alt: string };

/** Fotos a passar sozinhas, devagar; a cliente pode arrastar com o dedo e o movimento espera por ela. */
export function Gallery({ items }: { items: Item[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const st = useRef({ pos: 0, hold: false, auto: false, t: 0 as unknown as ReturnType<typeof setTimeout> });
  const loop = items.length > 0 ? [...items, ...items] : [];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || items.length < 3) return;
    let raf = 0;
    const tick = () => {
      const g = ref.current, s = st.current;
      if (g && !s.hold) {
        const half = g.scrollWidth / 2;
        s.pos += 0.45;
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
    if (half > 0 && g.scrollLeft >= half) g.scrollLeft -= half;
    s.pos = g.scrollLeft;
  };

  if (!items.length) return null;
  return (
    <div ref={ref} onMouseEnter={hold} onMouseLeave={go} onTouchStart={hold} onTouchEnd={goLater} onScroll={onScroll}
      tabIndex={0} aria-label="Portefólio — deslize para ver mais" className="no-scrollbar overflow-x-auto overflow-y-hidden">
      <div className="flex w-max">
        {loop.map((g, i) => (
          <figure key={g.id + i} aria-hidden={i >= items.length} className={`relative m-0 mr-2 shrink-0 overflow-hidden md:mr-3 ${i % 3 === 0 ? "h-[300px] w-[225px] md:h-[440px] md:w-[330px]" : "h-[300px] w-[180px] md:h-[440px] md:w-[264px]"}`}>
            <Photo src={g.url} alt={g.alt || g.label || "Trabalho de unhas"} className="h-full w-full" />
            {g.url && g.label && <figcaption className="absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.24em] text-cream drop-shadow">{g.label}</figcaption>}
          </figure>
        ))}
      </div>
    </div>
  );
}
