"use client";
import { useEffect, useRef } from "react";
import { Photo } from "./Photo";

type Item = { id: string; url: string | null; label: string; alt: string; tone?: string };

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
        s.pos += 0.5;
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

  if (!items.length) return <p className="text-center text-sm text-ink-muted">Em breve, fotos dos nossos trabalhos.</p>;
  return (
    <div ref={ref} onMouseEnter={hold} onMouseLeave={go} onTouchStart={hold} onTouchEnd={goLater} onScroll={onScroll}
      tabIndex={0} aria-label="Galeria de trabalhos — deslize para ver mais" className="overflow-x-auto overflow-y-hidden no-scrollbar -mx-4 md:-mx-16">
      <div className="flex w-max">
        {loop.map((g, i) => (
          <figure key={g.id + i} aria-hidden={i >= items.length} className="relative m-0 mr-2.5 md:mr-3 h-[146px] w-[146px] md:h-[230px] md:w-[230px] shrink-0 overflow-hidden rounded-[3px]">
            <Photo src={g.url} alt={g.alt || g.label} label={g.url ? undefined : g.label} tone={g.tone} className="h-full w-full" />
            {g.url && g.label && <figcaption className="absolute bottom-2 left-2 rounded-btn bg-white/80 px-2 py-1 text-[10px] font-bold tracking-[0.12em] text-[#363636]">{g.label}</figcaption>}
          </figure>
        ))}
      </div>
    </div>
  );
}
