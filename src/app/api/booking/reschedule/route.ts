import { NextResponse } from "next/server";
import { z } from "zod";
import { rescheduleAppointment } from "@/lib/booking";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, daySchema, errorResponse, fromToken } from "../_shared";

const Body = z.object({ token: z.string().min(10).max(64), day: daySchema, startMin: z.number().int().min(0).max(1440) });

export async function POST(req: Request) {
  try {
    const b = Body.parse(await req.json());
    if (!(await rateLimit(`resched:${clientIp(req)}`, 10, 600))) return NextResponse.json({ error: "Demasiadas tentativas." }, { status: 429 });
    const a = await fromToken(b.token);
    if (!a) return NextResponse.json({ error: "Link inválido ou marcação já cancelada." }, { status: 404 });
    await rescheduleAppointment({ id: a.id, day: b.day, startMin: b.startMin, staffId: "any", byClient: true, token: b.token });
    return NextResponse.json({ ok: true, token: b.token });
  } catch (e) {
    return errorResponse(e);
  }
}
