export const REGULAR_DISH_CATEGORIES = [
  "breakfast",
  "lunch_appetizer",
  "lunch_main",
  "lunch_dessert",
  "dinner",
] as const;

export type RegularDishCategory = (typeof REGULAR_DISH_CATEGORIES)[number];

export const KIDS_DISH_CATEGORIES = [
  "kids_breakfast",
  "kids_lunch_main",
  "kids_lunch_dessert",
  "kids_dinner",
] as const;

export type KidsDishCategory = (typeof KIDS_DISH_CATEGORIES)[number];

export const DISH_CATEGORIES = [
  ...REGULAR_DISH_CATEGORIES,
  ...KIDS_DISH_CATEGORIES,
] as const;

export type DishCategory = (typeof DISH_CATEGORIES)[number];

export function kidsCategoryForMeal(mealKey: string): KidsDishCategory {
  if (mealKey === "breakfast") return "kids_breakfast";
  if (mealKey === "dinner") return "kids_dinner";
  return "kids_lunch_main";
}

export function isKidsDishCategory(category: string): category is KidsDishCategory {
  return (KIDS_DISH_CATEGORIES as readonly string[]).includes(category);
}

export function isRegularDishCategory(category: string): category is RegularDishCategory {
  return (REGULAR_DISH_CATEGORIES as readonly string[]).includes(category);
}
