export type CatalogCategory = "spirit" | "wine" | "beer" | "mixer";

export interface CatalogItem {
  id: string;
  category: CatalogCategory | string;
  subcategory: string | null;
  name_en: string;
  name_es: string;
  description_en?: string | null;
  description_es?: string | null;
  presentation?: string | null;
  sort_order: number;
  is_active: boolean;
  base_price_cents: number;
}

export interface BarLineSelection {
  catalogItemId: string | null;
  label: string;
  quantity: number | null;
}

export interface BarOrderPayload {
  byob: boolean;
  natural_water: boolean;
  mineral_water: boolean;
  soda_regular: boolean;
  soda_diet: boolean;
  chef_recommendation: boolean;
  house_wine_by_glass: boolean;
  spirits: Record<string, BarLineSelection[]>;
  wines: BarLineSelection[];
  beers: BarLineSelection[];
  mixers: BarLineSelection[];
}

export type GlobalMealSchedule = Record<
  string,
  { time?: string; heaviness?: string }
>;
