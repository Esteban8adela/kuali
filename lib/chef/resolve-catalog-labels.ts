import { parseSnacksPayload } from "@/lib/guest/snacks-selection";
import type { BarBottleLine } from "@/lib/chef/format-service-order";
import type { PricingCatalog } from "@/lib/pricing/fetch-pricing-catalog";

const OTHER_KEY = "other";

export function resolveCatalogItemName(
  id: string,
  namesById: Record<string, string>,
  otherText?: string | null
): string {
  if (id === OTHER_KEY && otherText?.trim()) return otherText.trim();
  return namesById[id] ?? id;
}

/** Resolve a bar line label from catalog ID; free-text lines skip catalog lookup. */
export function resolveBarLineLabel(
  line: Pick<BarBottleLine, "catalogItemId" | "label">,
  namesById: Record<string, string>
): string {
  if (!line.catalogItemId) {
    return line.label?.trim() || "—";
  }
  return namesById[line.catalogItemId] ?? (line.label?.trim() || line.catalogItemId);
}

export function resolveSnacksSelectionLabels(
  snacksData: Record<string, unknown>,
  catalog: PricingCatalog
): {
  snacks: string[];
  alwaysOnboard: string[];
  charcuterie: { meats: string[]; cheeses: string[]; complements: string[] };
} {
  const parsed = parseSnacksPayload(snacksData);
  const names = catalog.namesById;

  return {
    snacks: [
      ...parsed.snackItemIds.map((id) => resolveCatalogItemName(id, names)),
      ...(parsed.otherSnack?.trim() ? [parsed.otherSnack.trim()] : []),
    ],
    alwaysOnboard: [
      ...parsed.alwaysOnboardItemIds.map((id) => resolveCatalogItemName(id, names)),
      ...(parsed.otherAlways?.trim() ? [parsed.otherAlways.trim()] : []),
    ],
    charcuterie: {
      meats: [
        ...parsed.charcuterie.meats.map((id) => resolveCatalogItemName(id, names)),
        ...(parsed.charcuterie.otherMeats?.trim() ? [parsed.charcuterie.otherMeats.trim()] : []),
      ],
      cheeses: [
        ...parsed.charcuterie.cheeses.map((id) => resolveCatalogItemName(id, names)),
        ...(parsed.charcuterie.otherCheeses?.trim() ? [parsed.charcuterie.otherCheeses.trim()] : []),
      ],
      complements: [
        ...parsed.charcuterie.complements.map((id) => resolveCatalogItemName(id, names)),
        ...(parsed.charcuterie.otherComplements?.trim()
          ? [parsed.charcuterie.otherComplements.trim()]
          : []),
      ],
    },
  };
}
