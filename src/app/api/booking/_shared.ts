import { z } from "zod";
import { NextResponse } from "next/server";
import { BookingError, findByToken } from "@/lib/booking";
import { isValidDateKey } from "@/lib/time";

export const idSchema = z.string().min(1).max(64);
export const daySchema = z.string().refine(isValidDateKey, "Data inválida");

export function errorResponse(e: unknown) {
  if (e instanceof BookingError) {
    const status = e.code === "SLOT_TAKEN" ? 409 : e.code === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: e.message, code: e.code }, { status });
  }
  if (e instanceof z.ZodError) return NextResponse.json({ error: "Dados inválidos.", issues: e.issues.map((i) => i.message) }, { status: 400 });
  console.error(e);
  return NextResponse.json({ error: "Ocorreu um erro. Tente de novo ou fale connosco pelo WhatsApp." }, { status: 500 });
}

/** Em modo "remarcar", usa a marcação do link para saber o serviço e ignorar a própria hora. */
export async function fromToken(token: string | null) {
  if (!token) return null;
  const a = await findByToken(token);
  if (!a || !["PENDING", "CONFIRMED"].includes(a.status)) return null;
  return a;
}

export function clientIp(req: Request) {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim();
}
