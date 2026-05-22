import type { CatalogItem } from "./types";

/** Fallback when Supabase `catalog_items` is unavailable — keep ids stable for migration seed */
export const DEFAULT_CATALOG: CatalogItem[] = [
  { id: "seed-teq-1", category: "spirit", subcategory: "tequila", name_en: "Don Julio 1942", name_es: "Don Julio 1942", sort_order: 1, is_active: true },
  { id: "seed-teq-2", category: "spirit", subcategory: "tequila", name_en: "Casa Dragones", name_es: "Casa Dragones", sort_order: 2, is_active: true },
  { id: "seed-teq-3", category: "spirit", subcategory: "tequila", name_en: "Clase Azul", name_es: "Clase Azul", sort_order: 3, is_active: true },
  { id: "seed-teq-4", category: "spirit", subcategory: "tequila", name_en: "Patrón Silver", name_es: "Patrón Silver", sort_order: 4, is_active: true },
  { id: "seed-rum-1", category: "spirit", subcategory: "rum", name_en: "Zacapa 23", name_es: "Zacapa 23", sort_order: 1, is_active: true },
  { id: "seed-rum-2", category: "spirit", subcategory: "rum", name_en: "Diplomático Reserva", name_es: "Diplomático Reserva", sort_order: 2, is_active: true },
  { id: "seed-vod-1", category: "spirit", subcategory: "vodka", name_en: "Grey Goose", name_es: "Grey Goose", sort_order: 1, is_active: true },
  { id: "seed-vod-2", category: "spirit", subcategory: "vodka", name_en: "Belvedere", name_es: "Belvedere", sort_order: 2, is_active: true },
  { id: "seed-gin-1", category: "spirit", subcategory: "gin", name_en: "Hendrick's", name_es: "Hendrick's", sort_order: 1, is_active: true },
  { id: "seed-gin-2", category: "spirit", subcategory: "gin", name_en: "Tanqueray No. Ten", name_es: "Tanqueray No. Ten", sort_order: 2, is_active: true },
  { id: "seed-mez-1", category: "spirit", subcategory: "mezcal", name_en: "Del Maguey Vida", name_es: "Del Maguey Vida", sort_order: 1, is_active: true },
  { id: "seed-whk-1", category: "spirit", subcategory: "whiskey", name_en: "Macallan 12", name_es: "Macallan 12", sort_order: 1, is_active: true },
  { id: "seed-whk-2", category: "spirit", subcategory: "whiskey", name_en: "Johnnie Walker Blue", name_es: "Johnnie Walker Blue", sort_order: 2, is_active: true },
  { id: "seed-wine-1", category: "wine", subcategory: "region", name_en: "Napa Valley Cabernet", name_es: "Cabernet de Napa", sort_order: 1, is_active: true },
  { id: "seed-wine-2", category: "wine", subcategory: "region", name_en: "Burgundy Chardonnay", name_es: "Chardonnay de Borgoña", sort_order: 2, is_active: true },
  { id: "seed-wine-3", category: "wine", subcategory: "region", name_en: "Rioja Reserva", name_es: "Rioja Reserva", sort_order: 3, is_active: true },
  { id: "seed-wine-4", category: "wine", subcategory: "region", name_en: "Provence Rosé", name_es: "Rosado de Provenza", sort_order: 4, is_active: true },
  { id: "seed-wine-5", category: "wine", subcategory: "region", name_en: "Champagne Brut", name_es: "Champagne Brut", sort_order: 5, is_active: true },
  { id: "seed-beer-1", category: "beer", subcategory: null, name_en: "Corona Extra", name_es: "Corona Extra", sort_order: 1, is_active: true },
  { id: "seed-beer-2", category: "beer", subcategory: null, name_en: "Modelo Especial", name_es: "Modelo Especial", sort_order: 2, is_active: true },
  { id: "seed-beer-3", category: "beer", subcategory: null, name_en: "Pacifico", name_es: "Pacifico", sort_order: 3, is_active: true },
  { id: "seed-mix-1", category: "mixer", subcategory: null, name_en: "Tonic Water", name_es: "Agua Tónica", sort_order: 1, is_active: true },
  { id: "seed-mix-2", category: "mixer", subcategory: null, name_en: "Club Soda", name_es: "Soda Club", sort_order: 2, is_active: true },
  { id: "seed-mix-3", category: "mixer", subcategory: null, name_en: "Ginger Beer", name_es: "Ginger Beer", sort_order: 3, is_active: true },
];

export const SPIRIT_SUBCATEGORIES = [
  "tequila",
  "rum",
  "vodka",
  "gin",
  "mezcal",
  "whiskey",
] as const;
