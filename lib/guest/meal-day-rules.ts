export type MealKey = "breakfast" | "lunch" | "dinner";

/**
 * Yacht meal-service rules by charter day:
 * - Arrival day (first): no breakfast
 * - Departure day (last, when multi-day): breakfast only
 * - Single-day charter: lunch + dinner (no breakfast)
 */
export function visibleMealKeysForDay(dayIndex: number, totalDays: number): MealKey[] {
  if (totalDays <= 0) return [];
  const isFirst = dayIndex === 0;
  const isLast = dayIndex === totalDays - 1;

  if (isFirst && isLast) {
    return ["lunch", "dinner"];
  }
  if (isFirst) {
    return ["lunch", "dinner"];
  }
  if (isLast) {
    return ["breakfast"];
  }
  return ["breakfast", "lunch", "dinner"];
}

export function isMealVisibleOnDay(
  mealKey: MealKey,
  dayIndex: number,
  totalDays: number
): boolean {
  return visibleMealKeysForDay(dayIndex, totalDays).includes(mealKey);
}
