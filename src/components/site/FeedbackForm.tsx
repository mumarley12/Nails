"use client";
import { useState } from "react";

/** Formulário curto para a cliente deixar um feedback (aparece depois de aprovado). */
export function FeedbackForm() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", text: "", website: "", rating: 0 });
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!f.rating) { setErr("Escolha de 1 a 5 estrelas."); return; }
    setErr(""); setState("busy");
    const r = await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) }).catch(() => null);
    const d = await r?.json().catch(() => ({}));
    if (!r?.ok) { setErr(d?.error ?? "Sem ligação. Tente de novo."); setState("idle"); return; }
    setState("done");
  }

  if (state === "done") return <p className="mt-8 border border-night-line px-5 py-4 text-[15px] font-light text-cream-soft">Obrigada! O seu feedback aparece aqui depois de a Matilde o ver.</p>;
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="mt-8 inline-flex h-12 items-center border border-cream/40 px-6 text-[13px] uppercase tracking-[0.12em] text-cream hover:border-brand">Deixar feedback</button>;
  return (
    <form onSubmit={send} className="mt-8 flex max-w-[560px] flex-col gap-4">
      <fieldset>
        <legend className="mb-1.5 block text-[12px] uppercase tracking-[0.2em] text-night-muted">Estrelas</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" onClick={() => setF({ ...f, rating: i })} aria-label={`${i} ${i === 1 ? "estrela" : "estrelas"}`} aria-pressed={f.rating === i}
              className={`grid h-11 w-11 place-items-center ${i <= f.rating ? "text-brand" : "text-night-muted"} hover:text-brand`}>
              <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill={i <= f.rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" strokeLinejoin="round" /></svg>
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="fb-name" className="mb-1.5 block text-[12px] uppercase tracking-[0.2em] text-night-muted">Nome</label>
        <input id="fb-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required maxLength={40} autoComplete="given-name"
          className="h-12 w-full border border-night-line bg-night-raised px-3 text-[16px] text-cream placeholder:text-night-muted focus:border-brand focus:outline-none" />
      </div>
      <div>
        <label htmlFor="fb-text" className="mb-1.5 block text-[12px] uppercase tracking-[0.2em] text-night-muted">O seu feedback</label>
        <textarea id="fb-text" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} required maxLength={400} rows={4}
          className="w-full border border-night-line bg-night-raised px-3 py-2.5 text-[16px] text-cream focus:border-brand focus:outline-none" />
      </div>
      <input tabIndex={-1} aria-hidden="true" autoComplete="off" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} className="absolute left-[-9999px] h-px w-px" />
      {err && <p role="alert" className="text-[14px] text-[#F08A97]">{err}</p>}
      <button disabled={state === "busy"} className="inline-flex h-12 items-center justify-center bg-brand px-8 text-[13px] font-semibold uppercase tracking-[0.16em] text-night disabled:opacity-60 sm:self-start">{state === "busy" ? "A enviar…" : "Enviar feedback"}</button>
    </form>
  );
}
