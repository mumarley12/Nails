import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";
import { BottomNav, SideNav } from "@/components/admin/Nav";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: { default: "Painel", template: "%s · Painel" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

async function logout() {
  "use server";
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, s] = await Promise.all([requireAdmin({ allowPasswordChange: true }), getSettings()]);
  return (
    <div className="min-h-dvh bg-[#F8F8F8] lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col gap-6 border-r border-line bg-white px-4 py-6 lg:flex">
        <Link href="/admin" className="px-2 leading-none">
          <span className="block font-serif text-[21px]">{s.salonName}</span>
          <span className="mt-1.5 block text-[9px] font-bold tracking-[0.3em] text-[#8A8A8A]">PAINEL DO SALÃO</span>
        </Link>
        <SideNav />
        <div className="mt-auto flex items-center gap-2.5 border-t border-[#F0F0F0] px-2 pt-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#D3D3D3] font-serif">{admin.name.charAt(0)}</span>
          <Link href="/admin/conta" className="min-w-0 flex-1 text-[13px] leading-tight hover:underline"><b className="block truncate">{admin.name}</b><span className="text-ink-muted">A minha conta</span></Link>
          <form action={logout}><button type="submit" className="text-xs font-semibold text-ink-muted underline">Sair</button></form>
        </div>
      </aside>
      <div className="min-w-0 flex-1 pb-24 lg:pb-10">
        <div className="flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
          <Link href="/admin" className="font-serif text-lg">{s.salonName}</Link>
          <form action={logout}><button type="submit" className="h-11 px-2 text-xs font-semibold text-ink-muted underline">Sair</button></form>
        </div>
        <main className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 lg:px-10 lg:py-8">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
