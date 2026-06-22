import type { MenuDayPlan } from "@/lib/guest/menu-itinerary";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function addId(ids: Set<string>, value: string | null | undefined) {
  if (value && UUID_RE.test(value)) ids.add(value);
}

function addIds(ids: Set<string>, values: string[] | undefined) {
  for (const value of values ?? []) {
    addId(ids, value);
  }
}

export function collectDishIdsFromItinerary(itinerary: MenuDayPlan[]): string[] {
  const ids = new Set<string>();

  for (const day of itinerary) {
    for (const meal of day.meals) {
      addId(ids, meal.selected_dish_id);
      addId(ids, meal.selected_appetizer_id);
      addId(ids, meal.selected_main_id);
      addId(ids, meal.selected_dessert_id);
      addId(ids, meal.selected_kids_dish_id);
      addIds(ids, meal.selected_dishes);
      addIds(ids, meal.selected_appetizers);
      addIds(ids, meal.selected_mains);
      addIds(ids, meal.dishes);
    }
  }

  return [...ids];
}
