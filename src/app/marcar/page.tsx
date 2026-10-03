import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata: Metadata = { title: "Fazer marcação", description: "Escolha o serviço, o dia e a hora. Leva menos de um minuto." };

export default async function Page({ searchParams }: { searchParams: Promise<{ servico?: string; reagendar?: string }> }) {
  const sp = await searchParams;
  return <BookingWizard initialServiceId={sp.servico ?? null} rescheduleToken={sp.reagendar ?? null} />;
}
