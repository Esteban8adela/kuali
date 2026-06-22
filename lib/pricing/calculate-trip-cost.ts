import { extractBarBottleLines } from "@/lib/chef/format-service-order";
import type { MenuDayPlan, MenuMealBlock } from "@/lib/guest/menu-itinerary";
import { parseSnacksPayload } from "@/lib/guest/snacks-selection";
import type { PricingCatalog } from "@/lib/pricing/fetch-pricing-catalog";

export interface TripCostInput {
  itinerary: MenuDayPlan[];
  adultCount: number;
  childCount: number;
  barOrder: Record<string, unknown>;
  snacksData: Record<string, unknown>;
  catalog: PricingCatalog;
}

function priceCents(catalog: PricingCatalog, map: keyof PricingCatalog, id: string | null | undefined): number {
  if (!id) return 0;
  const table = catalog[map] as Record<string, number>;
  return table[id] ?? 0;
}

function addDishCost(
  total: number,
  dishId: string | null | undefined,
  multiplier: number,
  catalog: PricingCatalog
): number {
  if (!dishId || multiplier <= 0) return total;
  return total + priceCents(catalog, "dishPricesCents", dishId) * multiplier;
}

function mealDishCosts(
  meal: MenuMealBlock,
  guestPax: number,
  catalog: PricingCatalog
): number {
  let cents = 0;
  const kids = meal.kidsMenuCount ?? 0;

  if (meal.key === "breakfast") {
    cents = addDishCost(cents, meal.selected_dish_id, guestPax, catalog);
  } else if (meal.key === "lunch") {
    cents = addDishCost(cents, meal.selected_appetizer_id, guestPax, catalog);
    cents = addDishCost(cents, meal.selected_main_id, guestPax, catalog);
    cents = addDishCost(cents, meal.selected_dessert_id, guestPax, catalog);
  } else if (meal.key === "dinner") {
    cents = addDishCost(cents, meal.selected_dish_id, guestPax, catalog);
  }

  if (kids > 0) {
    cents = addDishCost(cents, meal.selected_kids_dish_id, kids, catalog);
  }

  return cents;
}

function snacksCost(snacksData: Record<string, unknown>, catalog: PricingCatalog): number {
  const parsed = parseSnacksPayload(snacksData);
  let cents = 0;

  for (const id of parsed.snackItemIds) {
    cents += priceCents(catalog, "snackPricesCents", id);
  }
  for (const id of parsed.alwaysOnboardItemIds) {
    cents += priceCents(catalog, "alwaysOnboardPricesCents", id);
  }
  for (const id of [...parsed.charcuterie.meats, ...parsed.charcuterie.cheeses, ...parsed.charcuterie.complements]) {
    cents += priceCents(catalog, "charcuteriePricesCents", id);
  }

  return cents;
}

function barCost(barOrder: Record<string, unknown>, catalog: PricingCatalog): number {
  let cents = 0;

  const spirits = barOrder.spirits as
    | Record<string, Array<{ catalogItemId?: string | null; quantity?: number | null }>>
    | undefined;
  if (spirits) {
    for (const items of Object.values(spirits)) {
      for (const item of items ?? []) {
        if (item.catalogItemId) {
          const qty = Math.max(1, item.quantity ?? 1);
          cents += priceCents(catalog, "beveragePricesCents", item.catalogItemId) * qty;
        }
      }
    }
  }

  for (const key of ["wines", "beers", "mixers"] as const) {
    const items = barOrder[key] as Array<{ catalogItemId?: string | null; quantity?: number | null }> | undefined;
    for (const item of items ?? []) {
      if (item.catalogItemId) {
        const qty = Math.max(1, item.quantity ?? 1);
        cents += priceCents(catalog, "beveragePricesCents", item.catalogItemId) * qty;
      }
    }
  }

  return cents;
}

/** Returns total trip cost in USD dollars (from cent math). */
export function calculateTripCostUsd(input: TripCostInput): number {
  const guestPax = Math.max(0, input.adultCount) + Math.max(0, input.childCount);
  let totalCents = 0;

  for (const day of input.itinerary) {
    for (const meal of day.meals) {
      totalCents += mealDishCosts(meal, guestPax, input.catalog);
    }
  }

  totalCents += snacksCost(input.snacksData, input.catalog);
  totalCents += barCost(input.barOrder, input.catalog);

  return totalCents / 100;
}
