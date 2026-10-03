import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata: Metadata = { title: "Fazer marcação", description: "Escolha o serviço, o dia e a hora. Leva menos de um minuto." };

export default async function Page({ searchParams }: { searchParams: Promise<{ servico?: string; reagendar?: string; dia?: string; hora?: string }> }) {
  const sp = await searchParams;
  const dia = sp.dia && /^\d{4}-\d{2}-\d{2}$/.test(sp.dia) ? sp.dia : null;
  const hora = sp.hora && /^\d{1,4}$/.test(sp.hora) && Number(sp.hora) < 1440 ? Number(sp.hora) : null;
  return <BookingWizard initialServiceId={sp.servico ?? null} rescheduleToken={sp.reagendar ?? null} initialDay={dia} initialStart={hora} />;
}
