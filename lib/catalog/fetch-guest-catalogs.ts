import { createClient } from "@/lib/supabase/server";

export interface GuestCatalogItem {
  id: string;
  name: string;
  category?: string;
  subcategory?: string | null;
  base_price_cents: number;
  allows_custom_note: boolean;
  sort_order: number;
}

export interface GuestSnacksCatalog {
  snacks: GuestCatalogItem[];
  charcuterie: {
    meats: GuestCatalogItem[];
    cheeses: GuestCatalogItem[];
    complements: GuestCatalogItem[];
  };
  alwaysOnboard: GuestCatalogItem[];
  beverages: GuestCatalogItem[];
}

export async function fetchGuestSnacksCatalog(): Promise<GuestSnacksCatalog> {
  const supabase = await createClient();

  const [snacksRes, charcuterieRes, alwaysRes] = await Promise.all([
    supabase
      .from("snacks")
      .select("id, name, category, base_price_cents, allows_custom_note, sort_order")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("charcuterie_items")
      .select("id, name, category, base_price_cents, allows_custom_note, sort_order")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("always_onboard_items")
      .select("id, name, base_price_cents, allows_custom_note, sort_order")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
  ]);

  const mapRow = (row: Record<string, unknown>): GuestCatalogItem => ({
    id: row.id as string,
    name: row.name as string,
    category: row.category as string | undefined,
    base_price_cents: (row.base_price_cents as number) ?? 0,
    allows_custom_note: Boolean(row.allows_custom_note),
    sort_order: (row.sort_order as number) ?? 0,
  });

  const snacks = (snacksRes.data ?? []).map(mapRow);
  const charcuterieRows = (charcuterieRes.data ?? []).map(mapRow);

  return {
    snacks,
    charcuterie: {
      meats: charcuterieRows.filter((i) => i.category === "meats"),
      cheeses: charcuterieRows.filter((i) => i.category === "cheeses"),
      complements: charcuterieRows.filter((i) => i.category === "complements"),
    },
    alwaysOnboard: (alwaysRes.data ?? []).map(mapRow),
    beverages: [],
  };
}

export async function fetchGuestBeveragesCatalog(locale: string): Promise<GuestCatalogItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("catalog_items")
    .select("id, name_en, name_es, category, subcategory, base_price_cents, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  return (data ?? []).map((row) => ({
    id: row.id,
    name: locale === "es" ? row.name_es : row.name_en,
    category: row.category,
    subcategory: row.subcategory,
    base_price_cents: row.base_price_cents ?? 0,
    allows_custom_note: false,
    sort_order: row.sort_order ?? 0,
  }));
}
