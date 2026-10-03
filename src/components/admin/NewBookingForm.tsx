"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { euro } from "@/lib/money";
import { hhmm } from "@/lib/time";

type S = { id: string; name: string; isAddOn: boolean; durationMin: number; priceCents: number };
export function NewBookingForm({ initialDay, services, staff }: { initialDay: string; services: S[]; staff: { id: string; name: string; serviceIds: string[] }[] }) {
  const router = useRouter();
  const main = services.filter((s) => !s.isAddOn), extras = services.filter((s) => s.isAddOn);
  const [f, setF] = useState({ serviceId: main[0]?.id ?? "", addOnId: "", staffId: "any", day: initialDay, startMin: "", name: "", phone: "", email: "", notes: "" });
  const [slots, setSlots] = useState<number[] | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value, ...(["serviceId", "addOnId", "staffId", "day"].includes(k) ? { startMin: "" } : {}) });
  useEffect(() => {
    if (!f.serviceId || !f.day) return;
    setSlots(null);
    const p = new URLSearchParams({ day: f.day, service: f.serviceId, staff: f.staffId });
    if (f.addOnId) p.set("addon", f.addOnId);
    fetch(`/api/admin/slots?${p}`).then((r) => r.json()).then((d) => setSlots(d.slots?.map((s: { startMin: number }) => s.startMin) ?? [])).catch(() => setSlots([]));
  }, [f.serviceId, f.addOnId, f.staffId, f.day]);
  const svc = main.find((s) => s.id === f.serviceId), add = extras.find((s) => s.id === f.addOnId);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (f.startMin === "") return setErr("Escolha uma hora livre.");
    setBusy(true);
    const r = await fetch("/api/admin/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, addOnId: f.addOnId || null, startMin: Number(f.startMin) }) });
    const d = await r.json(); setBusy(false);
    if (!r.ok) return setErr(d.error ?? "Não foi possível criar.");
    router.push(`/admin/marcacoes/${d.id}?ok=CONFIRMED`);
  }
  return (
    <form onSubmit={submit} className="card grid gap-4 p-5 sm:grid-cols-2">
      <div className="sm:col-span-2"><label className="label" htmlFor="n-svc">Serviço</label><select id="n-svc" className="field" value={f.serviceId} onChange={set("serviceId")}>{main.map((s) => <option key={s.id} value={s.id}>{s.name} · {euro(s.priceCents)} · {s.durationMin} min</option>)}</select></div>
      {extras.length > 0 && <div><label className="label" htmlFor="n-add">Extra</label><select id="n-add" className="field" value={f.addOnId} onChange={set("addOnId")}><option value="">Nenhum</option>{extras.map((s) => <option key={s.id} value={s.id}>{s.name} ({euro(s.priceCents, { plus: true })})</option>)}</select></div>}
      <div><label className="label" htmlFor="n-day">Dia</label><input id="n-day" type="date" className="field" value={f.day} onChange={set("day")} required /></div>
      <div><label className="label" htmlFor="n-time">Hora</label><select id="n-time" className="field" value={f.startMin} onChange={set("startMin")} required>
        <option value="">{!slots ? "A carregar…" : slots.length ? "Escolha" : "Sem horas livres"}</option>{slots?.map((m) => <option key={m} value={m}>{hhmm(m)}</option>)}</select></div>
      <div><label className="label" htmlFor="n-name">Nome da cliente</label><input id="n-name" className="field" value={f.name} onChange={set("name")} required minLength={2} /></div>
      <div><label className="label" htmlFor="n-phone">Telemóvel</label><input id="n-phone" type="tel" inputMode="tel" className="field" value={f.phone} onChange={set("phone")} required placeholder="912 345 678" /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="n-email">Email <span className="font-normal text-ink-muted">(opcional — recebe a confirmação)</span></label><input id="n-email" type="email" className="field" value={f.email} onChange={set("email")} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="n-notes">Notas</label><textarea id="n-notes" rows={2} className="field h-auto py-2" value={f.notes} onChange={set("notes")} /></div>
      {err && <p role="alert" className="text-sm text-bad-fg sm:col-span-2">{err}</p>}
      <div className="flex items-center justify-between gap-3 sm:col-span-2">
        <span className="text-sm text-ink-soft">{svc && <>Total <b>{euro(svc.priceCents + (add?.priceCents ?? 0))}</b> · {svc.durationMin + (add?.durationMin ?? 0)} min</>}</span>
        <button type="submit" disabled={busy} className="btn-primary h-12 px-6">{busy ? "A criar…" : "Criar marcação"}</button>
      </div>
    </form>
  );
}
