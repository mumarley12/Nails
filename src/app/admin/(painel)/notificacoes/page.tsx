import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { sendEmail } from "@/lib/notify/email";
import { pushToAdmins } from "@/lib/notify/push";
import { dateKey, shortDate, timeOf } from "@/lib/time";
import { Card, Flash, PageHead, Switch } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { PushToggle } from "@/components/admin/PushToggle";

export const metadata = { title: "Notificações" };

async function save(fd: FormData) {
  "use server";
  await requireAdmin();
  await getSettings();
  await db.update(schema.siteSettings).set({
    emailConfirmations: fd.get("emailConfirmations") === "on", whatsappButton: fd.get("whatsappButton") === "on",
    alertByEmail: fd.get("alertByEmail") === "on", alertByPush: fd.get("alertByPush") === "on",
    alertEmail: String(fd.get("alertEmail") ?? "").trim().slice(0, 120),
  }).where(eq(schema.siteSettings.id, 1));
  revalidatePath("/");
  redirect("/admin/notificacoes?ok=" + encodeURIComponent("Guardado."));
}
async function test(fd: FormData) {
  "use server";
  await requireAdmin();
  const s = await getSettings();
  if (fd.get("what") === "push") {
    const r = await pushToAdmins({ title: "Teste", body: "Os avisos de novas marcações estão a funcionar.", url: "/admin" });
    redirect("/admin/notificacoes?" + (r.sent ? "ok=" + encodeURIComponent(`Aviso enviado para ${r.sent} aparelho(s).`) : "erro=" + encodeURIComponent(r.error ?? "Nenhum aparelho com avisos ativos.")));
  }
  const r = await sendEmail(s.alertEmail, "Teste de email — Polish & Glow", "<p>Os emails estão a funcionar.</p>", "Os emails estão a funcionar.");
  redirect("/admin/notificacoes?" + (r.ok ? "ok=" + encodeURIComponent(`Email enviado para ${s.alertEmail}.`) : "erro=" + encodeURIComponent(r.error)));
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const s = await getSettings();
  const logs = await db.select().from(schema.notificationLogs).orderBy(desc(schema.notificationLogs.createdAt)).limit(30);
  const emailReady = !!process.env.RESEND_API_KEY;
  return (
    <div className="flex flex-col gap-6">
      <PageHead title="Notificações" sub="Como as clientes recebem a confirmação e como a equipa sabe das marcações novas." />
      <Flash ok={sp.ok} error={sp.erro} />
      <div role="status" className="rounded-card border border-[#DFDFDF] bg-brand-soft px-4 py-3.5 text-sm leading-relaxed"><b>SMS em pausa — sem custos.</b> As marcações funcionam na mesma: confirmação no ecrã e por email, calendário e WhatsApp.</div>
      {!emailReady && <p className="rounded-card bg-warn-bg px-4 py-3 text-sm text-warn-fg">Os emails ainda não estão ligados: falta a chave <code>RESEND_API_KEY</code> (ver README).</p>}

      <form action={save} className="grid gap-6 lg:grid-cols-2">
        <Card title="Para as clientes">
          <div className="divide-y divide-[#F2F2F2] px-5">
            <Switch name="emailConfirmations" defaultChecked={s.emailConfirmations} label="Email de confirmação e lembrete" hint="Confirmação ao marcar, alterar ou cancelar, e lembrete na véspera às 18h. Só se a cliente indicar o email." />
            <Switch name="whatsappButton" defaultChecked={s.whatsappButton} label="Botão de WhatsApp no site" hint="Para dúvidas: abre uma conversa com o salão." />
            <div className="py-3 text-[13px] text-ink-muted">Sempre ativos: confirmação no ecrã, “Adicionar ao calendário” e o link privado para alterar ou cancelar.</div>
          </div>
        </Card>
        <Card title="Avisos para a manicure">
          <div className="divide-y divide-[#F2F2F2] px-5">
            <Switch name="alertByEmail" defaultChecked={s.alertByEmail} label="Email para o salão" hint="A cada marcação nova, alteração ou cancelamento feito pela cliente." />
            <div className="py-3"><label className="label" htmlFor="alertEmail">Enviar para</label><input id="alertEmail" name="alertEmail" type="email" defaultValue={s.alertEmail} className="field" /></div>
            <Switch name="alertByPush" defaultChecked={s.alertByPush} label="Notificação no telemóvel" hint="Aparece como uma mensagem. Ative em cada aparelho, abaixo." />
          </div>
        </Card>
        <div className="lg:col-span-2"><SubmitButton className="btn-primary h-11 px-6">Guardar</SubmitButton></div>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Avisos neste aparelho">
          <div className="flex flex-col gap-3 p-5">
            <PushToggle vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />
            <form action={test} className="flex flex-wrap gap-2">
              <button name="what" value="push" className="btn-outline h-10 px-4 text-[11px]">Testar aviso</button>
              <button name="what" value="email" className="btn-outline h-10 px-4 text-[11px]">Testar email</button>
            </form>
          </div>
        </Card>
        <Card title="Últimos avisos enviados">
          <ul className="divide-y divide-[#F2F2F2] px-5 text-[13px]">
            {logs.length === 0 && <li className="py-6 text-ink-muted">Ainda nada.</li>}
            {logs.map((l) => (
              <li key={l.id} className="flex justify-between gap-3 py-2.5">
                <span className="min-w-0"><span className="block truncate">{l.channel === "EMAIL" ? "Email" : l.channel === "PUSH" ? "Telemóvel" : "SMS"} · {l.recipient}</span><span className="text-xs text-ink-muted">{shortDate(dateKey(l.createdAt))}, {timeOf(l.createdAt)}{l.error ? ` · ${l.error.slice(0, 60)}` : ""}</span></span>
                <span className={`shrink-0 font-semibold ${l.status === "SENT" ? "text-ok-fg" : l.status === "FAILED" ? "text-bad-fg" : "text-ink-muted"}`}>{l.status === "SENT" ? "Enviado" : l.status === "FAILED" ? "Falhou" : "Não enviado"}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
