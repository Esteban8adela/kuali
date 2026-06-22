import type { BarLineSelection } from "@/lib/catalog/types";
import { parseCharcuterieSelections } from "@/lib/guest/charcuterie-selections";

export interface BarBottleLine {
  category: string;
  label: string;
  quantity: string;
  catalogItemId?: string | null;
}

export function extractBarBottleLines(barOrder: Record<string, unknown>): BarBottleLine[] {
  const lines: BarBottleLine[] = [];

  const spirits = barOrder.spirits as Record<string, BarLineSelection[]> | undefined;
  if (spirits && typeof spirits === "object") {
    for (const [category, items] of Object.entries(spirits)) {
      for (const item of items ?? []) {
        const label = item.label?.trim();
        if (!label && !item.catalogItemId) continue;
        lines.push({
          category,
          label: label || "—",
          quantity: item.quantity != null ? String(item.quantity) : "—",
          catalogItemId: item.catalogItemId,
        });
      }
    }
  }

  const listKeys = ["wines", "beers", "mixers"] as const;
  for (const key of listKeys) {
    const items = barOrder[key] as BarLineSelection[] | undefined;
    for (const item of items ?? []) {
      const label = item.label?.trim();
      if (!label && !item.catalogItemId) continue;
      lines.push({
        category: key,
        label: label || "—",
        quantity: item.quantity != null ? String(item.quantity) : "—",
        catalogItemId: item.catalogItemId,
      });
    }
  }

  return lines;
}

export function extractSnackKeys(snacksData: Record<string, unknown>, field: string): string[] {
  const raw = snacksData[field];
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : [];
}

export function extractCharcuterie(snacksData: Record<string, unknown>) {
  return parseCharcuterieSelections(snacksData.charcuterie_selections);
}
