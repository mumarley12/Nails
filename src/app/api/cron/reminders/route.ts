import { NextResponse } from "next/server";
import { sendTomorrowReminders } from "@/lib/notify";

/** Lembretes por email das marcações de amanhã. Chamado pela Vercel Cron (ver vercel.json). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const sent = await sendTomorrowReminders();
  return NextResponse.json({ ok: true, sent });
}
