import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { SubmitButton } from "@/components/admin/SubmitButton";

export const metadata: Metadata = { title: "Entrar no painel", robots: { index: false } };

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!(await rateLimit(`login:${ip}`, 10, 900))) redirect("/admin/login?erro=muitas");
  const [u] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, email)).limit(1);
  // Compara sempre (mesmo sem utilizador) para não revelar quais emails existem.
  const ok = await bcrypt.compare(password, u?.passwordHash ?? "$2b$12$E2HIvsGkWlm9AFXPUcjoE.dYGWN0f2rO48NbD.iBGGZ1OME.UexRy");
  if (!u || !ok) redirect("/admin/login?erro=1");
  (await cookies()).set(SESSION_COOKIE, await signSession(u.id), sessionCookieOptions);
  redirect("/admin");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center bg-brand-soft px-5">
      <form action={login} className="card w-full max-w-sm p-7">
        <p className="font-serif text-2xl">Polish <em className="text-brand-text">&amp;</em> Glow</p>
        <p className="mt-1 text-[10px] font-bold tracking-[0.3em] text-[#8A8A8A]">PAINEL DO SALÃO</p>
        <h1 className="mt-6 font-serif text-[26px] font-medium">Entrar</h1>
        {erro && <p role="alert" className="mt-3 rounded-card bg-bad-bg px-3 py-2.5 text-sm text-bad-fg">{erro === "muitas" ? "Demasiadas tentativas. Espere 15 minutos." : "Email ou password incorretos."}</p>}
        <label htmlFor="email" className="label mt-5">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field h-12 text-base" />
        <label htmlFor="password" className="label mt-4">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field h-12 text-base" />
        <SubmitButton className="btn-primary mt-6 w-full">Entrar</SubmitButton>
      </form>
    </main>
  );
}
