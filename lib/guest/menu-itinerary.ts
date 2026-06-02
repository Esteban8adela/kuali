export interface MenuMealBlock {
  key: string;
  heaviness?: string | null;
  dishes?: string[];
}

export interface MenuDayPlan {
  date: string;
  meals: MenuMealBlock[];
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

export function isMenuItineraryComplete(itinerary: MenuDayPlan[]): boolean {
  if (!itinerary.length) return false;
  return itinerary.every((day) =>
    day.meals.every(
      (meal) =>
        Boolean(meal.heaviness?.trim()) &&
        (meal.dishes ?? []).some((d) => d.trim().length > 0)
    )
  );
}

export interface MenuMealWithKids extends MenuMealBlock {
  kidsMenuCount?: number;
  kidsMenuNotes?: string;
}

export function isKidsMenuConfigValid(
  itinerary: Array<{ meals: MenuMealWithKids[] }>
): boolean {
  return itinerary.every((day) =>
    day.meals.every((meal) => {
      const count = meal.kidsMenuCount ?? 0;
      if (count <= 0) return true;
      return Boolean(meal.kidsMenuNotes?.trim());
    })
  );
}

export function isMenuStepComplete(itinerary: MenuDayPlan[]): boolean {
  return isMenuItineraryComplete(itinerary) && isKidsMenuConfigValid(itinerary);
}
