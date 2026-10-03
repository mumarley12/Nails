/* eslint-disable @next/next/no-img-element */
/** Mostra a foto carregada no painel; sem foto, um fundo neutro com a descrição. */
export function Photo({ src, alt, className = "", label, tone = "#D6D6D6", eager = false }: { src?: string | null; alt: string; className?: string; label?: string; tone?: string; eager?: boolean }) {
  if (src) return <img src={src} alt={alt} className={`object-cover ${className}`} loading={eager ? "eager" : "lazy"} decoding="async" />;
  return (
    <div role="img" aria-label={alt} className={`ph flex items-end p-3 ${className}`} style={{ backgroundColor: tone }}>
      {label && <span className="rounded-btn bg-white/75 px-2 py-1 text-[10px] font-bold tracking-[0.1em] text-[#363636]">{label}</span>}
    </div>
  );
}
