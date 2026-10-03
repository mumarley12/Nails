import "server-only";
/**
 * SMS via Twilio — EM PAUSA. Só envia quando "SMS" estiver ligado no painel E as variáveis TWILIO_* existirem.
 * Usa a API REST diretamente (sem SDK) e um nome de remetente (ex.: "PolishGlow"), sem número.
 */
export async function sendSms(to: string, body: string): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_SENDER_ID || "PolishGlow";
  if (!sid || !token) return { ok: false, skipped: true, error: "Twilio não configurado" };
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });
  if (!res.ok) return { ok: false, error: `Twilio ${res.status}: ${(await res.text()).slice(0, 300)}` };
  return { ok: true };
}
/** Remove acentos para o SMS caber em 160 caracteres (GSM-7). */
export function smsSafe(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}
