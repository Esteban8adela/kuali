import { createClient } from "@/lib/supabase/server";
import { DISH_CATEGORIES, type DishCategory } from "@/lib/constants/dishes";

export interface GuestDishOption {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: DishCategory;
}

export type DishesByCategory = Record<DishCategory, GuestDishOption[]>;

export function emptyDishesByCategory(): DishesByCategory {
  return {
    breakfast: [],
    lunch_appetizer: [],
    lunch_main: [],
    lunch_dessert: [],
    dinner: [],
    kids: [],
    snack: [],
  };
}

export async function fetchDishesCatalog(): Promise<DishesByCategory> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dishes")
    .select("id, name, description, category, image_url")
    .order("name", { ascending: true });

  if (error) throw error;

  const grouped = emptyDishesByCategory();
  for (const row of data ?? []) {
    const category = row.category as DishCategory;
    if (grouped[category]) {
      grouped[category].push({
        id: row.id,
        name: row.name,
        description: row.description,
        image_url: row.image_url,
        category,
      });
    }
  }

  return grouped;
}
