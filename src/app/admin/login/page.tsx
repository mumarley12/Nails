import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import bcrypt from "bcryptjs";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { SubmitButton } from "@/components/admin/SubmitButton";

export const metadata: Metadata = { title: "Entrar no painel", robots: { index: false } };

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!(await rateLimit(`login:${ip}`, 10, 900))) redirect("/admin/login?erro=muitas");
  // Entrar só com a password: compara com a(s) conta(s) do painel (normalmente só a da Matilde).
  const users = await db.select().from(schema.adminUsers).orderBy(asc(schema.adminUsers.createdAt)).limit(5);
  let u: (typeof users)[number] | undefined;
  for (const x of users) if (await bcrypt.compare(password, x.passwordHash)) { u = x; break; }
  if (!users.length) await bcrypt.compare(password, "$2b$12$E2HIvsGkWlm9AFXPUcjoE.dYGWN0f2rO48NbD.iBGGZ1OME.UexRy");
  if (!u) redirect("/admin/login?erro=1");
  (await cookies()).set(SESSION_COOKIE, await signSession(u.id), sessionCookieOptions);
  redirect(u.mustChangePassword ? "/admin/conta?primeira=1" : "/admin");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center bg-brand-soft px-5">
      <form action={login} className="card w-full max-w-sm p-7">
        <p className="font-serif text-2xl">Luxe <em className="text-brand-text">Nails</em></p>
        <p className="mt-1 text-[10px] font-bold tracking-[0.3em] text-[#8A8A8A]">PAINEL DO SALÃO</p>
        <h1 className="mt-6 font-serif text-[26px] font-medium">Entrar</h1>
        {erro && <p role="alert" className="mt-3 rounded-card bg-bad-bg px-3 py-2.5 text-sm text-bad-fg">{erro === "muitas" ? "Demasiadas tentativas. Espere 15 minutos." : "Password errada."}</p>}
        <input type="hidden" name="username" value="painel" autoComplete="username" />
        <label htmlFor="password" className="label mt-5">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus className="field h-12 text-base" />
        <p className="mt-2 text-xs text-ink-muted">Pode mudar a password no painel, em Mais › A minha conta.</p>
        <SubmitButton className="btn-primary mt-6 w-full">Entrar</SubmitButton>
      </form>
    </main>
  );
}
