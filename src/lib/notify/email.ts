import "server-only";

export type EmailResult = { ok: true } | { ok: false; error: string; skipped?: boolean };

/** Envia um email pela API da Resend. Sem RESEND_API_KEY, só escreve nos registos (útil em testes). */
export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Luxe Nails <onboarding@resend.dev>";
  if (!key) {
    console.info(`[email desligado] Para: ${to} · ${subject}\n${text}`);
    return { ok: false, error: "RESEND_API_KEY em falta", skipped: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html, text }),
    });
    if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${(await res.text()).slice(0, 300)}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
