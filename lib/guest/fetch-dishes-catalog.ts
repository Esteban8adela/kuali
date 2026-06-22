import { createClient } from "@/lib/supabase/server";
import { DISH_CATEGORIES, type DishCategory } from "@/lib/constants/dishes";

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

export async function fetchDishesCatalog(): Promise<DishesByCategory> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dishes")
    .select("id, name, description, category, image_url, base_price_cents")
    .order("name", { ascending: true });

  if (error) throw error;

  const grouped = emptyDishesByCategory();
  for (const row of data ?? []) {
    let category = row.category as string;
    if (category === LEGACY_KIDS) category = "kids_lunch_main";
    if (category in grouped) {
      grouped[category as DishCategory].push({
        id: row.id,
        name: row.name,
        description: row.description,
        image_url: row.image_url,
        category: category as DishCategory,
        base_price_cents: row.base_price_cents ?? 0,
      });
    }
  }

  return grouped;
}
