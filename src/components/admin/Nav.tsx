"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBell, IconBottle, IconCalendar, IconChart, IconHome, IconImage, IconList, IconUsers } from "@/components/icons";

export const NAV = [
  { href: "/admin", label: "Visão Geral", short: "Início", icon: IconHome, mobile: true },
  { href: "/admin/agenda", label: "Agenda", short: "Agenda", icon: IconCalendar, mobile: true },
  { href: "/admin/marcacoes", label: "Marcações", short: "Marcações", icon: IconList, mobile: true },
  { href: "/admin/clientes", label: "Clientes", short: "Clientes", icon: IconUsers, mobile: true },
  { href: "/admin/servicos", label: "Serviços e Equipa", short: "Serviços", icon: IconBottle },
  { href: "/admin/site", label: "O Meu Site", short: "Site", icon: IconImage },
  { href: "/admin/relatorios", label: "Relatórios", short: "Relatórios", icon: IconChart },
  { href: "/admin/notificacoes", label: "Notificações", short: "Avisos", icon: IconBell },
];

const isActive = (path: string, href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

export function SideNav() {
  const path = usePathname();
  return (
    <nav aria-label="Menu do painel" className="flex flex-col gap-0.5 text-sm font-medium">
      {NAV.map((n) => {
        const on = isActive(path, n.href);
        return (
          <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined}
            className={`flex h-[42px] items-center gap-3 rounded-card px-3 ${on ? "bg-[#E9E9E9] font-bold text-ink" : "text-[#3A3A3A] hover:bg-brand-soft"}`}>
            <n.icon size={18} />{n.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const path = usePathname();
  const items = NAV.filter((n) => n.mobile);
  const moreActive = !items.some((n) => isActive(path, n.href));
  return (
    <nav aria-label="Menu do painel" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      {items.map((n) => {
        const on = isActive(path, n.href);
        return (
          <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={`flex h-16 flex-col items-center justify-center gap-1 text-[10.5px] ${on ? "font-bold text-ink" : "font-semibold text-ink-muted"}`}>
            <n.icon size={22} />{n.short}
          </Link>
        );
      })}
      <Link href="/admin/mais" aria-current={moreActive ? "page" : undefined} className={`flex h-16 flex-col items-center justify-center gap-1 text-[10.5px] ${moreActive ? "font-bold text-ink" : "font-semibold text-ink-muted"}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>Mais
      </Link>
    </nav>
  );
}
