import { createClient } from "@/lib/supabase/server";

export interface PricingCatalog {
  dishPricesCents: Record<string, number>;
  snackPricesCents: Record<string, number>;
  charcuteriePricesCents: Record<string, number>;
  alwaysOnboardPricesCents: Record<string, number>;
  beveragePricesCents: Record<string, number>;
  namesById: Record<string, string>;
}

export async function fetchPricingCatalog(): Promise<PricingCatalog> {
  const supabase = await createClient();

  const [dishes, snacks, charcuterie, alwaysOnboard, beverages] = await Promise.all([
    supabase.from("dishes").select("id, name, base_price_cents"),
    supabase.from("snacks").select("id, name, base_price_cents"),
    supabase.from("charcuterie_items").select("id, name, base_price_cents"),
    supabase.from("always_onboard_items").select("id, name, base_price_cents"),
    supabase.from("catalog_items").select("id, name_en, name_es, base_price_cents"),
  ]);

  const dishPricesCents: Record<string, number> = {};
  const snackPricesCents: Record<string, number> = {};
  const charcuteriePricesCents: Record<string, number> = {};
  const alwaysOnboardPricesCents: Record<string, number> = {};
  const beveragePricesCents: Record<string, number> = {};
  const namesById: Record<string, string> = {};

  for (const row of dishes.data ?? []) {
    dishPricesCents[row.id] = row.base_price_cents ?? 0;
    namesById[row.id] = row.name;
  }
  for (const row of snacks.data ?? []) {
    snackPricesCents[row.id] = row.base_price_cents ?? 0;
    namesById[row.id] = row.name;
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
    namesById[row.id] = row.name_en;
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
