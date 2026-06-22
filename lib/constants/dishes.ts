export const DISH_CATEGORIES = [
  "breakfast",
  "lunch_appetizer",
  "lunch_main",
  "lunch_dessert",
  "dinner",
  "kids",
  "snack",
] as const;

export type DishCategory = (typeof DISH_CATEGORIES)[number];
