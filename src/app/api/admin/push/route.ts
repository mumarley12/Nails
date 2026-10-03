import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentAdmin } from "@/lib/auth";

const Sub = z.object({ endpoint: z.url().max(1000), keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }) });

export async function POST(req: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });
  const parsed = Sub.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Subscrição inválida" }, { status: 400 });
  const { endpoint, keys } = parsed.data;
  await db.insert(schema.pushSubscriptions).values({ endpoint, p256dh: keys.p256dh, auth: keys.auth, adminId: admin.id })
    .onConflictDoUpdate({ target: schema.pushSubscriptions.endpoint, set: { p256dh: keys.p256dh, auth: keys.auth, adminId: admin.id } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });
  const { endpoint } = await req.json().catch(() => ({ endpoint: "" }));
  if (endpoint) await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.endpoint, String(endpoint)));
  return NextResponse.json({ ok: true });
}
