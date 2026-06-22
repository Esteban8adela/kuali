import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, centsToUsd } from "@/lib/utils";

export default async function ChefCatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("chef.catalog");

  const supabase = await createClient();
  const [dishes, snacks, beverages] = await Promise.all([
    supabase.from("dishes").select("name, category, base_price_cents").order("name"),
    supabase.from("snacks").select("name, category, base_price_cents").eq("is_active", true).order("name"),
    supabase
      .from("catalog_items")
      .select("name_en, name_es, category, base_price_cents")
      .eq("is_active", true)
      .order("name_en"),
  ]);

  const dishRows = dishes.data ?? [];
  const snackRows = snacks.data ?? [];
  const bevRows = beverages.data ?? [];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl text-[#1B3A4B]">{t("title")}</h1>
        <p className="mt-2 text-neutral-600">{t("subtitle")}</p>
      </header>

      {[
        { title: t("dishesSection"), rows: dishRows.map((r) => ({ name: r.name, meta: r.category, cents: r.base_price_cents })) },
        { title: t("snacksSection"), rows: snackRows.map((r) => ({ name: r.name, meta: r.category, cents: r.base_price_cents })) },
        {
          title: t("beveragesSection"),
          rows: bevRows.map((r) => ({
            name: locale === "es" ? r.name_es : r.name_en,
            meta: r.category,
            cents: r.base_price_cents,
          })),
        },
      ].map((section) => (
        <section key={section.title} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-[#1B3A4B]">{section.title}</h2>
          {section.rows.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">{t("empty")}</p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-neutral-500">
                  <th className="py-2 pr-4">{t("nameColumn")}</th>
                  <th className="py-2 pr-4">{t("categoryColumn")}</th>
                  <th className="py-2 text-right">{t("priceColumn")}</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row) => (
                  <tr key={`${section.title}-${row.name}`} className="border-b border-neutral-100">
                    <td className="py-2.5 font-medium text-neutral-900">{row.name}</td>
                    <td className="py-2.5 text-neutral-600">{row.meta}</td>
                    <td className="py-2.5 text-right text-neutral-700">
                      {formatCurrency(centsToUsd(row.cents ?? 0), locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}
    </div>
  );
}
