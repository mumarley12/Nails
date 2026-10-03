import { findByToken } from "@/lib/booking";
import { getSettings } from "@/lib/settings";
import { buildIcs } from "@/lib/ics";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const a = await findByToken(token);
  if (!a) return new Response("Marcação não encontrada", { status: 404 });
  const s = await getSettings();
  const ics = buildIcs({
    uid: a.id, start: a.startAt, end: a.endAt,
    title: `${a.service.name}${a.addOn ? " + " + a.addOn.name : ""} — ${s.salonName}`,
    location: `${s.address}, ${s.postalCode} ${s.city}`,
    description: `Com ${a.staff.name.split(" ")[0]}. Para alterar: ${(process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")}/m/${token}`,
  });
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="marcacao.ics"', "Cache-Control": "no-store" } });
}
