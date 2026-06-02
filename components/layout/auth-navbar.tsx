"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LocaleSwitcher } from "./locale-switcher";
import { logoutAction } from "@/app/[locale]/(auth)/logout/actions";

export function AuthNavbar() {
  const locale = useLocale();
  const tc = useTranslations("common");

  return (
    <header className="flex items-center justify-between border-b border-[#C4A052]/10 bg-white/80 px-4 py-3 backdrop-blur md:px-8">
      <Link
        href={`/${locale}`}
        className="font-display text-xl tracking-[0.15em] text-[#1B3A4B]"
      >
        {tc("brand")}
      </Link>
      <div className="flex items-center gap-3">
        <LocaleSwitcher />
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-[#1B3A4B]/20 px-3 py-1.5 text-xs font-medium text-[#1B3A4B] transition hover:bg-[#1B3A4B]/5"
          >
            {tc("logout")}
          </button>
        </form>
      </div>
    </header>
  );
}
