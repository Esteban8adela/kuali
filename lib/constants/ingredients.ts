export const INGREDIENT_STOCK_CATEGORIES = [
  "abarrotes",
  "frutas_verduras",
  "carniceria",
  "pescaderia",
  "lacteos",
  "bebidas",
  "otros",
] as const;

export type IngredientStockCategory = (typeof INGREDIENT_STOCK_CATEGORIES)[number];

export const INGREDIENT_UNITS = ["kg", "g", "litro", "ml", "l", "pieza", "caja"] as const;

export type IngredientUnit = (typeof INGREDIENT_UNITS)[number];
