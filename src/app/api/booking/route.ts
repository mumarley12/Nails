import { NextResponse } from "next/server";
import { z } from "zod";
import { createBooking } from "@/lib/booking";
import { normalizePhone } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, daySchema, errorResponse, idSchema } from "./_shared";

const Body = z.object({
  serviceId: idSchema,
  addOnId: idSchema.nullish(),
  staffId: z.union([z.literal("any"), idSchema]),
  day: daySchema,
  startMin: z.number().int().min(0).max(24 * 60),
  name: z.string().trim().min(2, "Indique o nome.").max(80),
  phone: z.string().trim().min(9).max(20),
  email: z.union([z.literal(""), z.email("Email inválido.").max(120)]).nullish(),
  notes: z.string().trim().max(500).nullish(),
  consent: z.literal(true, { message: "É preciso aceitar o uso dos dados para gerir a marcação." }),
  website: z.string().max(0).optional(), // armadilha anti-robôs (campo escondido)
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const phone = normalizePhone(body.phone);
    if (!phone) return NextResponse.json({ error: "Indique um telemóvel válido (9 dígitos, começa por 9)." }, { status: 400 });
    if (!(await rateLimit(`book:ip:${clientIp(req)}`, 8, 600)) || !(await rateLimit(`book:phone:${phone}`, 4, 86400))) {
      return NextResponse.json({ error: "Demasiadas tentativas. Tente mais tarde ou fale connosco pelo WhatsApp." }, { status: 429 });
    }
    const r = await createBooking({ ...body, phone, email: body.email || null, notes: body.notes || null, consent: true, source: "ONLINE" });
    return NextResponse.json({ ok: true, token: r.token });
  } catch (e) {
    return errorResponse(e);
  }
}
