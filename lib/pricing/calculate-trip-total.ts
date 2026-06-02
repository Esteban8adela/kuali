import { getCrewCount } from "./crew";

interface MealCostInput {
  adults: number;
  children: number;
  perPlateCostCents: number;
}

export function calculateMealCostWithCrew(input: MealCostInput) {
  const guests = input.adults + input.children;
  const crew = getCrewCount(input.adults, input.children);
  const totalPeople = guests + crew;
  return totalPeople * input.perPlateCostCents;
}

