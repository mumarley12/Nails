import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { getSlots } from "@/lib/booking";
import { daySchema, errorResponse, idSchema } from "../../booking/_shared";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });
  try {
    const q = new URL(req.url).searchParams;
    const slots = await getSlots({
      day: daySchema.parse(q.get("day")), serviceId: idSchema.parse(q.get("service")),
      addOnId: q.get("addon") || null, staffId: q.get("staff") || "any", excludeAppointmentId: q.get("exclude") || undefined, leadMin: 0,
    });
    return NextResponse.json({ slots });
  } catch (e) {
    return errorResponse(e);
  }
}
