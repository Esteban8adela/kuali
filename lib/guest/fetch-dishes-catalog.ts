import { createClient } from "@/lib/supabase/server";
import { DISH_CATEGORIES, type DishCategory } from "@/lib/constants/dishes";
import { localizedDishName } from "@/lib/catalog/utils";

export interface GuestDishOption {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: DishCategory;
  base_price_cents: number;
}

export type DishesByCategory = Record<DishCategory, GuestDishOption[]>;

const LEGACY_KIDS = "kids";

export function emptyDishesByCategory(): DishesByCategory {
  return Object.fromEntries(DISH_CATEGORIES.map((c) => [c, []])) as unknown as DishesByCategory;
}

export async function fetchDishesCatalog(locale = "en"): Promise<DishesByCategory> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dishes")
    .select("id, name, name_en, name_es, description, description_en, description_es, category, image_url, base_price_cents")
    .order("name", { ascending: true });

  if (error) throw error;

  const grouped = emptyDishesByCategory();
  for (const row of data ?? []) {
    let category = row.category as string;
    if (category === LEGACY_KIDS) category = "kids_lunch_main";
    if (category in grouped) {
      grouped[category as DishCategory].push({
        id: row.id,
        name: localizedDishName(row, locale),
        description:
          locale === "es"
            ? row.description_es ?? row.description
            : row.description_en ?? row.description,
        image_url: row.image_url,
        category: category as DishCategory,
        base_price_cents: row.base_price_cents ?? 0,
      });
    }
  }

  return grouped;
}
