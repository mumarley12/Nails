import type { Config } from "@netlify/functions";

/** Todos os dias às 17h UTC (18h em Lisboa no inverno, 18h/19h no verão): emails de lembrete das marcações de amanhã. */
export default async () => {
  const base = Netlify.env.get("URL");
  const secret = Netlify.env.get("CRON_SECRET");
  if (!base || !secret) return;
  const res = await fetch(`${base}/api/cron/reminders`, { headers: { Authorization: `Bearer ${secret}` } });
  console.log("Lembretes:", res.status, await res.text());
};

export const config: Config = { schedule: "0 17 * * *" };
