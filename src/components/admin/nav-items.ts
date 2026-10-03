import { IconBell, IconBottle, IconCalendar, IconChart, IconClock, IconHome, IconImage, IconList, IconUsers } from "@/components/icons";

/** Itens do menu do painel (ficheiro sem "use client", para poder ser usado em páginas do servidor). */
export const NAV = [
  { href: "/admin", label: "Visão Geral", short: "Início", icon: IconHome, mobile: true },
  { href: "/admin/agenda", label: "Agenda", short: "Agenda", icon: IconCalendar, mobile: true },
  { href: "/admin/marcacoes", label: "Marcações", short: "Marcações", icon: IconList, mobile: true },
  { href: "/admin/horario", label: "Horário semanal", short: "Horário", icon: IconClock, mobile: true },
  { href: "/admin/clientes", label: "Clientes", short: "Clientes", icon: IconUsers },
  { href: "/admin/servicos", label: "Serviços e preços", short: "Serviços", icon: IconBottle },
  { href: "/admin/site", label: "O Meu Site", short: "Site", icon: IconImage },
  { href: "/admin/relatorios", label: "Relatórios", short: "Relatórios", icon: IconChart },
  { href: "/admin/notificacoes", label: "Notificações", short: "Avisos", icon: IconBell },
];
