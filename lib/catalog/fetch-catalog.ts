import { createClient } from "@/lib/supabase/server";
import type { CatalogItem } from "./types";
import { sortBeverages } from "./utils";

/** Fetches active rows from `catalog_items`; returns empty when none configured. */
export async function fetchCatalogItems(): Promise<CatalogItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catalog_items")
    .select("id, category, subcategory, name_en, name_es, description_en, description_es, presentation, sort_order, is_active, base_price_cents")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;
  const sorted = sortBeverages((data ?? []) as CatalogItem[]);
  return sorted;
}
