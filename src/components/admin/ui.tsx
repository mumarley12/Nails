import Link from "next/link";

export const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "PENDENTE", cls: "bg-warn-bg text-warn-fg" },
  CONFIRMED: { label: "CONFIRMADA", cls: "bg-ok-bg text-ok-fg" },
  COMPLETED: { label: "CONCLUÍDA", cls: "bg-[#EFEFEF] text-ink-soft" },
  CANCELLED: { label: "CANCELADA", cls: "bg-bad-bg text-bad-fg" },
  NO_SHOW: { label: "FALTOU", cls: "bg-[#EFEFEF] text-ink-soft" },
};
export function StatusPill({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.PENDING;
  return <span className={`inline-flex shrink-0 rounded-btn px-2 py-1 text-[10.5px] font-bold tracking-[0.06em] ${s.cls}`}>{s.label}</span>;
}
export function PageHead({ eyebrow, title, sub, actions }: { eyebrow?: string; title: string; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 font-serif text-[26px] font-medium md:text-[32px]">{title}</h1>
        {sub && <p className="mt-1 text-[13px] text-ink-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
}
export function Card({ title, children, className = "", action }: { title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={`card ${className}`}>
      {title && <div className="flex items-center justify-between gap-3 border-b border-[#F0F0F0] px-5 py-4"><h2 className="font-serif text-xl font-medium">{title}</h2>{action}</div>}
      {children}
    </section>
  );
}
export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return <p role={error ? "alert" : "status"} className={`rounded-card px-4 py-3 text-sm ${error ? "bg-bad-bg text-bad-fg" : "bg-ok-bg text-ok-fg"}`}>{error ?? ok}</p>;
}
export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-8 text-center text-sm text-ink-muted">{children}</p>;
}
export function LinkBtn({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return <Link href={href} className={`${primary ? "btn-primary" : "btn-outline"} h-11 px-4`}>{children}</Link>;
}
/** Interruptor acessível que funciona sem JavaScript dentro de um <form>. */
export function Switch({ name, defaultChecked, label, hint }: { name: string; defaultChecked: boolean; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span><span className="block text-sm font-bold">{label}</span>{hint && <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-muted">{hint}</span>}</span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" role="switch" />
        <span className="h-[26px] w-11 rounded-full bg-[#D6D6D6] transition peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand-text" />
        <span className="absolute left-[3px] top-[3px] h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-[18px]" />
      </span>
    </label>
  );
}
