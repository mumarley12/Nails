import { NextResponse } from "next/server";
import { getSlots } from "@/lib/booking";
import { daySchema, errorResponse, fromToken, idSchema } from "../_shared";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams;
    const appt = await fromToken(q.get("token"));
    const day = daySchema.parse(q.get("day"));
    const slots = await getSlots({
      day,
      serviceId: appt?.serviceId ?? idSchema.parse(q.get("service")),
      addOnId: appt ? appt.addOnId : q.get("addon") ? idSchema.parse(q.get("addon")) : null,
      staffId: appt ? "any" : idSchema.parse(q.get("staff") ?? "any"),
      excludeAppointmentId: appt?.id,
    });
    return NextResponse.json({ slots: slots.map((s) => ({ startMin: s.startMin })) });
  } catch (e) {
    return errorResponse(e);
  }
}
