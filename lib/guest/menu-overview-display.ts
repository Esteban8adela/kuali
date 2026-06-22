import type { MenuDayPlan, MenuMealBlock } from "@/lib/guest/menu-itinerary";

export interface MenuDishRow {
  label: string;
  value: string | null;
}

export function mealByKey(meals: MenuMealBlock[], key: string): MenuMealBlock | undefined {
  return meals.find((meal) => meal.key === key);
}

export function resolveDishName(
  id: string | null | undefined,
  dishNames: Record<string, string>,
  pending: string
): string | null {
  if (!id) return null;
  return dishNames[id] ?? pending;
}

export function breakfastDishRows(
  meal: MenuMealBlock | undefined,
  dishNames: Record<string, string>,
  pending: string,
  labels: { breakfastDish: string; kidsMenu: string }
): MenuDishRow[] {
  const rows: MenuDishRow[] = [
    {
      label: labels.breakfastDish,
      value: resolveDishName(meal?.selected_dish_id, dishNames, pending),
    },
  ];
  const kids = meal?.kidsMenuCount ?? 0;
  if (kids > 0) {
    const kidsDish = resolveDishName(meal?.selected_kids_dish_id, dishNames, pending);
    rows.push({
      label: labels.kidsMenu,
      value: kidsDish ? `${kids}× ${kidsDish}` : `${kids}×`,
    });
  }
  return rows;
}

export function lunchDishRows(
  meal: MenuMealBlock | undefined,
  dishNames: Record<string, string>,
  pending: string,
  labels: {
    appetizer: string;
    mainCourse: string;
    dessert: string;
    kidsMenu: string;
  }
): MenuDishRow[] {
  const rows: MenuDishRow[] = [
    {
      label: labels.appetizer,
      value: resolveDishName(meal?.selected_appetizer_id, dishNames, pending),
    },
    {
      label: labels.mainCourse,
      value: resolveDishName(meal?.selected_main_id, dishNames, pending),
    },
    {
      label: labels.dessert,
      value: resolveDishName(meal?.selected_dessert_id, dishNames, pending),
    },
  ];
  const kids = meal?.kidsMenuCount ?? 0;
  if (kids > 0) {
    const kidsDish = resolveDishName(meal?.selected_kids_dish_id, dishNames, pending);
    rows.push({
      label: labels.kidsMenu,
      value: kidsDish ? `${kids}× ${kidsDish}` : `${kids}×`,
    });
  }
  return rows;
}

export function dinnerDishRows(
  meal: MenuMealBlock | undefined,
  dishNames: Record<string, string>,
  pending: string,
  labels: { dinnerDish: string; kidsMenu: string }
): MenuDishRow[] {
  const rows: MenuDishRow[] = [
    {
      label: labels.dinnerDish,
      value: resolveDishName(meal?.selected_dish_id, dishNames, pending),
    },
  ];
  const kids = meal?.kidsMenuCount ?? 0;
  if (kids > 0) {
    const kidsDish = resolveDishName(meal?.selected_kids_dish_id, dishNames, pending);
    rows.push({
      label: labels.kidsMenu,
      value: kidsDish ? `${kids}× ${kidsDish}` : `${kids}×`,
    });
  }
  return rows;
}

export function renderMealRows(rows: MenuDishRow[], pending: string): MenuDishRow[] {
  return rows.filter((row) => row.value && row.value !== pending);
}

export type { MenuDayPlan };
