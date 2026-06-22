/** Spirit subcategory keys stored in `catalog_items.subcategory`. */
export const SPIRIT_SUBCATEGORIES = [
  "rum",
  "tequila",
  "vodka",
  "gin",
  "whiskey",
  "mezcal",
  "cognac",
  "brandy",
] as const;

export type SpiritSubcategory = (typeof SPIRIT_SUBCATEGORIES)[number];

export const BEVERAGE_CATEGORY_KEYS = ["spirit", "wine", "beer", "mixer"] as const;

export type BeverageCategoryKey = (typeof BEVERAGE_CATEGORY_KEYS)[number];
