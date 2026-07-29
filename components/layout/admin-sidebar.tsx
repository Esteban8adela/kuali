"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  locale: string;
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({ locale }: AdminSidebarProps) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const base = `/${locale}/admin`;

  const mainLinks = [
    { href: `${base}/dashboard`, label: t("dashboard"), match: `${base}/dashboard` },
    { href: `${base}/trips`, label: t("tripsNav"), match: `${base}/trips` },
    { href: `${base}/users`, label: t("usersNav"), match: `${base}/users` },
    { href: `${base}/dashboard/guests`, label: t("guests"), match: `${base}/dashboard/guests` },
  ] as const;

  const catalogLinks = [
    { href: `${base}/catalog/ingredients`, label: t("ingredientsNav"), match: `${base}/catalog/ingredients` },
    { href: `${base}/catalog/dishes`, label: t("dishesNav"), match: `${base}/catalog/dishes` },
    { href: `${base}/catalog/kids-menu`, label: t("kidsMenuNav"), match: `${base}/catalog/kids-menu` },
    { href: `${base}/catalog/pantry`, label: t("pantryNav"), match: `${base}/catalog/pantry` },
    { href: `${base}/catalog/beverages`, label: t("beveragesNav"), match: `${base}/catalog/beverages` },
  ] as const;

  return (
    <aside className="fixed top-20 z-20 hidden h-[calc(100dvh-5rem)] w-56 shrink-0 flex-col overflow-y-auto border-r border-[#C4A052]/15 bg-[#0A0A0A] p-6 text-white md:flex">
      <nav className="flex flex-col gap-1 text-sm">
        {mainLinks.map(({ href, label, match }) => {
          const active = isActive(pathname, match);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-lg px-3 py-2.5 font-medium transition",
                active
                  ? "bg-[#C4A052]/20 text-[#C4A052]"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              {label}
            </Link>
          );
        })}

        <p className="mb-1 mt-5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
          {t("catalogSectionTitle")}
        </p>

        {catalogLinks.map(({ href, label, match }) => {
          const active = isActive(pathname, match);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-lg px-3 py-2.5 font-medium transition",
                active
                  ? "bg-[#C4A052]/20 text-[#C4A052]"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
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
