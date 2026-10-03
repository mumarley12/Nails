"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconBack, IconCalendar, IconCheck, IconClose, IconWhatsApp } from "@/components/icons";
import { euro } from "@/lib/money";
import { addDays, dateKey, DIAS_CURTOS, hhmm, longDate, MESES, weekdayOf } from "@/lib/time";

type Svc = { id: string; name: string; description: string; category: string; priceCents: number; durationMin: number };
type Tech = { id: string; name: string; role: string; photoUrl: string | null; tags: string[]; serviceIds: string[] };
type Options = { services: Svc[]; addOns: Svc[]; staff: Tech[]; salon: { name: string; address: string; whatsapp: string | null } };
type Day = { day: string; free: number; closed: boolean };

const MESES_CURTOS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
const STEPS = ["Serviço", "Técnica", "Dia", "Hora", "Dados"] as const;
const TITLES = ["Escolha o Serviço", "Escolha a Técnica", "Escolha o Dia", "Escolha a Vaga", "Os Seus Dados"];

function prettyPhoneInput(v: string) {
  const x = v.replace(/\D/g, "").slice(0, 9);
  return x.length < 4 ? x : x.length < 7 ? `${x.slice(0, 3)} ${x.slice(3)}` : `${x.slice(0, 3)} ${x.slice(3, 6)} ${x.slice(6)}`;
}

export function BookingWizard({ initialServiceId, rescheduleToken, initialDay = null, initialStart = null }: { initialServiceId: string | null; rescheduleToken: string | null; initialDay?: string | null; initialStart?: number | null }) {
  const wanted = useRef<{ day: string | null; start: number | null }>({ day: initialDay, start: initialStart });
  const resched = !!rescheduleToken;
  const [opts, setOpts] = useState<Options | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [step, setStep] = useState(resched ? 2 : 0);
  const [serviceId, setServiceId] = useState<string | null>(initialServiceId);
  const [addOnId, setAddOnId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string>("any");
  const [days, setDays] = useState<Day[] | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slots, setSlots] = useState<number[] | null>(null);
  const [startMin, setStartMin] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "", consent: false, website: "" });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ token: string } | null>(null);

  useEffect(() => {
    fetch("/api/booking/options").then((r) => r.json()).then((o: Options) => {
      setOpts(o);
      if (initialServiceId && !o.services.some((s) => s.id === initialServiceId)) setServiceId(null);
    }).catch(() => setLoadErr("Não foi possível carregar os serviços. Verifique a ligação e tente de novo."));
  }, [initialServiceId]);

  const svc = opts?.services.find((s) => s.id === serviceId) ?? null;
  const addOn = opts?.addOns.find((s) => s.id === addOnId) ?? null;
  const price = (svc?.priceCents ?? 0) + (addOn?.priceCents ?? 0);
  const dur = (svc?.durationMin ?? 0) + (addOn?.durationMin ?? 0);
  const addOnsForSvc = useMemo(() => (opts?.addOns ?? []).filter(() => !!svc), [opts, svc]);

  const qs = useCallback((extra: Record<string, string>) => {
    const p = new URLSearchParams(extra);
    if (resched) p.set("token", rescheduleToken!);
    else { p.set("service", serviceId ?? ""); p.set("staff", staffId); if (addOnId) p.set("addon", addOnId); }
    return p.toString();
  }, [resched, rescheduleToken, serviceId, staffId, addOnId]);

  // Dias disponíveis
  useEffect(() => {
    if (step !== 2 || (!resched && !serviceId)) return;
    setDays(null);
    fetch(`/api/booking/days?${qs({ from: dateKey(new Date()), days: "21" })}`).then((r) => r.json()).then((d) => {
      if (d.error) { setError(d.error); return; }
      setDays(d.days);
    }).catch(() => setError("Sem ligação. Tente de novo."));
  }, [step, qs, resched, serviceId]);

  // Horas do dia
  useEffect(() => {
    if (step !== 3 || !day) return;
    setSlots(null);
    fetch(`/api/booking/slots?${qs({ day })}`).then((r) => r.json()).then((d) => {
      if (d.error) { setError(d.error); return; }
      const list: number[] = d.slots.map((s: { startMin: number }) => s.startMin);
      setSlots(list);
      // Veio de uma vaga do site: se ainda está livre, escolhe-a e passa aos dados.
      const w = wanted.current;
      if (w.day === day && w.start !== null) { wanted.current = { day: null, start: null }; if (list.includes(w.start)) { setStartMin(w.start); setStep(4); } }
    }).catch(() => setError("Sem ligação. Tente de novo."));
  }, [step, day, qs]);

  const phoneDigits = form.phone.replace(/\D/g, "");
  const phoneOk = /^9[1236]\d{7}$/.test(phoneDigits);
  const nameOk = form.name.trim().length >= 2;
  const emailOk = !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const canNext = [!!svc, true, !!day, startMin !== null, true][step];
  const firstStep = resched ? 2 : 0;
  const shownSteps = [0, 2, 3, 4].filter((i) => i >= firstStep && (!resched || i < 4));

  async function submit() {
    setTried(true);
    setError("");
    if (!resched && (!nameOk || !phoneOk || !emailOk || !form.consent)) return;
    setBusy(true);
    try {
      const res = await fetch(resched ? "/api/booking/reschedule" : "/api/booking", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resched
          ? { token: rescheduleToken, day, startMin }
          : { serviceId, addOnId, staffId, day, startMin, name: form.name, phone: phoneDigits, email: form.email, notes: form.notes, consent: form.consent, website: form.website }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Não foi possível concluir.");
        if (res.status === 409) { setStartMin(null); setStep(3); setSlots(null); fetch(`/api/booking/slots?${qs({ day: day! })}`).then((r) => r.json()).then((x) => setSlots((x.slots ?? []).map((s: { startMin: number }) => s.startMin))); }
        return;
      }
      setDone({ token: d.token });
    } catch {
      setError("Sem ligação. Verifique a internet e tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    setError("");
    if (step === 3 && resched) return void submit();
    if (step === 0 && wanted.current.day) { setDay(wanted.current.day); setStep(3); return; } // veio de uma vaga do site
    if (step < 4) setStep(step === 0 ? 2 : step + 1); // só há uma nail designer: sem passo "Técnica"
    else submit();
  }

  const summary = svc ? `${svc.name}${addOn ? " + " + addOn.name : ""} · ${dur} min` : "";
  const when = day && startMin !== null ? `${DIAS_CURTOS[weekdayOf(day)].charAt(0)}${DIAS_CURTOS[weekdayOf(day)].slice(1).toLowerCase()}, ${Number(day.slice(8))} ${MESES[Number(day.slice(5, 7)) - 1].slice(0, 3)} · ${hhmm(startMin)}` : "";
  const waLink = opts?.salon.whatsapp ? `https://wa.me/${opts.salon.whatsapp}?text=${encodeURIComponent("Olá! Tenho uma dúvida sobre uma marcação.")}` : null;

  if (done) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col bg-brand-soft px-5 pb-6 pt-9 animate-in">
          <div className="text-center">
            <span className="inline-grid h-16 w-16 place-items-center rounded-full bg-brand"><IconCheck size={30} strokeWidth={2.2} /></span>
            <h1 className="mt-4 font-serif text-[34px] font-medium">{resched ? "Marcação alterada!" : "Está Marcado!"}</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {form.email ? `Enviámos a confirmação para ${form.email}. ` : ""}Adicione ao calendário para não se esquecer.
            </p>
          </div>
          <dl className="card mt-6 px-4">
            {!resched && <Row k="Serviço" v={`${svc?.name}${addOn ? " + " + addOn.name : ""}`} />}
            <Row k="Dia" v={day ? longDate(day) : ""} />
            <Row k="Hora" v={startMin !== null ? `${hhmm(startMin)} – ${hhmm(startMin + dur)}` : ""} />
            <Row k="Morada" v={opts?.salon.address ?? ""} last />
          </dl>
          {!resched && <p className="mt-2.5 text-center text-xs text-ink-muted">Total {euro(price)} · pagamento no salão</p>}
          <div className="mt-auto flex flex-col gap-2.5 pt-6">
            <a href={`/api/ics/${done.token}`} className="btn-primary h-[52px]"><IconCalendar size={16} />Adicionar ao calendário</a>
            <Link href={`/m/${done.token}`} className="btn-outline">Alterar marcação</Link>
            {waLink && <a href={waLink} target="_blank" rel="noopener" className="flex h-11 items-center justify-center gap-2 text-[13px] font-semibold"><IconWhatsApp size={15} />Dúvidas? Fale connosco no WhatsApp</a>}
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-1.5">
        <button type="button" onClick={() => { setError(""); setStep(Math.max(firstStep, step === 2 ? 0 : step - 1)); }} disabled={step === firstStep} aria-label="Passo anterior" className="grid h-11 w-11 place-items-center disabled:opacity-30"><IconBack size={20} /></button>
        <span className="font-serif text-lg">{resched ? "Alterar Marcação" : "Fazer Marcação"}</span>
        <Link href={resched ? `/m/${rescheduleToken}` : "/"} aria-label="Fechar" className="grid h-11 w-11 place-items-center"><IconClose size={20} /></Link>
      </header>
      <div className="shrink-0 px-5 pt-3.5">
        <div className="flex justify-between text-[11px] font-bold tracking-[0.16em] text-brand-text">
          <span>PASSO {shownSteps.indexOf(step) + 1} DE {shownSteps.length}</span>
          <span className="font-semibold tracking-[0.08em] text-[#8A8A8A]">{STEPS[step]}</span>
        </div>
        <div className="mt-2.5 flex gap-1" aria-hidden="true">
          {shownSteps.map((i) => <span key={i} className={`h-[3px] flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-[#E7E7E7]"}`} />)}
        </div>
        <h1 className="mt-4 font-serif text-[28px] font-medium leading-tight">{TITLES[step]}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4 no-scrollbar" aria-live="polite">
        {!opts && !loadErr && <Loading />}
        {loadErr && <p role="alert" className="text-sm text-bad-fg">{loadErr}</p>}

        {opts && step === 0 && (
          <div className="flex flex-col gap-5 animate-in">
            {Array.from(new Set(opts.services.map((s) => s.category))).map((cat) => (
              <div key={cat}>
                <p className="mb-2 text-[11px] font-bold tracking-[0.18em] text-[#8A8A8A] uppercase">{cat}</p>
                <div className="flex flex-col gap-2">
                  {opts.services.filter((s) => s.category === cat).map((s) => (
                    <Choice key={s.id} selected={serviceId === s.id} onClick={() => { setServiceId(s.id); setStaffId("any"); setDay(null); setStartMin(null); }}
                      title={s.name} sub={s.description} right={<><b className="block text-[15px]">{euro(s.priceCents)}</b><span className="text-xs text-ink-muted">{s.durationMin} min</span></>} />
                  ))}
                </div>
              </div>
            ))}
            {svc && addOnsForSvc.map((a) => (
              <label key={a.id} className="flex min-h-14 items-center gap-3 rounded-card border border-dashed border-[#CCCCCC] bg-brand-soft px-3.5 py-2.5">
                <input type="checkbox" checked={addOnId === a.id} onChange={() => { setAddOnId(addOnId === a.id ? null : a.id); setStartMin(null); }} className="h-5 w-5 accent-[#6B6B6B]" />
                <span className="flex-1"><span className="block text-sm font-semibold">Adicionar {a.name.toLowerCase()}</span><span className="block text-xs text-ink-muted">{a.description} · {a.durationMin} min</span></span>
                <b className="text-sm">{euro(a.priceCents, { plus: true })}</b>
              </label>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="animate-in">
            {!days ? <Loading /> : (
              <>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {days.filter((d) => !d.closed).map((d) => {
                    const wd = weekdayOf(d.day), sel = day === d.day;
                    const sub = d.closed ? "Sem vagas" : d.free === 0 ? "Esgotado" : `${d.free} ${d.free === 1 ? "vaga" : "vagas"}`;
                    return (
                      <button key={d.day} type="button" disabled={d.free === 0} aria-pressed={sel} aria-label={`${longDate(d.day)}, ${sub}`}
                        onClick={() => { setDay(d.day); setStartMin(null); }}
                        className={`flex h-[78px] flex-col items-center justify-center gap-0.5 rounded-card border transition ${sel ? "border-brand bg-brand" : d.free === 0 ? "border-line bg-[#F7F7F7] text-[#9A9A9A]" : "border-[#E2E2E2] bg-white hover:border-brand-text"}`}>
                        <span className="text-[11px] font-bold tracking-[0.1em]">{DIAS_CURTOS[wd]} · {MESES_CURTOS[Number(d.day.slice(5, 7)) - 1]}</span>
                        <span className="font-serif text-[22px] leading-none">{Number(d.day.slice(8))}</span>
                        <span className={`text-[10.5px] font-semibold ${sel ? "" : d.free === 0 ? "" : "text-brand-text"}`}>{sub}</span>
                      </button>
                    );
                  })}
                </div>
                {days.every((d) => d.free === 0) && <Empty text="Ainda não há vagas publicadas. As vagas da próxima semana saem ao sábado — ou fale comigo pelo WhatsApp." />}
              </>
            )}
          </div>
        )}

        {step === 3 && day && (
          <div className="animate-in">
            <p className="text-[13px] font-semibold text-ink-soft">{longDate(day)}</p>
            {!slots ? <Loading /> : slots.length === 0 ? (
              <Empty text="Não há horários disponíveis neste dia. Por favor, escolha outro dia." action={<button type="button" onClick={() => setStep(2)} className="btn-outline mt-4 h-11">Escolher outro dia</button>} />
            ) : (
              [["MANHÃ", (m: number) => m < 720], ["TARDE", (m: number) => m >= 720 && m < 1020], ["FIM DE TARDE", (m: number) => m >= 1020]].map(([label, f]) => {
                const list = slots.filter(f as (m: number) => boolean);
                if (!list.length) return null;
                return (
                  <div key={label as string} className="mt-4">
                    <p className="mb-2 text-[11px] font-bold tracking-[0.18em] text-[#8A8A8A]">{label as string}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {list.map((m) => (
                        <button key={m} type="button" aria-pressed={startMin === m} onClick={() => setStartMin(m)}
                          className={`h-12 rounded-card border text-sm font-semibold transition ${startMin === m ? "border-brand bg-brand" : "border-[#E2E2E2] bg-white hover:border-brand-text"}`}>{hhmm(m)}</button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {step === 4 && (
          <form className="flex flex-col gap-3.5 animate-in" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
            <div className="rounded-card border border-line bg-brand-soft px-3.5 py-3 text-[13px] leading-relaxed">
              <b>{svc?.name}{addOn ? " + " + addOn.name : ""} · {euro(price)}</b><br /><span className="text-ink-soft">{day && longDate(day)} às {startMin !== null && hhmm(startMin)}</span>
            </div>
            <Field id="f-name" label="Nome completo" error={tried && !nameOk ? "Por favor, indique o seu nome." : ""}>
              <input id="f-name" className="field h-[50px] text-base" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex.: Joana Moreira" />
            </Field>
            <Field id="f-phone" label="Telemóvel" error={tried && !phoneOk ? "Indique um telemóvel português válido (9 dígitos, começa por 9)." : ""}>
              <input id="f-phone" className="field h-[50px] text-base" type="tel" inputMode="tel" autoComplete="tel-national" value={form.phone} onChange={(e) => setForm({ ...form, phone: prettyPhoneInput(e.target.value) })} placeholder="912 345 678" />
            </Field>
            <Field id="f-email" label={<>Email <span className="font-normal text-[#8A8A8A]">(para receber a confirmação)</span></>} error={tried && !emailOk ? "Email inválido." : ""}>
              <input id="f-email" className="field h-[50px] text-base" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value.trim() })} placeholder="o.seu@email.com" />
            </Field>
            <Field id="f-notes" label={<>Observações <span className="font-normal text-[#8A8A8A]">(opcional)</span></>}>
              <textarea id="f-notes" rows={2} className="field h-auto resize-none py-3 text-base" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Inspiração, alergias, remoção de gel…" />
            </Field>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="absolute -left-[9999px] h-px w-px opacity-0" aria-hidden="true" />
            <label className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-soft">
              <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} className="mt-0.5 h-5 w-5 shrink-0 accent-[#6B6B6B]" />
              <span>Aceito que os meus dados sejam usados apenas para gerir esta marcação (<Link href="/privacidade" className="underline">RGPD</Link>).</span>
            </label>
            {tried && !form.consent && <p className="-mt-2 text-xs text-bad-fg">É preciso aceitar para concluir a marcação.</p>}
          </form>
        )}

        {error && <p role="alert" className="mt-4 rounded-card bg-bad-bg px-3.5 py-3 text-sm text-bad-fg">{error}</p>}
      </div>

      <div className="shrink-0 border-t border-line bg-white px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-3">
        {!resched && svc && (
          <div className="mb-2.5 flex items-baseline justify-between text-[13px]">
            <span className="text-ink-soft">{when || summary}</span><b className="text-[15px]">{euro(price)}</b>
          </div>
        )}
        <button type="button" onClick={next} disabled={!canNext || busy || !opts && !resched} className="btn-primary h-[54px] w-full disabled:bg-[#E0E0E0] disabled:text-[#7A7A7A] disabled:opacity-100">
          {busy ? "A confirmar…" : step === 4 ? "Confirmar marcação" : step === 3 && resched ? "Confirmar nova hora" : "Continuar"}
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#F2F2F2] md:py-8">
      <div className="mx-auto flex h-dvh max-w-[480px] flex-col overflow-hidden bg-white md:h-[min(860px,calc(100dvh-64px))] md:rounded-card md:border md:border-line">{children}</div>
    </div>
  );
}
function Choice({ selected, onClick, title, sub, right, avatar, photo }: { selected: boolean; onClick: () => void; title: string; sub: string; right?: React.ReactNode; avatar?: string; photo?: string | null }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected}
      className={`flex min-h-16 w-full items-center gap-3 rounded-card border px-3.5 py-3 text-left transition ${selected ? "border-brand-text bg-brand-soft" : "border-[#E2E2E2] bg-white hover:border-brand-text"}`}>
      {avatar && (photo
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={photo} alt="" className="h-[46px] w-[46px] shrink-0 rounded-full object-cover" />
        : <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full bg-[#E3E3E3] font-serif text-[17px] text-[#363636]">{avatar}</span>)}
      <span className="flex-1"><span className="block text-[15px] font-semibold">{title}</span><span className="mt-0.5 block text-[12.5px] text-ink-muted">{sub}</span></span>
      {right && <span className="shrink-0 text-right">{right}</span>}
      <span className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-[1.5px] ${selected ? "border-brand-text bg-brand" : "border-[#D3D3D3] bg-white"}`}>{selected && <IconCheck size={12} strokeWidth={3} />}</span>
    </button>
  );
}
function Field({ id, label, error, children }: { id: string; label: React.ReactNode; error?: string; children: React.ReactNode }) {
  return <div><label htmlFor={id} className="label">{label}</label>{children}{error && <p className="mt-1.5 text-xs text-bad-fg">{error}</p>}</div>;
}
function Row({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return <div className={`flex justify-between gap-4 py-3 text-sm ${last ? "" : "border-b border-[#F0F0F0]"}`}><dt className="text-ink-muted">{k}</dt><dd className="m-0 text-right font-semibold">{v}</dd></div>;
}
function Loading() {
  return <div className="flex flex-col gap-2 py-2" aria-label="A carregar">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-card bg-[#F2F2F2]" />)}</div>;
}
function Empty({ text, action }: { text: string; action?: React.ReactNode }) {
  return <div className="mt-5 rounded-card border border-line bg-brand-soft px-5 py-7 text-center"><IconCalendar size={30} className="mx-auto text-brand-text" /><p className="mt-2.5 font-serif text-lg">{text}</p>{action}</div>;
}
