import type { CatalogItem } from "./types";

export function catalogLabel(item: CatalogItem, locale: string): string {
  const name = locale === "es" ? item.name_es : item.name_en;
  if (item.presentation?.trim()) {
    return `${name} (${item.presentation.trim()})`;
  }
  return name;
}

export function filterCatalog(
  items: CatalogItem[],
  category: string,
  subcategory?: string | null
): CatalogItem[] {
  return sortBeverages(
    items.filter(
      (i) =>
        i.category === category &&
        (subcategory === undefined || i.subcategory === subcategory)
    )
  );
}

export function sortBeverages<T extends {
  subcategory: string | null;
  name_en: string;
  name_es: string;
}>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const subA = a.subcategory ?? "";
    const subB = b.subcategory ?? "";
    if (subA !== subB) return subA.localeCompare(subB);
    return a.name_en.localeCompare(b.name_en);
  });
}

export function localizedDishName(
  dish: {
    name: string;
    name_en?: string | null;
    name_es?: string | null;
  },
  locale: string
): string {
  if (locale === "es") return dish.name_es?.trim() || dish.name;
  return dish.name_en?.trim() || dish.name;
}

export function localizedSnackName(
  snack: {
    name: string;
    name_en?: string | null;
    name_es?: string | null;
  },
  locale: string
): string {
  if (locale === "es") return snack.name_es?.trim() || snack.name;
  return snack.name_en?.trim() || snack.name;
}
