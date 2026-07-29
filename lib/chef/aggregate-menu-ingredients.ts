import type { MenuDayPlan, MenuMealBlock } from "@/lib/guest/menu-itinerary";
import { resolveMealPortions } from "@/lib/pricing/calculate-trip-cost";

export interface DishRecipeForAggregation {
  id: string;
  recipe: Array<{
    ingredient_id: string;
    quantity_per_pax: number;
    ingredient?: {
      id: string;
      name: string;
      unit: string;
      cost_per_unit: number;
    } | null;
  }>;
}

export interface AggregatedIngredientRow {
  ingredientId: string;
  name: string;
  unit: string;
  totalQuantity: number;
  /** Estimated cost in USD (cost_per_unit is stored as USD dollars). */
  estimatedCostUsd: number;
}

function mealDishIds(meal: MenuMealBlock, kind: "regular" | "kids"): string[] {
  const ids: string[] = [];
  if (kind === "kids") {
    if (meal.selected_kids_dish_id) ids.push(meal.selected_kids_dish_id);
    if (meal.selected_kids_dessert_id) ids.push(meal.selected_kids_dessert_id);
    return ids;
  }

  if (meal.key === "lunch") {
    if (meal.selected_appetizer_id) ids.push(meal.selected_appetizer_id);
    if (meal.selected_main_id) ids.push(meal.selected_main_id);
    if (meal.selected_dessert_id) ids.push(meal.selected_dessert_id);
  } else if (meal.selected_dish_id) {
    ids.push(meal.selected_dish_id);
  }
  return ids;
}

/**
 * Aggregate recipe ingredients across the trip menu.
 * Regular dishes × (adults + crew); kids dishes × children.
 */
export function aggregateMenuIngredients(
  itinerary: MenuDayPlan[],
  dishesById: Record<string, DishRecipeForAggregation>,
  adultCount: number,
  childCount: number,
  crewCount?: number
): AggregatedIngredientRow[] {
  const { adultPortions, childPortions } = resolveMealPortions({
    adultCount,
    childCount,
    crewCount,
  });

  const aggregated: Record<
    string,
    { name: string; unit: string; totalQuantity: number; costPerUnit: number }
  > = {};

  function addDish(dishId: string, pax: number) {
    if (pax <= 0) return;
    const dish = dishesById[dishId];
    if (!dish?.recipe?.length) return;

    for (const line of dish.recipe) {
      const ingredient = line.ingredient;
      if (!ingredient || !line.ingredient_id) continue;
      const qty = Number(line.quantity_per_pax) * pax;
      if (!Number.isFinite(qty) || qty <= 0) continue;

      const existing = aggregated[line.ingredient_id];
      if (existing) {
        existing.totalQuantity += qty;
      } else {
        aggregated[line.ingredient_id] = {
          name: ingredient.name,
          unit: ingredient.unit,
          totalQuantity: qty,
          costPerUnit: Number(ingredient.cost_per_unit) || 0,
        };
      }
    }
  }

  for (const day of itinerary) {
    for (const meal of day.meals) {
      for (const dishId of mealDishIds(meal, "regular")) {
        addDish(dishId, adultPortions);
      }
      if ((meal.kidsMenuCount ?? 0) > 0 && childPortions > 0) {
        for (const dishId of mealDishIds(meal, "kids")) {
          addDish(dishId, childPortions);
        }
      }
    }
  }

  return Object.entries(aggregated)
    .map(([ingredientId, row]) => ({
      ingredientId,
      name: row.name,
      unit: row.unit,
      totalQuantity: row.totalQuantity,
      estimatedCostUsd: row.totalQuantity * row.costPerUnit,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
