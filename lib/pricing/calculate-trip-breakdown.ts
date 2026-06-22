import { extractBarBottleLines } from "@/lib/chef/format-service-order";
import { resolveBarLineLabel } from "@/lib/chef/resolve-catalog-labels";
import type { MenuDayPlan, MenuMealBlock } from "@/lib/guest/menu-itinerary";
import { parseSnacksPayload } from "@/lib/guest/snacks-selection";
import type { PricingCatalog } from "@/lib/pricing/fetch-pricing-catalog";

export interface PriceBreakdownLine {
  concept: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
}

export interface TripBreakdownInput {
  itinerary: MenuDayPlan[];
  adultCount: number;
  childCount: number;
  barOrder: Record<string, unknown>;
  snacksData: Record<string, unknown>;
  catalog: PricingCatalog;
  dishNames: Record<string, string>;
}

function priceCents(catalog: PricingCatalog, map: keyof PricingCatalog, id: string): number {
  const table = catalog[map] as Record<string, number>;
  return table[id] ?? 0;
}

function pushDishLine(
  lines: PriceBreakdownLine[],
  dishId: string | null | undefined,
  quantity: number,
  conceptSuffix: string,
  catalog: PricingCatalog,
  dishNames: Record<string, string>
) {
  if (!dishId || quantity <= 0) return;
  const unitPriceCents = priceCents(catalog, "dishPricesCents", dishId);
  const name = dishNames[dishId] ?? dishId;
  lines.push({
    concept: conceptSuffix ? `${name} (${conceptSuffix})` : name,
    quantity,
    unitPriceCents,
    subtotalCents: unitPriceCents * quantity,
  });
}

function mealDishLines(
  meal: MenuMealBlock,
  guestPax: number,
  dayLabel: string,
  catalog: PricingCatalog,
  dishNames: Record<string, string>
): PriceBreakdownLine[] {
  const lines: PriceBreakdownLine[] = [];
  const kids = meal.kidsMenuCount ?? 0;
  const mealLabel = `${dayLabel} · ${meal.key}`;

  if (meal.key === "breakfast") {
    pushDishLine(lines, meal.selected_dish_id, guestPax, mealLabel, catalog, dishNames);
  } else if (meal.key === "lunch") {
    pushDishLine(lines, meal.selected_appetizer_id, guestPax, `${mealLabel} appetizer`, catalog, dishNames);
    pushDishLine(lines, meal.selected_main_id, guestPax, `${mealLabel} main`, catalog, dishNames);
    pushDishLine(lines, meal.selected_dessert_id, guestPax, `${mealLabel} dessert`, catalog, dishNames);
  } else if (meal.key === "dinner") {
    pushDishLine(lines, meal.selected_dish_id, guestPax, mealLabel, catalog, dishNames);
  }

  if (kids > 0) {
    pushDishLine(lines, meal.selected_kids_dish_id, kids, `${mealLabel} kids`, catalog, dishNames);
  }

  return lines;
}

function snacksLines(
  snacksData: Record<string, unknown>,
  catalog: PricingCatalog
): PriceBreakdownLine[] {
  const parsed = parseSnacksPayload(snacksData);
  const lines: PriceBreakdownLine[] = [];

  for (const id of parsed.snackItemIds) {
    const unitPriceCents = priceCents(catalog, "snackPricesCents", id);
    lines.push({
      concept: catalog.namesById[id] ?? id,
      quantity: 1,
      unitPriceCents,
      subtotalCents: unitPriceCents,
    });
  }
  for (const id of parsed.alwaysOnboardItemIds) {
    const unitPriceCents = priceCents(catalog, "alwaysOnboardPricesCents", id);
    lines.push({
      concept: catalog.namesById[id] ?? id,
      quantity: 1,
      unitPriceCents,
      subtotalCents: unitPriceCents,
    });
  }
  for (const id of [
    ...parsed.charcuterie.meats,
    ...parsed.charcuterie.cheeses,
    ...parsed.charcuterie.complements,
  ]) {
    const unitPriceCents = priceCents(catalog, "charcuteriePricesCents", id);
    lines.push({
      concept: catalog.namesById[id] ?? id,
      quantity: 1,
      unitPriceCents,
      subtotalCents: unitPriceCents,
    });
  }

  return lines;
}

function barLines(
  barOrder: Record<string, unknown>,
  catalog: PricingCatalog
): PriceBreakdownLine[] {
  const lines: PriceBreakdownLine[] = [];

  for (const line of extractBarBottleLines(barOrder)) {
    if (!line.catalogItemId) continue;
    const qty = line.quantity !== "—" ? Math.max(1, parseInt(line.quantity, 10) || 1) : 1;
    const unitPriceCents = priceCents(catalog, "beveragePricesCents", line.catalogItemId);
    lines.push({
      concept: resolveBarLineLabel(line, catalog.namesById),
      quantity: qty,
      unitPriceCents,
      subtotalCents: unitPriceCents * qty,
    });
  }

  return lines;
}

export function calculateTripBreakdown(input: TripBreakdownInput): PriceBreakdownLine[] {
  const guestPax = Math.max(0, input.adultCount) + Math.max(0, input.childCount);
  const lines: PriceBreakdownLine[] = [];

  input.itinerary.forEach((day, index) => {
    const dayLabel = day.date || `Day ${index + 1}`;
    for (const meal of day.meals) {
      lines.push(...mealDishLines(meal, guestPax, dayLabel, input.catalog, input.dishNames));
    }
  });

  lines.push(...snacksLines(input.snacksData, input.catalog));
  lines.push(...barLines(input.barOrder, input.catalog));

  return lines;
}
