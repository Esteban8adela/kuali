"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: Locale) {
    const segments = pathname.split("/");
    segments[1] = next;
    router.replace(segments.join("/") || `/${next}`);
  }

  return (
    <div className="flex gap-1 rounded-full border border-[#C4A052]/30 p-0.5 text-xs">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchLocale(loc)}
          className={`rounded-full px-3 py-1 uppercase tracking-wider transition ${
            locale === loc
              ? "bg-[#1B3A4B] text-white"
              : "text-[#1B3A4B] hover:bg-[#C4A052]/10"
          }`}
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
