export const DISH_CATEGORIES = [
  "breakfast",
  "lunch_appetizer",
  "lunch_main",
  "dinner",
  "kids",
  "snack",
] as const;

export type DishCategory = (typeof DISH_CATEGORIES)[number];
