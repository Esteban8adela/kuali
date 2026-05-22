import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CATALOG } from "./default-catalog";
import type { CatalogItem } from "./types";

/** Ready to swap: fetches active rows from `catalog_items`; falls back to defaults. */
export async function fetchCatalogItems(): Promise<CatalogItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("catalog_items")
      .select("id, category, subcategory, name_en, name_es, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order");

    if (error || !data?.length) {
      return DEFAULT_CATALOG;
    }
    return data as CatalogItem[];
  } catch {
    return DEFAULT_CATALOG;
  }
}
