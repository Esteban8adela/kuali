"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { routing, type Locale } from "@/i18n/routing";
import { flushWizardDrafts } from "@/lib/wizard/draft-registry";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function getHref(next: Locale) {
    const segments = pathname.split("/");
    segments[1] = next;
    return segments.join("/") || `/${next}`;
  }

  function handleSwitch(next: Locale) {
    if (next === locale || pending) return;
    startTransition(async () => {
      await flushWizardDrafts();
      router.push(getHref(next));
    });
  }

  return (
    <div className="flex gap-1 rounded-full border border-[#C4A052]/30 p-0.5 text-xs">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          disabled={pending}
          onClick={() => handleSwitch(loc)}
          className={`rounded-full px-3 py-1 uppercase tracking-wider transition ${
            locale === loc
              ? "bg-[#1B3A4B] text-white"
              : "text-[#1B3A4B] hover:bg-[#C4A052]/10"
          } ${pending ? "opacity-60" : ""}`}
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
