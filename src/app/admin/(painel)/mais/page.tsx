import Link from "next/link";
import { NAV } from "@/components/admin/Nav";
import { PageHead } from "@/components/admin/ui";

export default function Page() {
  return (
    <div className="flex flex-col gap-5">
      <PageHead title="Mais" />
      <nav className="card divide-y divide-[#F0F0F0]">
        {NAV.filter((n) => !n.mobile).map((n) => (
          <Link key={n.href} href={n.href} className="flex h-14 items-center gap-3 px-5 text-[15px] font-semibold"><n.icon size={20} />{n.label}</Link>
        ))}
        <Link href="/" className="flex h-14 items-center gap-3 px-5 text-[15px] font-semibold">Ver o site →</Link>
      </nav>
    </div>
  );
}
