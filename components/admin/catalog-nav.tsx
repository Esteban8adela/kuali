"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface CatalogNavProps {
  locale: string;
}

export function CatalogNav({ locale }: CatalogNavProps) {
  const t = useTranslations("admin.catalog");
  const pathname = usePathname();
  const base = `/${locale}/admin/catalog`;

  const tabs = [
    { href: `${base}/ingredients`, label: t("ingredientsTab") },
    { href: `${base}/dishes`, label: t("dishesTab") },
  ] as const;

  return (
    <div className="mb-8 border-b border-[#1B3A4B]/10">
      <div className="flex gap-1">
        {tabs.map(({ href, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative px-4 py-3 text-sm font-medium transition",
                active
                  ? "text-[#1B3A4B] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#C4A052]"
                  : "text-neutral-500 hover:text-[#1B3A4B]"
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
