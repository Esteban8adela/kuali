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
  const ta = useTranslations("admin");
  const pathname = usePathname();
  const base = `/${locale}/chef`;
  const catalog = `${base}/catalog`;

  const links = [
    {
      href: `${base}/dashboard`,
      label: t("nav.dashboard"),
      isActive: (path: string) =>
        path.includes("/chef/dashboard") || path.includes("/chef/trip"),
    },
    {
      href: `${base}/history`,
      label: t("nav.history"),
      isActive: (path: string) => path.includes("/chef/history"),
    },
    {
      href: `${catalog}/dishes`,
      label: ta("dishesNav"),
      isActive: (path: string) => path.includes("/chef/catalog/dishes"),
    },
    {
      href: `${catalog}/kids-menu`,
      label: ta("kidsMenuNav"),
      isActive: (path: string) => path.includes("/chef/catalog/kids-menu"),
    },
    {
      href: `${catalog}/pantry`,
      label: ta("pantryNav"),
      isActive: (path: string) => path.includes("/chef/catalog/pantry"),
    },
    {
      href: `${catalog}/beverages`,
      label: ta("beveragesNav"),
      isActive: (path: string) => path.includes("/chef/catalog/beverages"),
    },
    {
      href: `${catalog}/ingredients`,
      label: ta("ingredientsNav"),
      isActive: (path: string) => path.includes("/chef/catalog/ingredients"),
    },
  ] as const;

  return (
    <aside className="fixed top-20 z-20 hidden h-[calc(100dvh-5rem)] w-56 shrink-0 flex-col overflow-y-auto border-r border-[#C4A052]/15 bg-[#1B3A4B] p-6 text-white md:flex print:hidden">
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
