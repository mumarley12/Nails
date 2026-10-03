import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { findByToken, setAppointmentStatus } from "@/lib/booking";
import { getSettings } from "@/lib/settings";
import { dateKey, longDate, timeOf, MESES, DIAS_CURTOS, weekdayOf } from "@/lib/time";
import { euro } from "@/lib/money";
import { waNumber } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";
import { IconCalendar, IconCheck, IconWhatsApp } from "@/components/icons";

export const metadata: Metadata = { title: "A sua marcação", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const CANCEL_HOURS = 24;

async function cancel(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  if (!(await rateLimit(`cancel:${token.slice(0, 12)}`, 5, 600))) redirect(`/m/${token}?erro=1`);
  const a = await findByToken(token);
  if (!a || !["PENDING", "CONFIRMED"].includes(a.status)) redirect(`/m/${token}`);
  if (a.startAt.getTime() - Date.now() < CANCEL_HOURS * 3600_000) redirect(`/m/${token}?tarde=1`);
  await setAppointmentStatus(a.id, "CANCELLED", true);
  redirect(`/m/${token}?cancelada=1`);
}

export default async function Page({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { token } = await params;
  const sp = await searchParams;
  const [a, s] = await Promise.all([findByToken(token), getSettings()]);
  const wa = `https://wa.me/${waNumber(s.whatsapp)}?text=${encodeURIComponent("Olá! Tenho uma dúvida sobre a minha marcação.")}`;

  if (!a) {
    return (
      <Wrap name={s.salonName}>
        <h1 className="font-serif text-[28px] font-medium">Link inválido</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">Este link já não é válido. Pode ter sido substituído por um mais recente — veja o último email que lhe enviámos, ou fale connosco.</p>
        <a href={wa} className="btn-outline mt-6 w-full"><IconWhatsApp size={16} />Falar no WhatsApp</a>
      </Wrap>
    );
  }
  const key = dateKey(a.startAt);
  const active = a.status === "PENDING" || a.status === "CONFIRMED";
  const past = a.startAt <= new Date();
  const canCancel = active && a.startAt.getTime() - Date.now() >= CANCEL_HOURS * 3600_000;
  const status = a.status === "CANCELLED" ? ["CANCELADA", "bg-bad-bg text-bad-fg"] : past ? ["CONCLUÍDA", "bg-[#EFEFEF] text-ink-soft"] : a.status === "PENDING" ? ["POR CONFIRMAR", "bg-warn-bg text-warn-fg"] : ["CONFIRMADA", "bg-ok-bg text-ok-fg"];

  return (
    <Wrap name={s.salonName}>
      <p className="eyebrow">A sua marcação</p>
      <h1 className="mt-2.5 font-serif text-[30px] font-medium leading-tight">
        {a.status === "CANCELLED" ? "Marcação cancelada" : `Olá ${a.customer.name.split(" ")[0]}, até ${longDate(key).split(",")[0]}!`}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">Este link é privado. Não precisa de criar conta.</p>
      {sp.cancelada && <p role="status" className="mt-4 rounded-card bg-ok-bg px-3.5 py-3 text-sm text-ok-fg">Cancelámos a sua marcação. Esperamos vê-la em breve!</p>}
      {sp.tarde && <p role="alert" className="mt-4 rounded-card bg-warn-bg px-3.5 py-3 text-sm text-warn-fg">Faltam menos de {CANCEL_HOURS} horas — para cancelar, fale connosco pelo WhatsApp ou telefone.</p>}

      <div className="card mt-5 overflow-hidden">
        <div className="flex items-center gap-3.5 border-b border-[#F0F0F0] p-4">
          <div className="w-[58px] shrink-0 rounded-card border border-[#DFDFDF] py-1.5 text-center">
            <div className="text-[10px] font-bold tracking-[0.14em] text-brand-text">{MESES[Number(key.slice(5, 7)) - 1].slice(0, 3).toUpperCase()}</div>
            <div className="font-serif text-2xl leading-tight">{Number(key.slice(8))}</div>
            <div className="text-[10px] text-ink-muted">{DIAS_CURTOS[weekdayOf(key)]}</div>
          </div>
          <div>
            <div className="text-base font-bold">{a.service.name}{a.addOn ? ` + ${a.addOn.name}` : ""}</div>
            <div className="mt-0.5 text-[13px] text-ink-soft">{timeOf(a.startAt)} – {timeOf(a.endAt)} · com a {a.staff.name.split(" ")[0]}</div>
            <span className={`mt-2 inline-flex items-center gap-1.5 rounded-btn px-2 py-1 text-[11px] font-bold tracking-[0.08em] ${status[1]}`}>{status[0] === "CONFIRMADA" && <IconCheck size={11} strokeWidth={3} />}{status[0]}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 p-4 text-[13px]">
          <div className="flex justify-between"><span className="text-ink-muted">Total</span><span className="font-semibold">{euro(a.priceCents)} · pagamento no salão</span></div>
          <div className="flex justify-between gap-3"><span className="text-ink-muted">Onde</span><a className="text-right font-semibold underline" href={`https://maps.google.com/?q=${encodeURIComponent(`${s.address}, ${s.postalCode} ${s.city}`)}`} target="_blank" rel="noopener">{s.address}, {s.city}</a></div>
        </div>
      </div>

      {active && !past && (
        <div className="mt-4 flex flex-col gap-2.5">
          <Link href={`/marcar?reagendar=${token}`} className="btn-primary h-[52px]">Remarcar</Link>
          <a href={`/api/ics/${token}`} className="btn-outline"><IconCalendar size={16} />Adicionar ao calendário</a>
        </div>
      )}

      {active && !past && (
        <div className="mt-7 border-t border-[#DFDFDF] pt-5">
          <p className="text-sm font-bold">Não vai conseguir vir?</p>
          <p className="mb-3 mt-1.5 text-[13px] leading-relaxed text-ink-soft">Cancelamento gratuito até {CANCEL_HOURS} horas antes. Depois disso, fale connosco — imprevistos acontecem.</p>
          {canCancel ? (
            <details className="group">
              <summary className="inline-flex min-h-[44px] cursor-pointer list-none items-center text-[13px] font-bold text-bad-fg underline underline-offset-4">Cancelar marcação</summary>
              <form action={cancel} className="mt-2 rounded-card bg-bad-bg p-4">
                <input type="hidden" name="token" value={token} />
                <p className="text-sm text-bad-fg">Tem a certeza? A hora fica livre para outra cliente.</p>
                <button type="submit" className="btn mt-3 h-11 bg-bad-fg text-white">Sim, cancelar</button>
              </form>
            </details>
          ) : null}
        </div>
      )}

      <div className="mt-auto pt-8 text-center text-[13px] text-ink-soft">
        Dúvidas? {s.whatsappButton ? <a href={wa} target="_blank" rel="noopener" className="font-semibold underline">Fale connosco no WhatsApp</a> : <a href={`tel:+${waNumber(s.phone)}`} className="font-semibold underline">{s.phone}</a>}
      </div>
    </Wrap>
  );
}

function Wrap({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-brand-soft">
      <header className="flex h-16 items-center justify-center border-b border-line bg-white">
        <Link href="/" className="font-serif text-[21px]">{name}</Link>
      </header>
      <main className="mx-auto flex min-h-[calc(100dvh-64px)] max-w-[480px] flex-col px-5 py-7">{children}</main>
    </div>
  );
}
