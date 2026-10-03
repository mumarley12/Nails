import { NextResponse } from "next/server";
import { z } from "zod";
import { currentAdmin } from "@/lib/auth";
import { createBooking } from "@/lib/booking";
import { normalizePhone } from "@/lib/phone";
import { daySchema, errorResponse, idSchema } from "../../booking/_shared";

const Body = z.object({
  serviceId: idSchema, addOnId: idSchema.nullish(), staffId: z.union([z.literal("any"), idSchema]), day: daySchema,
  startMin: z.number().int().min(0).max(1440), name: z.string().trim().min(2).max(80), phone: z.string().trim().min(9).max(20),
  email: z.union([z.literal(""), z.email()]).nullish(), notes: z.string().max(500).nullish(), status: z.enum(["PENDING", "CONFIRMED"]).default("CONFIRMED"),
});

export async function POST(req: Request) {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });
  try {
    const b = Body.parse(await req.json());
    const phone = normalizePhone(b.phone);
    if (!phone) return NextResponse.json({ error: "Telemóvel inválido." }, { status: 400 });
    const r = await createBooking({ ...b, phone, email: b.email || null, notes: b.notes || null, consent: true, source: "ADMIN" });
    return NextResponse.json({ ok: true, id: r.id });
  } catch (e) {
    return errorResponse(e);
  }
}
