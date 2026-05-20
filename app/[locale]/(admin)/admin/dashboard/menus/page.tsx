import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import type { Menu } from "@/lib/types/database";

export default async function AdminMenusPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const supabase = await createClient();
  const { data: menus } = await supabase.from("menus").select("*").order("sort_order");

  return (
    <div>
      <h1 className="font-display mb-8 text-3xl text-[#1B3A4B]">{t("menus")}</h1>
      <ul className="space-y-2">
        {(menus as Menu[] | null)?.map((m) => (
          <li key={m.id} className="flex justify-between rounded-lg border px-4 py-3">
            <span>{locale === "es" ? m.name_es : m.name_en}</span>
            <span className="text-sm text-neutral-500">{m.price_tier}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
