import "server-only";
import webpush from "web-push";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

let configured = false;
function setup(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:ola@polishandglow.pt", pub, priv);
  configured = true;
  return true;
}

/** Envia uma notificação para todos os telemóveis da equipa que ativaram avisos. Devolve quantos receberam. */
export async function pushToAdmins(payload: { title: string; body: string; url: string }): Promise<{ sent: number; error?: string }> {
  if (!setup()) return { sent: 0, error: "Chaves VAPID em falta" };
  const subs = await db.select().from(schema.pushSubscriptions);
  let sent = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 60 * 60 * 6 });
      sent++;
    } catch (e: unknown) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, s.id));
    }
  }));
  return { sent };
}
