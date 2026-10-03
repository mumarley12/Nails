/* eslint-disable @next/next/no-img-element */
/** Mostra a foto carregada no painel; sem foto, um fundo escuro discreto. */
export function Photo({ src, alt, className = "", eager = false }: { src?: string | null; alt: string; className?: string; label?: string; tone?: string; eager?: boolean }) {
  if (src) return <img src={src} alt={alt} className={`object-cover ${className}`} loading={eager ? "eager" : "lazy"} decoding="async" />;
  return <div role="img" aria-label={alt} className={`bg-night-raised ${className}`} />;
}
