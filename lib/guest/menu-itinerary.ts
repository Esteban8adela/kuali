export interface MenuMealBlock {
  key: string;
  heaviness?: string | null;
  kidsMenuCount?: number;
  /** @deprecated replaced by selected_kids_dish_id */
  kidsMenuNotes?: string;
  selected_dish_id?: string | null;
  selected_appetizer_id?: string | null;
  selected_main_id?: string | null;
  selected_dessert_id?: string | null;
  selected_kids_dish_id?: string | null;
  /** @deprecated multi-select */
  selected_dishes?: string[];
  selected_appetizers?: string[];
  selected_mains?: string[];
  /** @deprecated legacy free-text entries */
  dishes?: string[];
}

export interface MenuDayPlan {
  date: string;
  meals: MenuMealBlock[];
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function firstUuid(ids: string[] | undefined): string | null {
  const found = (ids ?? []).find((id) => UUID_RE.test(id));
  return found ?? null;
}

function resolveDishId(
  single: string | null | undefined,
  fromArray: string[] | undefined,
  legacy: string[] | undefined
): string | null {
  if (single && UUID_RE.test(single)) return single;
  const fromList = firstUuid(fromArray);
  if (fromList) return fromList;
  return firstUuid(legacy);
}

export function parseMenuOrder(menuOrder: unknown): MenuDayPlan[] {
  if (!menuOrder || typeof menuOrder !== "object") return [];
  const itinerary = (menuOrder as { itinerary?: unknown }).itinerary;
  return Array.isArray(itinerary) ? (itinerary as MenuDayPlan[]) : [];
}

export function parseMenuItinerary(customNotes: string | null | undefined): MenuDayPlan[] {
  if (!customNotes) return [];
  try {
    const parsed = JSON.parse(customNotes) as { itinerary?: MenuDayPlan[] };
    return Array.isArray(parsed.itinerary) ? parsed.itinerary : [];
  } catch {
    return [];
  }
}

export function resolveMenuItinerary(
  menuOrder: unknown,
  customNotes: string | null | undefined
): MenuDayPlan[] {
  const fromOrder = parseMenuOrder(menuOrder);
  if (fromOrder.length > 0) return fromOrder;
  return parseMenuItinerary(customNotes);
}

function mealHasHeaviness(meal: MenuMealBlock): boolean {
  return Boolean(meal.heaviness?.trim());
}

function mealHasRequiredDishes(meal: MenuMealBlock): boolean {
  if (!mealHasHeaviness(meal)) return false;

  if (meal.key === "lunch") {
    const mainId = resolveDishId(
      meal.selected_main_id,
      meal.selected_mains,
      meal.dishes
    );
    return Boolean(mainId);
  }

  const dishId = resolveDishId(meal.selected_dish_id, meal.selected_dishes, meal.dishes);
  return Boolean(dishId);
}

/** Breakfast + lunch main + dinner required per meal block; lunch starter optional. */
export function isMenuMealComplete(meal: MenuMealBlock): boolean {
  return mealHasRequiredDishes(meal);
}

export function isMenuItineraryComplete(itinerary: MenuDayPlan[]): boolean {
  if (!itinerary.length) return false;
  return itinerary.every((day) => day.meals.every((meal) => isMenuMealComplete(meal)));
}

export interface MenuMealWithKids extends MenuMealBlock {
  kidsMenuCount?: number;
  selected_kids_dish_id?: string | null;
}

function resolveKidsDishId(meal: MenuMealBlock): string | null {
  const id = meal.selected_kids_dish_id?.trim();
  if (!id) return null;
  if (UUID_RE.test(id)) return id;
  return null;
}

export function isKidsMenuConfigValid(
  itinerary: Array<{ meals: MenuMealWithKids[] }>
): boolean {
  return itinerary.every((day) =>
    day.meals.every((meal) => {
      const count = meal.kidsMenuCount ?? 0;
      if (count <= 0) return true;
      return Boolean(resolveKidsDishId(meal));
    })
  );
}

export function isMenuStepComplete(itinerary: MenuDayPlan[]): boolean {
  return isMenuItineraryComplete(itinerary) && isKidsMenuConfigValid(itinerary);
}
