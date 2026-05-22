import type { CatalogItem } from "./types";

export function catalogLabel(item: CatalogItem, locale: string): string {
  return locale === "es" ? item.name_es : item.name_en;
}

export function filterCatalog(
  items: CatalogItem[],
  category: string,
  subcategory?: string | null
): CatalogItem[] {
  return items.filter(
    (i) =>
      i.category === category &&
      (subcategory === undefined || i.subcategory === subcategory)
  );
}
