import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { Card, Flash, PageHead } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";

export const metadata = { title: "A minha conta" };
const go = (q: string) => redirect(`/admin/conta?${q}`);

async function changePassword(fd: FormData) {
  "use server";
  const admin = await requireAdmin({ allowPasswordChange: true });
  if (!(await rateLimit(`pwd:${admin.id}`, 10, 900))) go("erro=" + encodeURIComponent("Demasiadas tentativas. Espere 15 minutos."));
  const current = String(fd.get("current") ?? ""), next = String(fd.get("next") ?? ""), again = String(fd.get("again") ?? "");
  const [u] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, admin.id)).limit(1);
  const back = admin.mustChangePassword ? "primeira=1&" : "";
  if (!u || !(await bcrypt.compare(current, u.passwordHash))) go(back + "erro=" + encodeURIComponent("A password atual não está certa."));
  if (next.length < 10) go(back + "erro=" + encodeURIComponent("A password nova tem de ter pelo menos 10 caracteres."));
  if (next !== again) go(back + "erro=" + encodeURIComponent("As duas passwords novas não são iguais."));
  if (next === current) go(back + "erro=" + encodeURIComponent("Escolha uma password diferente da atual."));
  await db.update(schema.adminUsers).set({ passwordHash: await bcrypt.hash(next, 12), mustChangePassword: false }).where(eq(schema.adminUsers.id, admin.id));
  redirect(admin.mustChangePassword ? "/admin" : "/admin/conta?ok=" + encodeURIComponent("Password alterada."));
}

async function changeProfile(fd: FormData) {
  "use server";
  const admin = await requireAdmin();
  const name = String(fd.get("name") ?? "").trim().slice(0, 80);
  const email = String(fd.get("email") ?? "").trim().toLowerCase().slice(0, 120);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) go("erro=" + encodeURIComponent("Verifique o nome e o email."));
  const [taken] = await db.select({ id: schema.adminUsers.id }).from(schema.adminUsers).where(and(eq(schema.adminUsers.email, email), ne(schema.adminUsers.id, admin.id))).limit(1);
  if (taken) go("erro=" + encodeURIComponent("Esse email já está a ser usado noutra conta."));
  await db.update(schema.adminUsers).set({ name, email }).where(eq(schema.adminUsers.id, admin.id));
  go("ok=" + encodeURIComponent("Dados guardados. Use o novo email no próximo login."));
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const admin = await requireAdmin({ allowPasswordChange: true });
  const sp = await searchParams;
  const first = admin.mustChangePassword;
  return (
    <div className="flex max-w-xl flex-col gap-5">
      <PageHead title="A minha conta" sub={admin.email} />
      {first && <p role="status" className="rounded-card bg-warn-bg px-4 py-3 text-sm text-warn-fg"><b>Bem-vinda!</b> Por segurança, escolha agora uma password nova só sua. Depois disto pode usar o painel normalmente.</p>}
      <Flash ok={sp.ok} error={sp.erro} />
      <Card title="Mudar password">
        <form action={changePassword} className="flex flex-col gap-3.5 p-5">
          <div><label className="label" htmlFor="current">Password atual</label><input id="current" name="current" type="password" autoComplete="current-password" required className="field h-12 text-base" /></div>
          <div><label className="label" htmlFor="next">Password nova <span className="font-normal text-ink-muted">(10 ou mais caracteres)</span></label><input id="next" name="next" type="password" autoComplete="new-password" minLength={10} required className="field h-12 text-base" /></div>
          <div><label className="label" htmlFor="again">Repetir password nova</label><input id="again" name="again" type="password" autoComplete="new-password" minLength={10} required className="field h-12 text-base" /></div>
          <p className="text-xs text-ink-muted">Dica: uma frase fácil de lembrar, como “unhas-bonitas-em-lisboa”, é mais segura do que uma palavra curta.</p>
          <SubmitButton className="btn-primary h-12 self-start px-6">Guardar password</SubmitButton>
        </form>
      </Card>
      {!first && (
        <Card title="Nome e email de acesso">
          <form action={changeProfile} className="flex flex-col gap-3.5 p-5">
            <div><label className="label" htmlFor="name">Nome</label><input id="name" name="name" defaultValue={admin.name} required className="field" /></div>
            <div><label className="label" htmlFor="email">Email para entrar no painel</label><input id="email" name="email" type="email" defaultValue={admin.email} required className="field" /></div>
            <SubmitButton className="btn-outline h-11 self-start px-5">Guardar</SubmitButton>
          </form>
        </Card>
      )}
    </div>
  );
}
