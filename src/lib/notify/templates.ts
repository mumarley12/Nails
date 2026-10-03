/** Textos dos emails (português de Portugal). HTML simples e compatível com clientes de email. */
export type ApptView = {
  id: string; customerName: string; customerEmail: string | null; customerPhone: string;
  serviceName: string; staffName: string; dateLabel: string; timeLabel: string; endLabel: string; priceLabel: string;
  salonName: string; address: string; manageUrl: string | null; icsUrl: string | null; whatsappUrl: string | null;
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

function layout(title: string, intro: string, a: ApptView, extra = "") {
  const row = (k: string, v: string) => `<tr><td style="padding:8px 0;color:#666;font-size:14px">${k}</td><td style="padding:8px 0;font-size:14px;font-weight:600;text-align:right">${esc(v)}</td></tr>`;
  const btn = (href: string, label: string, dark = false) =>
    `<a href="${esc(href)}" style="display:inline-block;margin:6px 6px 0 0;padding:12px 18px;border-radius:2px;font-size:12px;font-weight:700;letter-spacing:.12em;text-decoration:none;${dark ? "background:#A9A9A9;color:#161616" : "border:1px solid #161616;color:#161616"}">${label}</a>`;
  return `<!doctype html><html lang="pt-PT"><body style="margin:0;background:#F7F7F7;font-family:Helvetica,Arial,sans-serif;color:#161616">
<div style="max-width:520px;margin:0 auto;padding:28px 16px">
<div style="font-family:Georgia,serif;font-size:22px;margin-bottom:18px">${esc(a.salonName)}</div>
<div style="background:#fff;border:1px solid #E8E8E8;border-radius:4px;padding:24px">
<h1 style="font-family:Georgia,serif;font-weight:500;font-size:26px;margin:0 0 8px">${esc(title)}</h1>
<p style="font-size:15px;line-height:1.55;color:#444;margin:0 0 16px">${intro}</p>
<table style="width:100%;border-collapse:collapse;border-top:1px solid #eee">
${row("Serviço", a.serviceName)}${row("Dia", a.dateLabel)}${row("Hora", `${a.timeLabel} – ${a.endLabel}`)}${row("Preço", a.priceLabel + " · pagamento no salão")}${row("Morada", a.address)}
</table>
<div style="margin-top:16px">${a.icsUrl ? btn(a.icsUrl, "ADICIONAR AO CALENDÁRIO", true) : ""}${a.manageUrl ? btn(a.manageUrl, "ALTERAR OU CANCELAR") : ""}${a.whatsappUrl ? btn(a.whatsappUrl, "WHATSAPP") : ""}</div>
${extra}
</div>
<p style="font-size:12px;color:#888;margin-top:16px">Recebeu este email porque fez uma marcação no ${esc(a.salonName)}.</p>
</div></body></html>`;
}

const plain = (a: ApptView, head: string) =>
  `${head}\n\n${a.serviceName} com ${a.staffName}\n${a.dateLabel}, ${a.timeLabel}–${a.endLabel}\n${a.address}\n${a.priceLabel} (pagamento no salão)\n${a.manageUrl ? `\nAlterar ou cancelar: ${a.manageUrl}` : ""}`;

export const tpl = {
  confirmed: (a: ApptView) => ({
    subject: `Marcação confirmada — ${a.dateLabel}, ${a.timeLabel}`,
    html: layout("Está marcado!", `Olá ${esc(a.customerName.split(" ")[0])}, a sua marcação está confirmada. Até breve!`, a),
    text: plain(a, `Olá ${a.customerName}, a sua marcação está confirmada.`),
  }),
  reminder: (a: ApptView) => ({
    subject: `Lembrete: amanhã às ${a.timeLabel} no ${a.salonName}`,
    html: layout("Até amanhã!", `Olá ${esc(a.customerName.split(" ")[0])}, lembramos a sua marcação de amanhã.`, a),
    text: plain(a, `Lembrete: a sua marcação é amanhã.`),
  }),
  rescheduled: (a: ApptView) => ({
    subject: `Marcação alterada — ${a.dateLabel}, ${a.timeLabel}`,
    html: layout("Marcação alterada", `Olá ${esc(a.customerName.split(" ")[0])}, a sua marcação passou para o novo dia e hora abaixo.`, a),
    text: plain(a, `A sua marcação foi alterada.`),
  }),
  cancelled: (a: ApptView) => ({
    subject: `Marcação cancelada — ${a.dateLabel}, ${a.timeLabel}`,
    html: layout("Marcação cancelada", `Olá ${esc(a.customerName.split(" ")[0])}, a sua marcação foi cancelada. Pode marcar de novo quando quiser.`, { ...a, manageUrl: null, icsUrl: null }),
    text: plain({ ...a, manageUrl: null }, `A sua marcação foi cancelada.`),
  }),
  salonAlert: (a: ApptView, kind: "nova" | "alterada" | "cancelada", adminUrl: string) => ({
    subject: `${kind === "nova" ? "Nova marcação" : kind === "alterada" ? "Marcação alterada" : "Marcação cancelada"}: ${a.customerName} · ${a.dateLabel} ${a.timeLabel}`,
    html: `<!doctype html><html lang="pt-PT"><body style="font-family:Helvetica,Arial,sans-serif;color:#161616">
<p style="font-size:16px"><strong>${kind === "nova" ? "Nova marcação" : kind === "alterada" ? "Marcação alterada" : "Marcação cancelada"}</strong></p>
<p style="font-size:15px;line-height:1.6">${esc(a.customerName)} · ${esc(a.customerPhone)}<br>${esc(a.serviceName)} com ${esc(a.staffName)}<br>${esc(a.dateLabel)}, ${a.timeLabel}–${a.endLabel} · ${esc(a.priceLabel)}</p>
<p><a href="${esc(adminUrl)}">Abrir no painel</a></p></body></html>`,
    text: `${a.customerName} · ${a.customerPhone}\n${a.serviceName} com ${a.staffName}\n${a.dateLabel}, ${a.timeLabel}–${a.endLabel}\n${adminUrl}`,
  }),
};
