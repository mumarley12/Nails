import { NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "../booking/_shared";

export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.string().trim().min(2, "Escreva o seu nome.").max(40),
  text: z.string().trim().min(5, "Escreva um pouco mais.").max(400, "Máximo 400 caracteres."),
  rating: z.coerce.number().int().min(1, "Escolha de 1 a 5 estrelas.").max(5),
  website: z.string().max(0).optional(), // armadilha anti-robôs
});

/** Uma cliente deixa um feedback no site. Fica escondido até a Matilde o aprovar no painel. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  if (!(await rateLimit(`feedback:ip:${clientIp(req)}`, 3, 86400))) return NextResponse.json({ error: "Já enviou feedbacks hoje. Obrigada!" }, { status: 429 });
  await db.insert(schema.reviews).values({ name: parsed.data.name, text: parsed.data.text, rating: parsed.data.rating, visible: false });
  return NextResponse.json({ ok: true });
}
