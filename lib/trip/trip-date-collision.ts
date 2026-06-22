import type { TripStatus } from "@/lib/types/database";

/** Statuses that block the calendar (submitted = confirmed reservation; active = in progress). */
export const BLOCKING_TRIP_STATUSES: TripStatus[] = ["submitted", "active"];

export const TRIP_DATES_UNAVAILABLE_MESSAGE =
  "Las fechas seleccionadas ya están ocupadas por otra reserva activa.";

/** Two inclusive date ranges overlap when startA <= endB && startB <= endA. */
export function dateRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA <= endB && startB <= endA;
}
