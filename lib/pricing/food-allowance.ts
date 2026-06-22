import { buildItineraryDates } from "@/lib/trip/itinerary-days";

/** Daily food allowance per adult (USD). */
export const COST_PER_ADULT_DAY = 120;

/** Daily food allowance per child (USD). */
export const COST_PER_CHILD_DAY = 60;

export function tripFoodAllowanceDays(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): number {
  const dates = buildItineraryDates(startDate, endDate);
  if (dates.length > 0) return dates.length;
  return 1;
}

export function calculateFoodAllowanceUsd(
  adults: number,
  children: number,
  startDate: string | null | undefined,
  endDate: string | null | undefined
): number {
  const days = tripFoodAllowanceDays(startDate, endDate);
  const adultTotal = Math.max(0, adults) * COST_PER_ADULT_DAY * days;
  const childTotal = Math.max(0, children) * COST_PER_CHILD_DAY * days;
  return adultTotal + childTotal;
}
