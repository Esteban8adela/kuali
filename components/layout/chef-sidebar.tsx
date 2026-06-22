"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ChefSidebarProps {
  locale: string;
}

export function ChefSidebar({ locale }: ChefSidebarProps) {
  const t = useTranslations("chef");
  const pathname = usePathname();
  const base = `/${locale}/chef`;

  const links = [
    {
      href: `${base}/dashboard`,
      label: t("nav.dashboard"),
      isActive: (path: string) =>
        path.includes("/chef/dashboard") || path.includes("/chef/trip"),
    },
    { href: `${base}/history`, label: t("nav.history"), isActive: (path: string) => path.includes("/chef/history") },
    { href: `${base}/catalog`, label: t("nav.catalogs"), isActive: (path: string) => path.includes("/chef/catalog") },
  ] as const;

  return (
    <aside className="fixed top-20 z-20 hidden h-[calc(100dvh-5rem)] w-56 shrink-0 flex-col overflow-y-auto border-r border-[#C4A052]/15 bg-[#1B3A4B] p-6 text-white md:flex">
      <nav className="flex flex-col gap-1 text-sm">
        {links.map(({ href, label, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-lg px-3 py-2.5 font-medium transition",
                active
                  ? "bg-white/15 text-[#C4A052]"
                  : "text-white/85 hover:bg-white/10 hover:text-white"
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
