import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Política de Privacidade" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await getSettings();
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 text-[15px] leading-relaxed text-[#333]">
      <Link href="/" className="text-sm underline">← Voltar ao site</Link>
      <h1 className="mt-6 font-serif text-4xl font-medium text-ink">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-ink-muted">Texto base — reveja-o antes de publicar.</p>
      <h2 className="mt-8 font-serif text-2xl text-ink">Quem somos</h2>
      <p className="mt-2">{s.salonName}, {s.address}, {s.postalCode} {s.city}. Contacto: {s.email} · {s.phone}.</p>
      <h2 className="mt-8 font-serif text-2xl text-ink">Que dados guardamos e para quê</h2>
      <p className="mt-2">Quando faz uma marcação guardamos o nome, o telemóvel, o email (se o indicar), as observações e o histórico de marcações. Usamos estes dados apenas para gerir as suas marcações: confirmar, lembrar, alterar ou cancelar, e contactá-la se for preciso. A base legal é a execução do serviço que pediu e o seu consentimento.</p>
      <h2 className="mt-8 font-serif text-2xl text-ink">Com quem partilhamos</h2>
      <p className="mt-2">Não vendemos nem partilhamos os seus dados para publicidade. Usamos prestadores técnicos para alojar o site, guardar os dados e enviar emails, que só os tratam por nossa conta.</p>
      <h2 className="mt-8 font-serif text-2xl text-ink">Durante quanto tempo</h2>
      <p className="mt-2">Guardamos os dados enquanto for nossa cliente e até 24 meses após a última marcação, salvo obrigação legal.</p>
      <h2 className="mt-8 font-serif text-2xl text-ink">Os seus direitos</h2>
      <p className="mt-2">Pode pedir para ver, corrigir ou apagar os seus dados a qualquer momento, por email para {s.email}. Pode também apresentar reclamação à CNPD (www.cnpd.pt).</p>
    </main>
  );
}
