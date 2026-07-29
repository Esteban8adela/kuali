import { REGULAR_DISH_CATEGORIES, KIDS_DISH_CATEGORIES, type DishCategory } from "@/lib/constants/dishes";

/** Strict display order: Breakfast → Appetizers → Mains → Desserts (kids follow same flow). */
export const DISH_CATEGORY_SORT_ORDER: readonly DishCategory[] = [
  "breakfast",
  "kids_breakfast",
  "lunch_appetizer",
  "lunch_main",
  "kids_lunch_main",
  "dinner",
  "kids_dinner",
  "lunch_dessert",
  "kids_lunch_dessert",
] as const;

export function dishCategorySortIndex(category: string): number {
  const idx = DISH_CATEGORY_SORT_ORDER.indexOf(category as DishCategory);
  return idx === -1 ? 999 : idx;
}

export function sortDishesByCourseType<T extends { category: string; name?: string }>(
  dishes: T[]
): T[] {
  return [...dishes].sort((a, b) => {
    const byCat = dishCategorySortIndex(a.category) - dishCategorySortIndex(b.category);
    if (byCat !== 0) return byCat;
    return (a.name ?? "").localeCompare(b.name ?? "");
  });
}

export { REGULAR_DISH_CATEGORIES, KIDS_DISH_CATEGORIES };
