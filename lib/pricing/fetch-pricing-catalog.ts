import { createClient } from "@/lib/supabase/server";
import { localizedDishName, localizedSnackName } from "@/lib/catalog/utils";

export interface PricingCatalog {
  dishPricesCents: Record<string, number>;
  snackPricesCents: Record<string, number>;
  charcuteriePricesCents: Record<string, number>;
  alwaysOnboardPricesCents: Record<string, number>;
  beveragePricesCents: Record<string, number>;
  namesById: Record<string, string>;
}

function beverageLabel(
  row: { name_en: string; name_es: string; presentation?: string | null },
  locale: string
): string {
  const name = locale === "es" ? row.name_es : row.name_en;
  if (row.presentation?.trim()) return `${name} (${row.presentation.trim()})`;
  return name;
}

export async function fetchPricingCatalog(locale = "en"): Promise<PricingCatalog> {
  const supabase = await createClient();

  const [dishes, snacks, charcuterie, alwaysOnboard, beverages] = await Promise.all([
    supabase.from("dishes").select("id, name, name_en, name_es, base_price_cents"),
    supabase.from("snacks").select("id, name, name_en, name_es, base_price_cents"),
    supabase.from("charcuterie_items").select("id, name, base_price_cents"),
    supabase.from("always_onboard_items").select("id, name, base_price_cents"),
    supabase
      .from("catalog_items")
      .select("id, name_en, name_es, presentation, base_price_cents"),
  ]);

  const dishPricesCents: Record<string, number> = {};
  const snackPricesCents: Record<string, number> = {};
  const charcuteriePricesCents: Record<string, number> = {};
  const alwaysOnboardPricesCents: Record<string, number> = {};
  const beveragePricesCents: Record<string, number> = {};
  const namesById: Record<string, string> = {};

  for (const row of dishes.data ?? []) {
    dishPricesCents[row.id] = row.base_price_cents ?? 0;
    namesById[row.id] = localizedDishName(row, locale);
  }
  for (const row of snacks.data ?? []) {
    snackPricesCents[row.id] = row.base_price_cents ?? 0;
    namesById[row.id] = localizedSnackName(row, locale);
  }
  for (const row of charcuterie.data ?? []) {
    charcuteriePricesCents[row.id] = row.base_price_cents ?? 0;
    namesById[row.id] = row.name;
  }
  for (const row of alwaysOnboard.data ?? []) {
    alwaysOnboardPricesCents[row.id] = row.base_price_cents ?? 0;
    namesById[row.id] = row.name;
  }
  for (const row of beverages.data ?? []) {
    beveragePricesCents[row.id] = row.base_price_cents ?? 0;
    namesById[row.id] = beverageLabel(row, locale);
  }

  return {
    dishPricesCents,
    snackPricesCents,
    charcuteriePricesCents,
    alwaysOnboardPricesCents,
    beveragePricesCents,
    namesById,
  };
}
