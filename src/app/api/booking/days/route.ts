import { NextResponse } from "next/server";
import { getDaySummary } from "@/lib/booking";
import { dateKey } from "@/lib/time";
import { daySchema, errorResponse, fromToken, idSchema } from "../_shared";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams;
    const appt = await fromToken(q.get("token"));
    const serviceId = appt?.serviceId ?? idSchema.parse(q.get("service"));
    const addOnId = appt ? appt.addOnId : q.get("addon") ? idSchema.parse(q.get("addon")) : null;
    const staffId = appt ? "any" : idSchema.parse(q.get("staff") ?? "any");
    const fromDay = q.get("from") ? daySchema.parse(q.get("from")) : dateKey(new Date());
    const days = Math.min(42, Math.max(1, Number(q.get("days") ?? 14)));
    return NextResponse.json({ days: await getDaySummary({ fromDay, days, serviceId, addOnId, staffId, excludeAppointmentId: appt?.id }) });
  } catch (e) {
    return errorResponse(e);
  }
}
